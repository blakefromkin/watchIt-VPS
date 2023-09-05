// Compare movie titles alphabetically (case insensitive)
const compareByTitle = (itemA, itemB) => {
  let titleA = itemA.title.toLowerCase();
  let titleB = itemB.title.toLowerCase();

  if (titleA < titleB) {
    return -1;
  } else if (titleA > titleB) {
    return 1;
  } else {
    return 0;
  }
};

// Sort and return a list of movies partitioned by
// their completion status.
const sortMovies = (unwatched, watched) => {
  unwatched.sort(compareByTitle);
  watched.sort(compareByTitle);
  return [].concat(unwatched, watched);
};

module.exports = sortMovies;