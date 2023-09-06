const { dbQuery } = require("./db-query");
const bcrypt = require("bcrypt");

module.exports = class PgPersistence {
  constructor(session) {
    this.username = session.username;
  }

  // Returns true if the username/password combo appears in the users table. 
  // False if not.
  async validateLogIn(username, password) {
    const FIND_HASHED_PASSWORD = "SELECT password FROM users" +
    "  WHERE username = $1";
    let result = await dbQuery(FIND_HASHED_PASSWORD, username);
    if (result.rowCount === 0) return false;

    return await bcrypt.compare(password, result.rows[0].password);
  }

  // Add new user to users table. Returns true on success, false on failure.
  async addNewUser(username, password) {
    const ADD_USER = "INSERT INTO users (username, password)" + 
    " VALUES ($1, $2)";
    
    let hashedPass = await bcrypt.hash(password, 10);
    let result = await dbQuery(ADD_USER, username, hashedPass);

    return result.rowCount > 0;
  }

  // Returns all the movies for the specified username, 
  // sorted alphabetically by title
  async allMovies() {
    const ALL_MOVIES = "SELECT * FROM movies" +
    " WHERE username = $1" + 
    " ORDER BY lower(title) ASC";

    let result = await dbQuery(ALL_MOVIES, this.username);
    return result.rows;
  }

  // Delete a movie with the specified id. Id must be an integer.
  // Returns true on success, false on failure.
  async deleteMovie(movieId) {
    const DELETE_MOVIE = "DELETE FROM movies WHERE id = $1 AND username = $2";
    let result = await dbQuery(DELETE_MOVIE, movieId, this.username);

    return result.rowCount > 0;
  }

  // Add a new movie with the provided attributes object. 
  // Returns true on success, false on failure
  async addMovie(info) {
    const INSERT_MOVIE = "INSERT INTO movies (title, year, genre, watched, notes, username)" +
      " VALUES ($1, $2, $3, $4, $5, $6)";
      
    let result = await dbQuery(INSERT_MOVIE, info.title, info.year, 
      info.genre, info.watched, info.notes, this.username);
    
    return result.rowCount > 0;
  }

  // Update movie with the specified id using the provided attributes object
  // Returns true on success, false on failure
  async updateMovie(id, info) {
    const UPDATE = "UPDATE movies SET title = $1, year = $2, genre = $3, " +
      "watched = $4, notes = $5 WHERE id = $6 AND username = $7";
    
    let result = await dbQuery(UPDATE, info.title, info.year, info.genre,
      info.watched, info.notes, id, this.username);

    return result.rowCount > 0;
  }
};