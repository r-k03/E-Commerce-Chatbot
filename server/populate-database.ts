import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { MongoClient } from "mongodb";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { z } from "zod";
import "dotenv/config";

const client = new MongoClient(process.env.MONGO_URI as string);

const bot = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
  temperature: 0.7,
  apiKey: process.env.GOOGLE_API_KEY,
});

const itemSchema = z.object({
  item_id: z.string(),
  item_name: z.string(),
  item_desc: z.string(),
  brand: z.string(),
  manufacturer_address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postal_code: z.string(),
    country: z.string(),
  }),
  prices: z.object({
    full_price: z.number(),
    sale_price: z.number(),
  }),
  categories: z.array(z.string()),
  reviews: z.array(
    z.object({
      review_date: z.string(),
      rating: z.number(),
      comment: z.string(),
    })
  ),
  notes: z.string(),
});

type Item = z.infer<typeof itemSchema>;

const parser = StructuredOutputParser.fromZodSchema(z.array(itemSchema));

async function dbSetup(): Promise<void> {
  const db = client.db("inventory_database");
  const collections = await db.listCollections({ name: "items" }).toArray();

  if (collections.length === 0) {
    await db.createCollection("items");
    console.log("Created New Items Collection");
  } else {
    console.log("COllection Items Already Exists");
  }
}

async function createVectorIndex(): Promise<void> {
  try {
    const db = client.db("inventory_database");
    const collection = db.collection("items");
    await collection.dropIndexes();
    const searchIndex = {
      name: "vector_index",
      type: "vectorSearch",
      definition: {
        fields: [
          {
            type: "vector",
            path: "embedding",
            numDimensions: 768,
            similarity: "cosine",
          },
        ],
      },
    };
    await collection.createSearchIndex(searchIndex);
  } catch (error) {
    console.error("Failed to Create Vector Search Index", error);
  }
}

async function createItemData(): Promise<Item[]> {
  const prompt = `You are an assistant that generates furniture store item data. Generate 15 furniture store items. Each record should include the following fields: item_id, item_name, item_description, brand, manufacturer_address, prices, categories, user_reviews, notes. Ensure variety in the data and realistic values.

  ${parser.getFormatInstructions()}`; // Add format instructions from parser

  const response = await bot.invoke(prompt);

  return parser.parse(response.content as string);
}

async function createItemSummary(item: Item): Promise<string> {
  // Return Promise for async compatibility
  return new Promise((resolve) => {
    const manufacturerDetails = `Made in ${item.manufacturer_address.country}`;
    const categories = item.categories.join(", ");
    // Convert user reviews array into readable text format
    const userReviews = item.reviews
      .map(
        (review) =>
          `Rated ${review.rating} on ${review.review_date}: ${review.comment}`
      )
      .join(" ");

    const basicInfo = `${item.item_name} ${item.item_desc} from the brand ${item.brand}`;
    const price = `At full price it costs: ${item.prices.full_price} USD, On sale it costs: ${item.prices.sale_price} USD`;
    const notes = item.notes;

    // Combine all information into summary for vector search
    const summary = `${basicInfo}. Manufacturer: ${manufacturerDetails}. Categories: ${categories}. Reviews: ${userReviews}. Price: ${price}. Notes: ${notes}`;

    resolve(summary);
  });
}

async function populateDatabase(): Promise<void> {
  try {
    // Establish connection to MongoDB Atlas
    await client.connect()
    // Ping database to verify connection works
    await client.db("admin").command({ ping: 1 })

    await dbSetup()
    await createVectorIndex()

    const db = client.db("inventory_database")
    const collection = db.collection("items")

    // Clear existing data from collection
    await collection.deleteMany({})
    console.log("Cleared existing data from items collection")
    
    // Generate new furniture data
    const syntheticData = await createItemData()

    // Process each item: create summary and prepare for vector storage
    const recordsWithSummaries = await Promise.all(
      syntheticData.map(async (record) => ({
        pageContent: await createItemSummary(record),
        metadata: {...record}
      }))
    )
    
    for (const record of recordsWithSummaries) {
      // Create vector embeddings and store in MongoDB Atlas using Gemini
      await MongoDBAtlasVectorSearch.fromDocuments(
        [record],
        new GoogleGenerativeAIEmbeddings({
          apiKey: process.env.GOOGLE_API_KEY,
          modelName: "text-embedding-004",
        }),
        {
          collection,
          indexName: "vector_index", // Name of vector search index
          textKey: "embedding_text", // Field name for searchable text
          embeddingKey: "embedding", // Field name for vector embeddings
        }
      )
      console.log("Successfully processed & saved record:", record.metadata.item_id)
    }
  } catch (error) {
    console.error("Error populating database:", error)
  } finally {
    await client.close()
  }
}

populateDatabase().catch(console.error)