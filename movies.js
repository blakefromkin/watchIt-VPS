const config = require("./lib/config");
const express = require("express");
const path = require("path");
const morgan = require("morgan");
const flash = require("express-flash");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const PgPersistence = require("./lib/pg-persistence");
const catchError = require("./lib/catch-error");
const requiresAuthentication = require("./lib/requires-authentication");

const app = express();
const host = config.HOST;
const port = config.PORT;

app.set("views", "./views");
app.set("view engine", "pug");

app.use(morgan("common"));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  cookie: {
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: "/",
    secure: true,
  },
  name: "movie-app",
  resave: false,
  saveUninitialized: true,
  secret: config.SECRET,
  store: MongoStore.create({ 
    mongoUrl: 'mongodb://127.0.0.1:27017/sessionDB',
    collection: 'sessions'
  }),
}));

app.use(flash());

// Create a new datastore on res.locals
app.use((req, res, next) => {
  res.locals.store = new PgPersistence(req.session);
  next();
});

// Extract session info
app.use((req, res, next) => {
  res.locals.username = req.session.username;
  res.locals.signedIn = req.session.signedIn;
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

function isValidMovie(movie) {
  let valid = (
    movie.title.length >= 1 &&
    (String(movie.year).length === 4 || movie.year === '') &&
    movie.username &&
    movie.genre !== undefined && 
    movie.notes !== undefined &&
    movie.watched !== undefined 
  );
  return valid;
}

function formatMovie(movie) {
  if (!movie.genre) movie.genre = '';
  if (!movie.year) movie.year = '';
  if (!movie.notes) movie.notes = '';
  return movie;
}

app.get("/", (req, res) => {
  res.redirect("/movies");
});

// Renders signed in user's homepage
app.get("/movies", requiresAuthentication, (req, res) => {
  res.render("movies");
});

// Renders sign in page
app.get("/signin", (req, res) => {
  res.render("signin", {flash: req.flash()});
});

// Handles first time sign up requests
app.post("/signup", catchError(async (req, res) => {
  let username = req.body.username.trim();
  let signedUp = await res.locals.store.addNewUser(username, req.body.password);
  if (signedUp) {
    req.session.username = username.toLowerCase();
    req.session.signedIn = true;
    req.session.save((err) => {
      if (err) {
        // Handle error
        console.error(err);
        res.status(500).send("An error occurred while saving the session.");
      } else {
        res.redirect("/movies");
      }
    });
  } else {
    req.flash("error", "Username already exists.");
    res.render("signin", {
      flash: req.flash(),
      username,
    });
  }
}));

// Handles returning user sign in requests
app.post("/signin", catchError(async (req, res) => {
  let username = req.body.username.trim();
  let valid = await res.locals.store.validateLogIn(username, req.body.password);
  if (valid) {
    req.session.username = username.toLowerCase();
    req.session.signedIn = true;
    req.session.save((err) => {
      if (err) {
        // Handle error
        console.error(err);
        res.status(500).send("An error occurred while saving the session.");
      } else {
        res.redirect("/movies");
      }
    });
  } else {
    req.flash("error", "Invalid Credentials.");
    res.render("signin", {
      flash: req.flash(),
      username,
    });
  }
}));

// Handles sign out requests
app.post("/signout", (req, res) => {
  delete req.session.username;
  delete req.session.signedIn;
  res.locals.username = null;
  res.locals.signedIn = false;
  req.session.destroy((err) => {
    if (err) {
      // Handle error
      console.error(err);
      res.status(500).send("An error occurred while destroying the session.");
    } else {
      req.flash("success", "Signed out.");
      res.render("signin", {flash: req.flash()});
    }
  });
});

// Sends current username string
app.get("/user", requiresAuthentication,
  (req, res) => res.status(200).send(res.locals.username)
);

// Sends all movie data for the signed-in user in JSON format
app.get("/movies/data", requiresAuthentication, 
  catchError(async (req, res) => {
    let movies = await res.locals.store.allMovies();
    movies = movies.map(formatMovie);
    res.status(200).json(movies);
}));

// Adds a new movie
app.post("/movies", requiresAuthentication,
  catchError(async (req, res, next) => {
    let movie = req.body;
    if (!isValidMovie(movie)) {
      res.status(400).send("Not a valid movie object.");
      return next();
    }

    movie.year = movie.year ? +movie.year : null;
    let added = await res.locals.store.addMovie(movie);
    if (added) {
      res.status(200).send("Movie added.");
    } else res.status("Movie cannot be added.");
}));

// Updates existing movie
app.put("/movies/:id", requiresAuthentication,
  catchError(async (req, res, next) => {
    let movie = req.body;
    if (!isValidMovie(movie)) {
      res.status(400).send("Not a valid movie object.");
      return next();
    }

    let id = +req.params["id"];
    movie.year = movie.year ? +movie.year : null;
    let updated = await res.locals.store.updateMovie(id, movie);
    if (updated) {
      res.status(200).send("Movie updated.");
    } else res.status(400).send("Movie cannot be updated");
}));

// Deletes movie
app.delete("/movies/:id", requiresAuthentication,
  catchError(async (req, res, next) => {
    let id = +req.params["id"];
    let deleted = await res.locals.store.deleteMovie(id);
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


