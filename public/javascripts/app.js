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

class View {
  constructor() {
    this.nav = document.querySelector("nav");
    this.allMoviesDiv = document.getElementById("all-movies");
    this.allMoviesTitle = document.getElementById("all-movies-title");
    this.allMoviesCount = document.getElementById("all-count");
    this.watchedMoviesDiv = document.getElementById("watched-movies");
    this.watchedMoviesTitle = document.getElementById("watched-movies-title");
    this.watchedMoviesCount = document.getElementById("watched-count");
    this.titleText = document.getElementById("title-text");
    this.titleCount = document.getElementById("title-count");
    this.movieListDiv = document.getElementById("movie-list");
    this.modalPageDiv = document.getElementById("modal-page");
    this.addMovieAnchor = document.getElementById("add-movie");

    this.title = document.getElementById("title");
    this.yearSelect = document.getElementById("year");
    this.genreSelect = document.getElementById("genre");
    this.notes = document.getElementById("notes");
    this.saveButton = document.getElementById("save");
    this.markWatchedButton = document.getElementById("mark-watched");

    this.movieListTemplate = Handlebars.compile(document.getElementById("movieListTemplate").innerHTML);

    this.populateFormSelects();
  }

  // Hide element
  hide(element) {
    element.classList.add("hidden");
  }

  // Show element
  unhide(element) {
    element.classList.remove("hidden");
  }

   // Populate the options in the modal's select elements
   populateFormSelects() {
    const genres = ['Comedy', 'Drama', 'Thriller', 'Family', 'Sci-Fi', 'Adventure',
                    'Historical', 'Romance', 'Action', 'Documentary', 'Animated', 'Western'];

    let genreHTML = '';
    let yearHTML = '';
    
    genres.forEach(genre => {
      genreHTML += `<option value="${genre}">${genre}</option>`;
    });
    for (let count = 1920; count <= new Date().getFullYear(); count += 1) {
      yearHTML += `<option value="${count}">${count}</option>`;
    }

    this.genreSelect.innerHTML += dayHTML;
    this.yearSelect.innerHTML += yearHTML;
  }

  // Clear modal values
  resetForm() {
    let formElements = [this.genreSelect, this.yearSelect, this.title, this.notes];
    formElements.forEach(element => element.value = "");
  }

  // Set count next to the current movie list genre title
  setTitleCount(count) {
    this.titleCount.textContent = count;
  }

  // Set count of "All Movies" in the nav
  setAllMoviesCount(count) {
    this.allMoviesCount.textContent = count;
  }

  // Set count of "Watched Movies" in the nav
  setWatchedCount(count) {
    this.watchedMoviesCount.textContent = count;
  }

  // Render the nav genres under "All Movies"
  renderNavAllMovies(genresObj) {
    let list = document.getElementById("all-list");
    if (list) list.remove();
    if (Object.keys(genresObj).length === 0) return;

    let html = '<ul id="all-list">';
    for (let key of Object.keys(genresObj)) {
      let text = key === "noGenre" ? "No Genre" : key;
      html += `<li data-genre=${key}>` +
              `<p class="all-item-text">${text} <span class="count">${genresObj[key].length}</p>` +
              `</li>`
    }
    html += '</ul>';
    this.allMoviesDiv.insertAdjacentHTML("beforeend", html);
  }

  // Render the nav genres under "Watched Movies"
  renderNavWatchedMovies(watchedGenresObj) {
    let list = document.getElementById("watched-list");
    if (list) list.remove();
    if (Object.keys(watchedGenresObj).length === 0) return;

    let html = '<ul id="watched-list">';
    for (let key of Object.keys(watchedGenresObj)) {
      let text = key === "noGenre" ? "No Genre" : key;
      html += `<li data-genre=${key}>` +
              `<p class="watched-item-text">${text} <span class="count">${watchedGenresObj[key].length}</p>` +
              `</li>`
    }
    html += '</ul>'
    this.watchedMoviesDiv.insertAdjacentHTML("beforeend", html);
  }

  // Prepare the data to pass to the movie list template, sort the movies by watched status, 
  // And render the template
  renderMovieList(dataObj) {
    if (dataObj.movies.length === 0) {
      this.movieListDiv.innerHTML = '';
    } else {
      dataObj.movies.sort((movieA, movieB) => {
        if (movieA.watched && !movieB.watched) return 1;
        if (movieB.watched && !movieA.watched) return -1;
        return 0;
      });

      dataObj.movies = dataObj.movies.map(movie => {
        if (!movie.watched) {
          movie.watched = "";
          return movie;
        } else {
          movie.watched = "watched";
          return movie;
        }
      });
      this.movieListDiv.innerHTML = this.movieListTemplate(dataObj);
    }
  }

  // Render the genre title of the current movie list
  updateTitleText(text) {
    if (text === "noGenre") text = "No Genre";
    this.titleText.textContent = text;
  }

  // Pre populate values of the modal for editing a movie
  populateEditForm(movieData) {
    this.title.value = movieData.title;
    this.notes.value = movieData.notes;
    this.yearSelect.value = movieData.year;
    this.genreSelect.value = movieData.genre;
  }

  // Highlight a new selected element in the nav. Remove highlight from previous selected element.
  updateSelectedElement(prevElement, newElement) {
    if (prevElement) prevElement.classList.remove("selected");
    this.selectNavElement(newElement);
  }

  // Highlight the specified nav element
  selectNavElement(element) {
    element.classList.add("selected");
  }
}