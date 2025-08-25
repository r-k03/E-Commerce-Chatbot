import {
  GoogleGenerativeAIEmbeddings,
  ChatGoogleGenerativeAI,
} from "@langchain/google-genai";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { StateGraph, Annotation } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { MongoClient } from "mongodb";
import { z } from "zod";
import "dotenv/config";
import { resolve } from "path";
import { error } from "console";
import { index } from "langchain/indexes";
import { TypeOf } from "zod/v4";
import { threadId } from "worker_threads";

async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 1; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (!(error instanceof Error)) {
        throw new Error(`Agent Failed: ${String(error)}`);
      }

      if (!("status" in error)) {
        throw new Error(`Agent Failed: ${error.message}`);
      }

      if (error.status === 429 && i < maxRetries) {
        const backoff = Math.min(1000 * Math.pow(2, i), 30000);
        console.error(`Rate Limit Reached. Retrying in ${backoff} seconds.`);
        await new Promise((resolve) => setTimeout(resolve, backoff));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Exceeded Max Retries Allowed");
}

export async function callAgent(
  client: MongoClient,
  query: string,
  id: string
) {
  try {
    const dbName = "inventory_database";
    const db = client.db(dbName);
    const collection = db.collection("items");

    const GraphState = Annotation.Root({
      messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => x.concat(y),
      }),
    });

    const itemLookup = tool(
      async ({ query, n = 10 }) => {
        try {
          console.log(`Looking Up Query: ${query}`);
          const totalDocs = await collection.countDocuments();
          if (totalDocs === 0) {
            console.log("No Docs To Query");
            return JSON.stringify({
              error: "No items found in inventory",
              message: "Invenory Is Empty",
              count: 0,
            });
          }
          const sampleDocs = await collection.find({}).limit(3).toArray();
          console.log(`Sample Documents: ${sampleDocs}`);

          const dbConfig = {
            collection: collection,
            indexName: "vector_index",
            textKey: "embedding_text",
            embeddingKey: "embedding",
          };

          const vectorStore = new MongoDBAtlasVectorSearch(
            new GoogleGenerativeAIEmbeddings({
              apiKey: process.env.GOOGLE_API_KEY,
              model: "text-embedding-004",
            }),
            dbConfig
          );

          console.log("Conducting Vector Search");
          const results = await vectorStore.similaritySearchWithScore(query, n);
          console.log(`Search Return ${results.length} results`);

          if (results.length === 0) {
            console.log("Vector Search Failed, Trying Text Search");
            const textResults = await collection
              .find({
                $or: [
                  { item_name: { $regex: query, $options: "i" } },
                  { item_desc: { $regex: query, $options: "i" } },
                  { categories: { $regex: query, $options: "i" } },
                  { embedding_text: { $regex: query, $options: "i" } },
                ],
              })
              .limit(n)
              .toArray();

            console.log(`Text Search Returned ${textResults.length} results`);

            return JSON.stringify({
              results: textResults,
              searchType: "text",
              query,
              count: textResults.length,
            });
          }

          return JSON.stringify({
            results,
            searchType: "vector",
            query,
            count: results.length,
          });
        } catch (error) {
          console.log("Error in Item Lookup");
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          return JSON.stringify({
            error: "Inventory Search Failed",
            message: errorMsg,
            query,
          });
        }
      },
      {
        name: "item_lookup",
        description:
          "Gathers furniture item details from the inventory database",
        schema: z.object({
          query: z.string().describe("Search Query"),
          n: z
            .number()
            .optional()
            .default(10)
            .describe("Number of Results to Return"),
        }),
      }
    );
    const tools = [itemLookup];
    const toolNode = new ToolNode<typeof GraphState.State>(tools);

    const model = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-flash",
      temperature: 0,
      maxRetries: 0,
      apiKey: process.env.GOOGLE_API_KEY,
    }).bindTools(tools);

    const shouldContinue = function(state: typeof GraphState.State) {
      const messages = state.messages;
      const lastMessage = messages[messages.length - 1] as AIMessage;

      if (lastMessage.tool_calls?.length) {
        return "tools";
      }
      return "__end__";
    }

    const callModel = async function (state: typeof GraphState.State) {
      return retryWithExponentialBackoff(async () => {
        const prompt = ChatPromptTemplate.fromMessages([
          [
            "system", // System message defines the AI's role and behavior
            `You are a helpful E-commerce Chatbot Agent for a furniture store. 

IMPORTANT: You have access to an item_lookup tool that searches the furniture inventory database. ALWAYS use this tool when customers ask about furniture items, even if the tool returns errors or empty results.

When using the item_lookup tool:
- If it returns results, provide helpful details about the furniture items
- If it returns an error or no results, acknowledge this and offer to help in other ways
- If the database appears to be empty, let the customer know that inventory might be being updated

Current time: {time}`,
          ],
          new MessagesPlaceholder("messages"),
        ]);

        const formattedPrompt = await prompt.formatMessages({
          time: new Date().toISOString(),
          messages: state.messages,
        });

        const result = await model.invoke(formattedPrompt);
        return { messages: [result] };
      });
    }

    const workflow = new StateGraph(GraphState)
      .addNode("agent", callModel)
      .addNode("tools", toolNode)
      .addEdge("__start__", "agent")
      .addConditionalEdges("agent", shouldContinue)
      .addEdge("tools", "agent");

    const checkpointSaver = new MongoDBSaver({ client, dbName });
    const app = workflow.compile({ checkpointer: checkpointSaver });

    const finalState = await app.invoke(
      {
        messages: [new HumanMessage(query)],
      },
      {
        recursionLimit: 15,
        configurable: { thread_id: id },
      }
    );

    const response =
      finalState.messages[finalState.messages.length - 1].content;
    console.log(`Agent Response: ${response}`);
    return response;
  } catch (error) {
    console.error("Error in callAgent", error);

    if (!(error instanceof Error)) {
      throw new Error(`Agent Failed: ${String(error)}`);
    }

    if (!("status" in error)) {
      throw new Error(`Agent Failed: ${error.message}`);
    }

    if (error.status === 429) {
      throw new Error("Service Unavailable due to Rate Limits");
    } else if (error.status === 401) {
      throw new Error("API Authentication Failed");
    } else {
      throw new Error(`Agent Failed: ${error.message}`);
    }
  }
}