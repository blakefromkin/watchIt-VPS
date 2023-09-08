class Model {
  constructor() {
    this.allMovies = [];
    this.watchedMovies = [];
    this.genres = {};
    this.watchedGenres = {};
  }

  // Populate the model's data structures
  async refreshMovies() {
    try {
      let response = await fetch("/movies/data");
      this.allMovies = await response.json();
      this.refreshWatchedMovies();
      this.refreshGenres(this.genres, this.allMovies);
      this.refreshGenres(this.watchedGenres, this.watchedMovies);
    } catch(err) {
      throw(err);
    }
  }

  // Populate this.watchedMovies array
  refreshWatchedMovies() {
    this.watchedMovies = this.allMovies.filter(movie => movie.watched);
  }

  // Refresh the specified genres object by referencing the corresponding movies array
  refreshGenres(genresObj, moviesArr) {
    Object.keys(genresObj).forEach(key => delete genresObj[key]);
    if (!moviesArr.length) return;

    moviesArr.forEach(movie => {
      if (!movie.genre) {
        if (genresObj.noGenre) {
          genresObj.noGenre.push(JSON.parse(JSON.stringify(movie)));
        } else {
          genresObj.noGenre = [JSON.parse(JSON.stringify(movie))];
        }
      } else {
        if (genresObj[movie.genre]) {
          genresObj[movie.genre].push(JSON.parse(JSON.stringify(movie)));
        } else {
          genresObj[movie.genre] = [JSON.parse(JSON.stringify(movie))];
        }
      }
    });
  }

  // Add a movie to the database and refresh the model
  async addMovie(data) {
    try {
      await fetch('/movies', {
        method: 'post',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      });
      await this.refreshMovies();
    } catch(err) {
      throw err;
    }
  }

  // Delete movie from the database and refresh the model
  async deleteMovie(id) {
    try {
      await fetch(`/movies/${id}`, {method: "delete"});
      await this.refreshMovies();
    } catch(err) {
      throw err;
    }
  }

  // Edit a movie in the database and refresh the model
  async editMovie(data, id) {
    try {
      await fetch(`/movies/${id}`, {
        method: 'put',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      });
      await this.refreshMovies();
    } catch(err) {
      throw err;
    }
  }

  // Retrieve a movie from this.allMovies. Id must be a string.
  getMovieById(id) {
    return this.allMovies.find(movie => id === String(movie.id));
  }
}