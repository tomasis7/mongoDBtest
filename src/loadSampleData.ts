const { MongoClient } = require("mongodb");

const sampleMovies = [
  {
    title: "Back to the Future",
    year: 1985,
    plot: "Marty McFly, a 17-year-old high school student, is accidentally sent thirty years into the past in a time-traveling DeLorean invented by his close friend, the eccentric scientist Doc Brown.",
    genre: ["Adventure", "Comedy", "Sci-Fi"],
    director: "Robert Zemeckis",
  },
  {
    title: "The Shawshank Redemption",
    year: 1994,
    plot: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
    genre: ["Drama"],
    director: "Frank Darabont",
  },
  {
    title: "Pulp Fiction",
    year: 1994,
    plot: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
    genre: ["Crime", "Drama"],
    director: "Quentin Tarantino",
  },
];

async function loadSampleData() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const database = client.db("sample_mflix");
    const movies = database.collection("movies");

    // Drop existing collection if it exists
    await movies
      .drop()
      .catch(() => console.log("No existing collection to drop"));

    // Insert sample movies
    const result = await movies.insertMany(sampleMovies);
    console.log(`${result.insertedCount} movies were inserted`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

loadSampleData().catch(console.error);
