/* authentication-related HTTP request handlers 
- Passport Local Strategy verifies credentials
- Passport populates req.user
- Passport JWT Strategy verifies JWT on future requests */
// standard Node.js library to sign and verify JWTs
const jwt = require("jsonwebtoken");
// environment variables
require("dotenv").config();
// service functions run after user logs in/logs out
const { setUserOnline, setUserOffline } = require("../services/auth.service");
// custom error
const ApiError = require("../utils/ApiError");

// loads JWT secret from .env, the secret will sign and verify tokens
const SECRET = process.env.JWT_SECRET;

/* POST /auth/login
public, logs in user with jsonwebtoken creates the JWT */
const login = async (req, res, next) => {
  try {
    /* if authentication fails, Passport handles response automatically 
    callback only runs if authentication succeeds - req.user is the authenticated user */
    await setUserOnline(req.user.id);
    /* if authenticaion succeeds, server issues a JWT using jsonwebtoken
    payload - { id: req.user.id } get encoded into the token
    secret - server secret used in the signature
    option - the token will expire in 1 h */
    const token = jwt.sign({ id: req.user.id }, SECRET, { expiresIn: "1h" });
    /* server signs and sends the signed JWT back to the client in the response body 
    - user will then attach the signed JWT to future requests, 
    - my API can verify the JWT in order to allow or deny access to the rest of a protected route */
    res.json({
      token: `Bearer ${token}`,
      // user metadata
      user: { id: req.user.id, username: req.user.username },
      // redirect path
      redirectTo: `/users/${req.user.id}/chats`,
    });
  } catch (err) {
    console.error("Login failed:", err);
    // next cb passes control to error handler
    next(new ApiError(500, "Failed to complete login"));
  }
};

/* POST /auth/logout
protected, logs out user and makes them offline in db */
const logout = async (req, res, next) => {
  try {
    await setUserOffline(req.user.id);
    res.json({
      message: "Logged out successfully: client should discard token",
    });
  } catch (err) {
    console.error("Logout failed:", err);
    // next cb passes control to error handler
    next(new ApiError(500, "Failed to complete logout"));
  }
};

/* memory - lives in JS runtime only, lost on page reload or navigation
localStorage - persistent storage in browser, stays unless explicitly cleared
cookies - client storage that can be persistent, common for session-based authentication
Cache Storage API - persistent storage, stores HTTP responses and enables offline access 
                    and caching of assets and API responses
*/
module.exports = {
  login,
  logout,
};
