const express = require("express");
const passport = require("passport");
// creates a sub-app for handling user routes
const router = express.Router();
// controller functions to fullfill register and user posts requests
const {
  getChatbotResponseController,
} = require("../controllers/chatbot.controller");

/* POST /chatbot/message 
- this file is mounted on /bot in app.js
- user submits registration details 
K23. CHAT WITH CHATBOT - ensureChatbotUser.js, AuthContext.js, auth.routes.js, passport.js, auth.routes.js, Sidebar.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, message.service.js, PageContext.jsx, ChatView.jsx, chatbot.routes.js, chatbot.controller.js, message.service.js, PageContext.jsx, ChatView.jsx 
- getChatbotResponsecontroller takes in chatbot's response*/
router.post(
  "/message",
  (req, res, next) => {
    /* - AFTER WEBSOCKET CONNECTED FOR USER ID,
    CONFIRMS FRONTEND WEBSOCKET REQUESTS,
    AUTOMATICALLY FETCHES CURRENT USER CHATS, RETRIEVES ONLINE USERS, RETRIEVES OFFLINE USERS,
    USER REQUESTS FULL DETAILS FOR A CHAT ID,
    USER HAS SUBMITTED A MESSAGE TO THE CHATBOT VIA WEBSOCKET,
    MESSAGE HANDED OFF TO THE MESSAGE HANDLER FOR ROUTING, 
    HANDLECHAT WAS INVOKED WITH THE CORRECT DATA, 
    CONTENT WAS NON-EMPTY AND PASSED VALIDATION,
    CONFIRMS THE JWT TOKEN WAS INCLUDED WITH THE REQUEST FOR AUTHENTICATION */
    console.log("Authorization header:", req.headers.authorization);
    next();
  },
  // attaches user object authenticated with a JWT token to req
  passport.authenticate("jwt", { session: false }),
  getChatbotResponseController
);

module.exports = router;
