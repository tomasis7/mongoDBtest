import express from "express";
import { MongoClient } from "mongodb";

const app = express();
const port = 3000;

// MongoDB connection
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

// Middleware
app.use(express.json());

// Connect to MongoDB
async function connectToMongo() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    return client.db("sample_mflix");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
}

// Routes
app.get("/", (req, res) => {
  res.send("MongoDB API Server");
});

app.get("/movies/future", async (req, res) => {
  try {
    const database = client.db("sample_mflix");
    const movies = database.collection("movies");

    const query = { title: "Back to the Future" };
    const movie = await movies.findOne(query);

    res.json(movie);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Start server
async function startServer() {
  await connectToMongo();

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  await client.close();
  console.log("MongoDB connection closed");
  process.exit(0);
});

startServer().catch(console.error);
