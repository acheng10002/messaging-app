// defines authentication-related HTTP route paths and binds them to auth.controller functions
// server framework
const express = require("express");
// for handling authentication
const passport = require("passport");
// creates a sub-app for handling authentication routes
const router = express.Router();
// controller functions to fullfill login and logout requests
const { login, logout } = require("../controllers/auth.controller");

/* POST /auth/login /////////////////////////////// WORKS
this file is mounted on /auth in app.js
authenticates and logins user */
router.post(
  "/login",
  /* Passport invokes local strategy, disables session storage, using stateless JWT 
  - Passport validates the username and password 
  - if valid, Passport attaches the user authenticated w/ credentials to req.user
  - proceeds to my login controller if successful */
  passport.authenticate("local", { session: false }),
  login
);

/* POST /auth/logout /////////////////////////////// WORKS
stateless logout, with no session to destroy */
router.post(
  "/logout",
  // attaches user object authenticated with a JWT token to req
  passport.authenticate("jwt", { session: false }),
  logout
);

/* allows frontend to fetch the currently logged in user's details based on the JWT 
token sent in the request 
- when the app reloads, this route is used to confirm the token is still valid 
- app gets current user info to populate UI state instead of requiring user to login again
- this is the initial load of an authenticated SPA */
// GET /auth/me /////////////////////////////// WORKS
router.get(
  "/me",
  // attaches user object authenticated with a JWT token to req
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.json(req.user);
  }
);

module.exports = router;
