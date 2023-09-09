class Model {
  constructor() {
    this.allMovies = [];
    this.watchedMovies = [];
    this.genres = {};
    this.watchedGenres = {};
    this.username = null;
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

  // Populate this.username with the current username
  async refreshUsername() {
    try {
      let response = await fetch("/user");
      this.username = response.body;
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

class Controller {
  constructor(model, view) {
    this.model = model;
    this.view = view;

    this.currentMovieId = null;
    this.currentListId = "all";
    this.watchedListSelected = false;
    this.currentNavSelect = this.view.allMoviesTitle; // Initially select "All Movies" from the nav
  
    this.populateNav();
    this.renderAllMoviesList();
    this.updateTitleCount();

    this.bindInitialHandlers();
  }

  // Bind handlers at DOM content load
  bindInitialHandlers() {
    this.bindAddMovieHandler();
    this.bindToggleWatchedHandler();
    this.bindMovieTextClickHandler();
    this.bindDeleteHandler();
    this.bindNavClicksHandler();
    this.bindExitFormHandler();
    this.bindSaveHandler();
    this.bindMarkWatchedHandler();
  }

   // Update selected nav element and store element in this.currentNavSelect
  updateSelectedElement(prevElement, newElement) {
    this.view.updateSelectedElement(prevElement, newElement);
    this.currentNavSelect = newElement;
  }

  // Render movie list and update controller variables when nav element clicked
  navClicksHandler(e) {
    if (e.target.classList.contains("all-item-text")) { // Genre under "All Movies" clicked
      let genre = e.target.parentNode.getAttribute("data-genre");
      this.renderAllGenreList(genre);
      this.view.updateTitleText(genre);
      this.currentListId = genre;
      this.watchedListSelected = false;
      this.updateTitleCount();
      this.updateSelectedElement(this.currentNavSelect, e.target.parentNode);
    } else if (e.target.classList.contains("watched-item-text")) {  // Genre under "Watched Movies" clicked
      let genre = e.target.parentNode.getAttribute("data-genre");
      this.renderWatchedGenreList(genre);
      this.view.updateTitleText(genre);
      this.currentListId = genre;
      this.watchedListSelected = true;
      this.updateTitleCount();
      this.updateSelectedElement(this.currentNavSelect, e.target.parentNode);
    } else if (e.target === this.view.allMoviesTitle) { // "All Movies" clicked
      this.renderAllMoviesList();
      this.view.updateTitleText("All Movies");
      this.currentListId = "all";
      this.watchedListSelected = false;
      this.updateTitleCount();
      this.updateSelectedElement(this.currentNavSelect, e.target);
    } else if (e.target === this.view.watchedMoviesTitle) { // "Watched Movies" clicked
      this.renderWatchedMoviesList();
      this.view.updateTitleText("Watched Movies");
      this.currentListId = "watched";
      this.watchedListSelected = true;
      this.updateTitleCount();
      this.updateSelectedElement(this.currentNavSelect, e.target);
    }
  }

  // Bind handler for nav element clicks
  bindNavClicksHandler() {
    this.view.nav.addEventListener("click", this.navClicksHandler.bind(this));
  }

  // Bind handler for clicking out of modal
  bindExitFormHandler() {
    this.view.modalPageDiv.addEventListener("click", e => {
      if (e.target.matches('#modal-page')) {
        this.view.hide(e.target);
        this.currentMovieId = null;
      }
    });
  }

   // Render movie list for "All Movies"
   renderAllMoviesList() {
    let movies = [];
    let keys = Object.keys(this.model.genres);
    if (keys.length === 0) {
      this.view.renderMovieList({movies: []});
    } else {
      for (let key of keys) {
        this.model.genres[key].forEach(movie => {
          movie.genre = key;
          movies.push(movie);
        });
      }
      this.view.renderMovieList({movies});
    } 
  }

  // Render movie list for "Watched Movies"
  renderWatchedMoviesList() {
    let movies = [];
    let keys = Object.keys(this.model.watchedGenres);
    if (keys.length === 0) {
      this.view.renderMovieList({movies: []});
    } else {
      for (let key of keys) {
        this.model.watchedGenres[key].forEach(movie => {
          movie.genre = key;
          movies.push(movie);
        });
      }
      this.view.renderMovieList({movies});
    }
  }

   // Render movie list for a genre under "All Movies"
   renderAllGenreList(genre) {
    if (this.model.genres[genre]) {
      let movies = this.model.genres[genre].map(movie => {
        movie.genre = genre;
        return movie;
      });
      this.view.renderMovieList({movies});
    } else {
      this.view.renderMovieList({movies: []});
    }
  }

  // Render movie list for a genre under "Watched Movies"
  renderWatchedGenreList(genre) {
    if (this.model.watchedGenres[genre]) {
      let movies = this.model.watchedGenres[genre].map(movie => {
        movie.genre = genre;
        return movie;
      });
      this.view.renderMovieList({movies});
    } else {
      this.view.renderMovieList({movies: []});
    }
  }

  // Update count for current movie list based on current controller variable values
  updateTitleCount() {
    if (this.currentListId === "all") {
      this.view.setTitleCount(this.model.allMovies.length);
    } else if (this.currentListId === "watched") {
      this.view.setTitleCount(this.model.watchedMovies.length);
    } else if (!this.watchedListSelected) {
      if (this.model.genres[this.currentListId]) {
        this.view.setTitleCount(this.model.genres[this.currentListId].length);
      } else {
        this.view.setTitleCount('0');
      }
    } else {
      if (this.model.watchedGenres[this.currentListId]) {
        this.view.setTitleCount(this.model.watchedGenres[this.currentListId].length);
      } else {
        this.view.setTitleCount('0');
      }
    }
  }

  // Update count next to "All Movies" in the nav to current number of movies
  updateAllMoviesCount() {
    this.view.setAllMoviesCount(this.model.allMovies.length);
  }

  // Update count next to "Watched Movies" in the nav to current number of watched movies
  updateWatchedMoviesCount() {
    this.view.setWatchedCount(this.model.watchedMovies.length);
  }

  // Bind handler for the "add new movie" anchor
  bindAddMovieHandler() {
    this.view.addMovieAnchor.addEventListener("click", e => {
      e.preventDefault();
      this.view.resetForm();
      this.view.unhide(this.view.modalPageDiv);
    });
  }

  // Bind handler that brings up edit modal when movie text is clicked
  bindMovieTextClickHandler(e) {
    this.view.movieListDiv.addEventListener("click", e => {
      if (e.target.matches('.movie p')) {
        this.currentMovieId = e.target.parentNode.getAttribute("data-movieid");
        let movie = this.model.getMovieById(this.currentMovieId);
        this.view.populateEditForm(movie);
        this.view.unhide(this.view.modalPageDiv);
      }
    });
  }

  // Bind handler for modal's save button
  bindSaveHandler() {
    this.view.saveButton.addEventListener("click", async e => {
      e.preventDefault();
      if (this.view.title.value.trim().length < 1) {
        window.alert("Title must be at least 1 character.");
        return;
      }

      if (!this.currentMovieId) {   // Submit new movie
        await this.submitNewMovie();
        this.currentListId = "all";
        this.renderAllMoviesList();
        this.populateNav();
        this.updateTitleCount();
        this.view.updateTitleText("All Movies");
        this.updateSelectedElement(this.currentNavSelect, this.view.allMoviesTitle);
      } else {                      // Submit edited movie
        await this.submitEditedMovie();
        this.currentMovieId = null;
        this.preserveSelectedAndRefresh();
      }
      this.view.hide(this.view.modalPageDiv);
    });
  }

  // Bind handler for trash can icon clicks
  bindDeleteHandler() {
    this.view.movieListDiv.addEventListener("click", async e => {
      if (e.target.classList.contains("trash")) {
        e.preventDefault();

        if (window.confirm("Are you sure you want to delete this movie?")) {
          let movieId = e.target.parentNode.getAttribute("data-movieid");
          await this.model.deleteMovie(movieId);
          this.preserveSelectedAndRefresh();
        }
      } 
    });
  }

  // Bind click handler for modal's "Mark as watched" button
  bindMarkWatchedHandler() {
    this.view.markWatchedButton.addEventListener("click", async e => {
      e.preventDefault();
      if (!this.currentMovieId) {    // Currently adding a new movie
        window.alert("Cannot perform action on a new movie entry.");
      } else {                      // Currently editing an existing movie
        let movie = this.model.getMovieById(this.currentMovieId);
        movie.watched = true;
        await this.model.editMovie(movie, movie.id);

        this.currentMovieId = null;
        this.view.hide(this.view.modalPageDiv);
        this.refreshAfterUpdate();
      }
    });
  }

  // Submit new movie using form data
  async submitNewMovie() {
    let data = {
      title: this.view.title.value,
      year: this.view.yearSelect.value,
      notes: this.view.notes.value,
      watched: false
    };
    await this.model.addTodo(data);
  }
}