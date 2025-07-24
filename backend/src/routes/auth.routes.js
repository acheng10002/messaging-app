/* defines authentication-related HTTP route paths and binds them to auth.controller functions
- this file is mounted on /auth in app.js */
const express = require("express");
// for handling authentication
const passport = require("passport");
// creates a sub-app for handling authentication routes
const router = express.Router();
// controller functions to fullfill login and logout requests
const { login, logout } = require("../controllers/auth.controller");

/* I3. LOGS IN USER - UserForm.jsx, AuthContext.jsx, auth.routes.js, passport.js, auth.controller.js, UserForm.jsx 
- API's backend route handler receives login request 
- passport.authenticate("local", { session: false }) triggers Local Strategy 
- if valid, req.user is populated and moves to login controller 
POST /auth/login /////////////////////////////// WORKS
- authenticates and logins user */
router.post(
  "/login",
  /* Passport invokes local strategy, disables session storage, using stateless JWT 
  - Passport validates the username and password 
  - if valid, Passport attaches the user authenticated w/ credentials to req.user
  - proceeds to my login controller if successful */
  passport.authenticate("local", { session: false }),
  login
);

/* J4. LOGS OUT USER - Header.jsx, useHandleLogout.js, AuthContext.jsx, auth.routes.js, passport.js, auth.controller.js, UserForm.jsx  
POST /auth/logout /////////////////////////////// WORKS
stateless logout, with no session to destroy */
router.post(
  "/logout",
  /* attaches user object authenticated with a JWT token to req 
  - blocks access if the JWT is invalid, expired, or missing */
  passport.authenticate("jwt", { session: false }),
  logout
);

/* A. GETS USER CHATS - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatsPanel.jsx
B. GETS SELECTED CHAT - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatsView.jsx 
C. FINDS OR CREATES A CHAT - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, Sidebar.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx   
D. CREATES A MESSAGE - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, message.service.js, PageContext.jsx, ChatView.jsx
E. DELETES A MESSAGE - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, message.service.js,PageContext.jsx, ChatView.jsx 
F. GETS ONLINE USERS -  AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, userHandlers.js, user.service.js, PageContext.jsx, Sidebar.jsx
G. GETS OFFLINE USERS -  AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, userHandlers.js, user.service.js, PageContext.jsx, Sidebar.jsx 
K. CHAT WITH CHATBOT - ensureChatbotUser.js, AuthContext.js, auth.routes.js, passport.js, auth.routes.js, Sidebar.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, message.service.js, PageContext.jsx, ChatView.jsx, chatbot.routes.js, chatbot.controller.js, message.service.js, PageContext.jsx, ChatView.jsx
K3. fetches logged in user's details based on token
A2, B2, C2, D2, E2, F2, G2, K2
- HTTP path (AuthContext) allows frontend to fetch the currently logged in user's details based 
  on the JWT token sent in the request 
- uses passport.authenticate("jwt") to rehydrate session state/user context;
  app gets current user info to populate UI state instead of requiring user to login again 
- enables UI rendering conditions based on user, e.g., user?.id
- when the app reloads, this route is used to confirm the token is still valid 
- this is the initial load of an authenticated SPA 
Z. REST API REQUEST FLOW - AuthContext.jsx, auth.routes.js, passport.js, auth.routes.js, AuthContext.jsx 
Z3. server receives the client request
Z4. on server, passport.authenticate("jwt") middleware which runs on every HTTP request */
// GET /auth/me /////////////////////////////// WORKS
router.get(
  "/me",
  // attaches user object authenticated with a JWT token to req
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // Z5. if token is valid, route handler runs here on the server and populates req.user
    res.json(req.user);
  }
);

module.exports = router;
