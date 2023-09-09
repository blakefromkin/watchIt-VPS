// // Middleware that detects unauthorized access to routes.
const requiresAuthentication = (req, res, next) => {
  if (!res.locals.signedIn) {
    res.redirect(302, "/signin");
  } else {
    next();
  }
};

module.exports = requiresAuthentication;