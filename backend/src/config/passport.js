/* sets up JWT authentication for securing routes and WebSocket connections
configs my app's authentication strategy using Passport.js middleware */
// environment variables
require("dotenv").config();
// db access layer
const prisma = require("../db/prisma");
// for hashing passwords
const bcrypt = require("bcryptjs");
// Passport JWT strategy components
const { Strategy: LocalStrategy } = require("passport-local");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");

/* server loads JWT secret from .env, JWT secret will sign and verify tokens 
- ensures tokens haven't been tampered with
- ensures tokens were issued by the server */
const SECRET = process.env.JWT_SECRET;

/* Local Strategy for login using username/pw
- initializes Local Strategy which expects a username and pw by default 
done - Passport callback that signals success or failure of authentication 
I4. LOGS IN USER - UserForm.jsx, AuthContext.jsx, auth.routes.js, passport.js, auth.controller.js, UserForm.jsx 
- Local Strategy authenticates user */
const localStrategy = new LocalStrategy(async (username, password, done) => {
  try {
    /* queries the db, specifically the User model, for a user whoses username
    matches the input */
    const user = await prisma.user.findUnique({ where: { username } });

    // if user is not found, return - no error, no user object, and Passport error message
    if (!user) return done(null, false, { message: "Incorrect username." });

    /* validates pw via bcrypt.compare */
    const isValid = await bcrypt.compare(password, user.password);
    // if pw doesn't match, return - no error, no user object, and Passport error message
    if (!isValid) return done(null, false, { message: "Incorrect password." });

    //if username and pw are valid, authentication success, return - no error, and user object
    return done(null, user);
  } catch (err) {
    // if any error occurs (e.g. db error) signal to Passport
    return done(err);
  }
});

/* JWT Strategy for protecting routes by checking for valid tokens 
A. GETS USER CHATS - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatsPanel.jsx
B. GETS SELECTED CHAT - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatsView.jsx 
C. FINDS OR CREATES A CHAT - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, Sidebar.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx   
D. CREATES A MESSAGE - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, message.service.js, PageContext.jsx, ChatView.jsx
E. DELETES A MESSAGE - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, message.service.js,PageContext.jsx, ChatView.jsx 
F. GETS ONLINE USERS -  AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, userHandlers.js, user.service.js, PageContext.jsx, Sidebar.jsx
G. GETS OFFLINE USERS -  AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, userHandlers.js, user.service.js, PageContext.jsx, Sidebar.jsx 
J5. LOGS OUT USER - Header.jsx, useHandleLogout.js, AuthContext.jsx, auth.routes.js, passport.js, auth.routes.js, auth.controller.js, UserForm.jsx  
K. CHAT WITH CHATBOT - ensureChatbotUser.js, AuthContext.js, auth.routes.js, passport.js, auth.routes.js, Sidebar.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, message.service.js, PageContext.jsx, ChatView.jsx, chatbot.routes.js, chatbot.controller.js, message.service.js, PageContext.jsx, ChatView.jsx
K4. assigns req.user
A3, B3, C3, D3, E3, F3, G3, J5 
- HTTP path (AuthContext) uses JwtStrategy for authenticating requests via JWTs 
- JwtStrategy is automatic user auth middleware that provides Express route protection 
- used in two REST APIs, /auth/me and /auth/logout, and only used in HTTP-only middleware context 
- declared once and then reused declaratively via route middleware; it's declarative middleware 
- it automatically assigns req.user */
const jwtStrategy = new JwtStrategy(
  {
    /* 1. client attaches the token in the Authorization header
         - this happens on the client BEFORE any request is even made
       2. client sends request and hits the protected route, /auth/me 
       3. server receives request 
       4. server runs passport.authenticate("jwt") to verify the token */
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    // server verifies the token's signature using the server's secret
    secretOrKey: SECRET,
  },
  /* callback that runs after the token is decoded and verified 
  JWT - 3 parts: <Header>.<Payload>.<Signature>
  token payload - JWT's middle part that contains the actual data I want to encode
  done - cb that signals success (and passes the authenticated user) or failure */
  async (payload, done) => {
    try {
      // queries the db, the user model, for a user with the id coded in the token payload
      const user = await prisma.user.findUnique({ where: { id: payload.id } });
      // if user is found, attaches user to req.user, or authentication fails if not; user set on req.user
      return done(null, user || false);
    } catch (err) {
      // if there's a db error, authentication fails with err
      return done(err, false);
    }
  }
);

// exports strategies to be registered in app.js
module.exports = {
  localStrategy,
  jwtStrategy,
};

/* JwtStrategy for HTTP Requests versus jsonwebtokens for WebSocket connections
JwtStrategy for HTTP
- automatically via passport.authenticate("jwt")
- frontend sends an HTTP request to a protected route and includes the JWT in the 
  Authorization header
- Express passport middleware runs before route handler and validates the token via
  JwtStrategy
- if token is valid, request proceeds and the authenticated user is added to req.user
  if not, request is rejected with a 401 Unauthorized
jsonwebtokens for WebSocket connections
- manually using jsonwebtoken.verify()
- token is usually manually validated during the initial handshake, e.g. via a query param or header
- or token is manually validated immedaitely after connection, e.g. client sends a message with the token
- or token is validated using custom middleware or logic 
*/
