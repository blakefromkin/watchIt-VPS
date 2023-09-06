const config = require("./lib/config");
const express = require("express");
const morgan = require("morgan");
const session = require("express-session");
const store = require("connect-loki");
const PgPersistence = require("./lib/pg-persistence");
const catchError = require("./lib/catch-error");
const requiresAuthentication = require("./lib/requires-authentication");

const app = express();
const host = config.HOST;
const port = config.PORT;
const LokiStore = store(session);

app.use(morgan("common"));
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  cookie: {
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: "/",
    secure: false,
  },
  name: "movie-app",
  resave: false,
  saveUninitialized: true,
  secret: config.SECRET,
  store: new LokiStore({}),
}));

// Create a new datastore on res.locals
app.use((req, res, next) => {
  res.locals.store = new PgPersistence(req.session);
  next();
});

// Extract session info
app.use((req, res, next) => {
  res.locals.username = req.session.username;
  res.locals.signedIn = req.session.signedIn;
  next();
});

function isValidMovie(movie) {
  return (
    movie.title.length >= 3 &&
    movie.year.length === 4 &&
    movie.genre && movie.username &&
    movie.notes !== undefined &&
    movie.watched !== undefined &&
    movie.id
  );
}

app.get("/", (req, res) => {
  res.redirect("/movies");
});

// Sends HTML for a signed in user's homepage
app.get("/movies", requiresAuthentication, (req, res) => {
  res.sendFile("index.html");
});

// Sends HTML for the sign in page
app.get("/signin", (req, res) => {
  res.sendFile("sign-in.html");
});

// Handles first time sign up requests
app.post("/signup", catchError(async (req, res) => {
  let info = JSON.parse(req.body);

  let signedUp = await res.locals.store.addNewUser(info.username, info.password);
  if (signedUp) {
    req.session.username = info.username;
    req.session.signedIn = true;
    res.redirect("/movies");
  } else res.status(400).send("Username already exists.");
}));

// Handles returning user sign in requests
app.post("/signin", catchError(async (req, res) => {
  let info = JSON.parse(req.body);

  let valid = await res.locals.store.validateLogIn(info.username, info.password);
  if (valid) {
    req.session.username = info.username;
    req.session.signedIn = true;
    res.redirect("/movies");
  } else res.status(400).send("Invalid username and/or password.");
}));

// Handles sign out requests
app.post("/signout", (req, res) => {
  delete req.session.username;
  delete req.session.signedIn;
  res.redirect("/signin");
});

// Sends all movie data for the signed-in user in JSON format
app.get("/movies/data", requiresAuthentication, 
  catchError(async (req, res) => {
    let movies = await res.locals.store.allMovies();
    res.json(movies);
}));

// Adds a new movie
app.post("/movies", requiresAuthentication,
  catchError(async (req, res, next) => {
    let movie = JSON.parse(req.body);
    if (!isValidMovie(movie)) {
      res.status(400).send("Not a valid movie object.");
      next();
    }

    movie.year = +movie.year;
    let added = await res.locals.store.addMovie(movie);
    if (added) {
      res.status(200).send("Movie added.");
    } else res.status("Movie cannot be added.");
}));

// Updates existing movie
app.put("/movies/:id", requiresAuthentication,
  catchError(async (req, res, next) => {
    let movie = JSON.parse(req.body);
    if (!isValidMovie(movie)) {
      res.status(400).send("Not a valid movie object.");
      next();
    }

    let id = +req.params["id"];
    movie.year = +movie.year;
    let updated = await res.locals.store.updateMovie(id, movie);
    if (updated) {
      res.status(200).send("Movie updated.");
    } else res.status(400).send("Movie cannot be updated");

}));

// Deletes movie
app.delete("/movies/:id", requiresAuthentication,
  catchError(async (req, res, next) => {
    let id = +req.params["id"];
    let deleted = res.locals.store.deleteMovie(id);
    if (deleted) {
      res.status(200).send("Movie deleted");
    } else res.status(404).send("Movie not found.");
}));

// Error handler
app.use((err, req, res, _next) => {
  console.log(err); 
  res.status(400).send(err.message);
});

// Listener
app.listen(port, host, () => {
  console.log(`WatchIt is listening on port ${port} of ${host}!`);
});


