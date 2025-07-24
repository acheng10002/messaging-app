/* defines chat-related HTTP route paths and binds them to chats.controller functions
defines HTTP /users/:userid/chats/:chatid routes 
POST /users/1/chats
GET /users/1/chats/1 */
// server framework
const express = require("express");
// handling authentication for protected routes
const passport = require("passport");
// creates a sub-app for handling user/:userid/chats routes
const router = express.Router();
// controller functions to fullfill register and user posts requests
const {
  getUserChatsController,
  createChatController,
  getChatByIdController,
  updateChatController,
} = require("../controllers/chats.controller");

const ensureAuthUserMatchesParam = require("../middlewares/ensureAuthUserMatchesParam");

// GET /users/1/chats /////////////////////////////// WORKS
// protected route for getting the user's chats
router.get(
  "/:userid/chats",
  /* Passport automatically:
  - extracts the JWT from the Authorization: Bearer <token> header
  - verifies the token using my JWT_SECRET 
  - decodes the payload
  - looks up the user via my configured JWT strategy
  - attaches the user object to req.user 
  ** request forwarded only if the token is valid */
  passport.authenticate("jwt", { session: false }),
  ensureAuthUserMatchesParam("userid"),
  getUserChatsController
);

// POST /users/1/chats /////////////////////////////// WORKS
// protected route for creating a new chat
router.post(
  "/:userid/chats",
  // attaches user object authenticated with a JWT token to req
  passport.authenticate("jwt", { session: false }),
  // ensures the authenticated user, req.user.id, matches userid in route
  ensureAuthUserMatchesParam("userid"),
  createChatController
);

// GET /users/1/chats/2 /////////////////////////////// WORKS
// protected route for getting one chat
router.get(
  "/:userid/chats/:chatid",
  // attaches user object authenticated with a JWT token to req
  passport.authenticate("jwt", { session: false }),
  // ensures the authenticated user, req.user.id, matches userid in route
  ensureAuthUserMatchesParam("userid"),
  getChatByIdController
);

// PATCH /users/1/chats/2  /////////////////////////////// WORKS
// protected route for updating one chat
router.patch(
  "/:userid/chats/:chatid",
  // attaches user object authenticated with a JWT token to req
  passport.authenticate("jwt", { session: false }),
  // ensures the authenticated user, req.user.id, matches userid in route
  ensureAuthUserMatchesParam("userid"),
  updateChatController
);

module.exports = router;
