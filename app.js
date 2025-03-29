const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");
let db = null;

// Initialize DB and server
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// Convert functions
const convertMovieToPascalCase = (dbObject) => ({
  movieName: dbObject.movie_name,
});

const convertMovieDetails = (dbObject) => ({
  movieId: dbObject.movie_id,
  directorId: dbObject.director_id,
  movieName: dbObject.movie_name,
  leadActor: dbObject.lead_actor,
});

const convertDirectorDetails = (dbObject) => ({
  directorId: dbObject.director_id,
  directorName: dbObject.director_name,
});

// GET all movie names
app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `SELECT movie_name FROM movie;`;
  const moviesArray = await db.all(getMoviesQuery);
  response.send(moviesArray.map(convertMovieToPascalCase));
});

// POST a movie
app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const insertQuery = `
    INSERT INTO movie (director_id, movie_name, lead_actor)
    VALUES (?, ?, ?);`;
  await db.run(insertQuery, [directorId, movieName, leadActor]);
  response.send("Movie Successfully Added");
});

// GET a specific movie
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const query = `SELECT * FROM movie WHERE movie_id = ?;`;
  const movie = await db.get(query, [movieId]);
  response.send(convertMovieDetails(movie));
});

// PUT (update) movie details
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const { directorId, movieName, leadActor } = request.body;
  const updateQuery = `
    UPDATE movie 
    SET director_id = ?, movie_name = ?, lead_actor = ?
    WHERE movie_id = ?;`;
  await db.run(updateQuery, [directorId, movieName, leadActor, movieId]);
  response.send("Movie Details Updated");
});

// DELETE a movie
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteQuery = `DELETE FROM movie WHERE movie_id = ?;`;
  await db.run(deleteQuery, [movieId]);
  response.send("Movie Removed");
});

// GET all directors
app.get("/directors/", async (request, response) => {
  const query = `SELECT * FROM director;`;
  const directors = await db.all(query);
  response.send(directors.map(convertDirectorDetails));
});

// GET all movies of a director
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const query = `
    SELECT movie_name 
    FROM movie 
    WHERE director_id = ?;`;
  const movies = await db.all(query, [directorId]);
  response.send(movies.map(convertMovieToPascalCase));
});

module.exports = app;
