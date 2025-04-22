import express from "express";
import { MongoClient } from "mongodb";

const app = express();
const port = 3000;

// MongoDB connection
const uri = "";
const client = new MongoClient(uri);

// Middleware
app.use(express.json());

// Connect to MongoDB
async function connectToMongo() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    // Optional: Ping the database to verify connection
    const adminDb = client.db().admin();
    const pingResult = await adminDb.ping();
    if (pingResult?.ok === 1) {
      console.log("MongoDB server ping successful.");
    } else {
      console.warn(
        "MongoDB server ping failed or returned unexpected result:",
        pingResult
      );
    }

    // Optional: Check if the target database exists
    const dbName = "sample_mflix";
    const databases = await adminDb.listDatabases();
    const dbExists = databases.databases.some((db) => db.name === dbName);
    if (dbExists) {
      console.log(`Database '${dbName}' found.`);
    } else {
      console.warn(`Database '${dbName}' not found.`);
    }

    return client.db(dbName);
  } catch (error) {
    console.error("Error connecting to or verifying MongoDB:", error);
    await client
      .close()
      .catch((closeErr) =>
        console.error(
          "Error closing MongoDB client after connection error:",
          closeErr
        )
      );
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

    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    res.json(movie);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// New routes to explore MongoDB data
app.get("/movies", async (req, res) => {
  try {
    const database = client.db("sample_mflix");
    const movies = database.collection("movies");

    const limit = parseInt(req.query.limit) || 10;
    const result = await movies.find().limit(limit).toArray();

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/movies/search", async (req, res) => {
  try {
    const database = client.db("sample_mflix");
    const movies = database.collection("movies");

    const searchTerm = typeof req.query.q === "string" ? req.query.q : "";
    if (!searchTerm) {
      return res.status(400).json({ error: "Search term required" });
    }

    const result = await movies
      .find({
        title: { $regex: searchTerm, $options: "i" },
      })
      .limit(10)
      .toArray();

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/collections", async (req, res) => {
  try {
    const database = client.db("sample_mflix");
    const collections = await database.listCollections().toArray();

    res.json(collections.map((col) => col.name));
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
