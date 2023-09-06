CREATE TABLE users (
  username text PRIMARY KEY,
  password text NOT NULL
);

CREATE TABLE movies (
  id serial PRIMARY KEY,
  title text NOT NULL,
  year int,
  genre text,
  watched boolean DEFAULT false NOT NULL,
  notes text,
  username text NOT NULL REFERENCES users(username)
);