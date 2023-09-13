# WatchIt
[WatchIt](https://powerful-depths-70402-7dc6da54e08a.herokuapp.com/) is a full stack application that lets users keep track of movies they've watched or want to watch in the future. 

I built this app to practice my full stack skills--and because my girlfriend was tired of me asking her for reminders to watch *Everything, Everywhere, All At Once*. 

## Technologies
I built this application from scratch with the following technologies:

#### Back End
- Express
- Node.js
- PostgreSQL
- node-postgres package
- Pug
- bcrypt

#### Front End
- Vanilla JS
- Fetch API
- HTML
- CSS

## Users, Data Integrity, and Security
Users must sign in or register in order to access the WatchIt application. From there, they will only be able to see the movies associated with their username in the *PostgreSQL* database.

Movie data input is validated on both the front and back ends. I also used the *node-postgres* package to implement parameterized routes that protect against SQL injection attacks (because everybody's always trying to hack my WatchIt lists):
```javascript
// A simple example of parameterized route implementation 
// From the lib/pg-persistence.js module

 async validateLogIn(username, password) {
    const FIND_HASHED_PASSWORD = "SELECT password FROM users WHERE username = $1";
    let result = await dbQuery(FIND_HASHED_PASSWORD, username.toLowerCase());
    if (result.rowCount === 0) return false;

    return await bcrypt.compare(password, result.rows[0].password);
  }
```
Password security is enforced via hashing with *bcrypt*. No actual passwords are stored in the database. 

### Check it out yourself
If you want to try out WatchIt without creating your own account, feel free to use the test login credentials:
- Username: test
- Password: test123

## User Interface
### Navigation
The left side of the UI lets you navigate between your "All Movies" and "Watched Movies" collections. Movies are further grouped by genre.

Note that "All Movies" contains both watched and unwatched movies.

### Modifying a movie
To update the information for an existing movie, simply click on that movie's title. A modal will appear allowing you to modify the movie details.

### Marking a movie as watched or unwatched
- To mark a movie as watched, you can either click the area of the movie in the list, or click the "Mark As Watched" button in the movie editing modal. 
- To return a watched movie to unwatched status, you must click the area of the watched movie in the list

### Adding and deleting movies
These are obvious--click the "Add New Movie" and trash can buttons respectively. 

## Future Implementation
- Implement interaction with a movie database API like IMDB's in order to source validated movie data, rather than having users manually input their own.
- Display flash messages for successful movie additions, edits, and deletions