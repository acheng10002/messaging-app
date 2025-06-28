/* defines message-related HTTP route paths and binds them to messages.controller functions
server framework */
const express = require("express");
// handling authentication for protected routes
const passport = require("passport");
// creates a sub-app for handling user/:userid/chats/:chatid/messages routes
const router = express.Router();
// controller functions
const {
  createMessageController,
  deleteMessageController,
} = require("../controllers/messages.controller");
const ensureAuthUserMatchesParam = require("../middlewares/ensureAuthUserMatchesParam");

// POST /users/1/chats/2/messages /////////////////////////////// WORKS
router.post(
  "/:userid/chats/:chatid/messages",
  passport.authenticate("jwt", { session: false }),
  ensureAuthUserMatchesParam("userid"),
  createMessageController
);

// DELETE /users/1/chats/2/messages/1 /////////////////////////////// WORKS
router.delete(
  "/:userid/chats/:chatid/messages/:messageid",
  passport.authenticate("jwt", { session: false }),
  ensureAuthUserMatchesParam("userid"),
  deleteMessageController
);

module.exports = router;
