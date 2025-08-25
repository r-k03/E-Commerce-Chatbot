import "dotenv/config";
import express, { Express, Request, Response } from "express";
import { MongoClient } from "mongodb";
import cors from "cors";
import { callAgent } from "./agent";

const app: Express = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGO_URI as string);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("DB Conn Successful");
    app.listen(PORT, () => {
      console.log(`Server Listening on Port ${PORT}`);
    });
  } catch (error) {
    throw new Error("Error Connecting to the Database/Starting Server");
  }
}

app.get("/", (req: Request, res: Response) => {
  res.send("LangGraph Server");
});

// Start New Conversation
app.post("/chat", async (req: Request, res: Response) => {
  const { message } = req.body;
  const id = Date.now().toString();
  try {
    const response = await callAgent(client, message, id);
    res.json({id, response});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Continue Existing Conversation
app.post("/chat/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { message } = req.body;
  try {
    const response = await callAgent(client, message, id);
    res.json({id, response});
  } catch (error) {
    console.error("Chat Error", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

startServer();
