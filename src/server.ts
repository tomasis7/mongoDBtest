import express, { Request, Response, RequestHandler } from "express";
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
const homeHandler: RequestHandler = (_req, res) => {
  res.send("MongoDB API Server");
};

const futureMovieHandler: RequestHandler = async (_req, res) => {
  try {
    const database = client.db("sample_mflix");
    const movies = database.collection("movies");

    const query = { title: "Back to the Future" };
    const movie = await movies.findOne(query);

    if (!movie) {
      res.status(404).json({ error: "Movie not found" });
      return;
    }

    res.json(movie);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

const moviesHandler: RequestHandler = async (req, res) => {
  try {
    const database = client.db("sample_mflix");
    const movies = database.collection("movies");

    const limit = parseInt(req.query.limit as string) || 10;
    const result = await movies.find().limit(limit).toArray();

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

const searchMoviesHandler: RequestHandler = async (req, res) => {
  try {
    const database = client.db("sample_mflix");
    const movies = database.collection("movies");

    const searchTerm = req.query.q as string;
    if (!searchTerm) {
      res.status(400).json({ error: "Search term required" });
      return;
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
};

const collectionsHandler: RequestHandler = async (_req, res) => {
  try {
    const database = client.db("sample_mflix");
    const collections = await database.listCollections().toArray();

    res.json(collections.map((col) => col.name));
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Register routes
app.get("/", homeHandler);
app.get("/movies/future", futureMovieHandler);
app.get("/movies", moviesHandler);
app.get("/movies/search", searchMoviesHandler);
app.get("/collections", collectionsHandler);

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
