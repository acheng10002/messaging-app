/* sets up and manages the WebSocket server 
- handles upgrade requests from HTTP to WebSocket and validates JWT and attaches user to ws.user
- registers lifecycle hooks: on("connection"), on("message"), on("close"), on("error")
- forwards incoming messages to routeWebSocketMessage delegates to it for routing
- delegates to lifecycleHandlers.js for online/offline user tracking */
require("dotenv").config();
// low-level Node.js library to sign and verify JWTs for when JWTs get handled manually
const jwt = require("jsonwebtoken");
// sets up WebSocket server using ws library
const WebSocket = require("ws");
// maps a logged-in user's id to a Set of WebSocket instances
const { activeConnections } = require("./connections");
// routes client messages
const { routeWebSocketMessage } = require("./websocket.handlers");
// does online/offline user tracking
const {
  handleOnlineUsers,
  handleOfflineUsers,
} = require("./handlers/userHandlers");
const {
  markUserOnline,
  markUserOffline,
} = require("./handlers/lifecycleHandlers");

// secret that is used to sign the JWT
const SECRET = process.env.JWT_SECRET;

// allows WebSocket and HTTP to share the same TCP port
function setupWebSocket(server) {
  /* creates a new WebSocket server, wss, without attaching it to an HTTP server immediately 
  - listens for and upgrades HTTP connections
  - emits connection events 
  wss - WebSocket server that manages all active connections 
  ws - a single WebSocket connection, a client, managed by wss 
  { noServer: true } means I am handling the HTTP upgrade manually */
  const wss = new WebSocket.Server({ noServer: true });

  /* A. GETS USER CHATS - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatsPanel.jsx
  B. GETS SELECTED CHAT - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatsView.jsx 
  C. FINDS OR CREATES A CHAT - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, Sidebar.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx   
  D. CREATES A MESSAGE - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, message.service.js, PageContext.jsx, ChatView.jsx
  E. DELETES A MESSAGE - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, message.service.js,PageContext.jsx, ChatView.jsx 
  F. GETS ONLINE USERS - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, userHandlers.js, user.service.js, PageContext.jsx, Sidebar.jsx
  G. GETS OFFLINE USERS - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, userHandlers.js, user.service.js, PageContext.jsx, Sidebar.jsx
  K. CHAT WITH CHATBOT - ensureChatbotUser.js, AuthContext.js, auth.routes.js, passport.js, auth.routes.js, Sidebar.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, message.service.js, PageContext.jsx, ChatView.jsx, chatbot.routes.js, chatbot.controller.js, message.service.js, PageContext.jsx, ChatView.jsx
  - A2, B2, C2, D2, E2, F2, G2 server-side WebSocket Events fired by my WebSocket server
  - these events accept and authenticate connections; focused on infrastructure and protocol-level handling
  - they also manage lifecycle and messaging; server listens for upgrade, connection, messages, errors, and disconnects
  Y. WEBSOCKET FLOW - WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js...
     ....on("...", ...) - nested event handlers operating at different layers of the WebSocket lifecycle
  Y4. server.on("upgrade", ...) raw HTTP socket upgrade event handler, at the raw HTTP server level
      - server listens for intercepts the client's HTTP Upgrade request (Connection: Upgrade)
      - handles HTTP  -> WebSocket upgrade + auth
      - connection to WebSocket, gives me access to:
        req - HTTP req object
        socket - underlying TCP socket
        head - optional bytes already read from the socket */
  server.on("upgrade", (req, socket, head) => {
    /* server's event handler intercepts the upgrade request and parses request URL into a structured URL object 
       req.url - path and query string part of raw HTTP request
       req.headers.host - domain/port to complete absolute URL */
    const url = new URL(req.url, `http://${req.headers.host}`);

    /* Y5. manual JWT-based auth on upgrade 
         - extracts tokenfrom the WebSocket query string
          - JWT User => req.user => ws.user */
    const token = url.searchParams.get("token");

    // if no token provided, optionally rejects the connection
    if (!token) {
      // socket connection is destroyed immediately
      socket.destroy();
      // prevents unauthenticated clients from reaching the WebSocket server
      return;
    }

    try {
      /* Y6. manually signs and verifies JWTs using jsonwebtoken library,NOT JwtStrategy, the automatic 
           user auth middleware; user set on ws.user 
           - manual validation and JWT authentication here before WebSocket connection is accepted; 
             must be implemented per upgrade request; manual imperative code 
           - removes "Bearer " prefix if present 
           - token query parameter gets parsed and validated by this upgrade handler using the server's SECRET 
      - if valid, returns decoded, the payload of the verified JWT */
      const decoded = jwt.verify(token.replace(/^Bearer\s/, ""), SECRET);

      /* if valid then also attaches decoded to req.user
      - like behavior of passport.authenticate("jwt")
      - Passport JWT Strategy also populates req.user */
      req.user = decoded;

      /* Y7. upgrades the incoming HTTP request to a full WebSocket connection if token is valid
            - passes the upgrade to the WebSocket server, wss, and completes the WebSocket handshake
            - when wss.handleUpgrade(...) completes successfully, creates a live ws instance from the raw socket
            - wss = the server, ws = one connection to a client/one client session
            - ws is used to send/receives messages to/from that specific client */
      wss.handleUpgrade(req, socket, head, (ws) => {
        /* the ws WebSocket instance representing the client connection is passed into this callback 
        - callback attaches req.user, the decoded JWT data, to the WebSocket connection instance 
        - the direct jsonwebtoken.verify() returns decoded JWT payload, which I assign to req.user, 
          which is then assigned to ws.user
        - once ws.user is set, subsequent WebSocket messages do not repeat auth checks; I am trusting
          the established socket */
        ws.user = req.user;
        /* I have wss manually emits/triggers the 'connection' event for the WebSocket after successful upgrade
        - upgrade handler + .emit("connection", ...) middleware get called only when and every time a new ws 
          connection is successfully established 
        - wss.emit("connection", ...) triggers the wss.on("connection", ...) handler
        - it's per-client, every ws will carry the user it authenticated with */
        wss.emit("connection", ws, req);
      });
    } catch (err) {
      /* if JWT is invalid (bad signature, expired, etc.), error is logged and socket is 
      closed - optionally rejects the connection */
      console.error("Invalid WebSocket token", err);
      socket.destroy();
    }
  });

  /* Y8. wss.on("connection", ...) event handler, at the WebSocket server level (below the HTTP server) 
     - this event fires when a new authenticated client connection is established
     - initiates per-client connection logic 
     - runs once per WebSocket client per browser tab 
     - WebSocket retrieves live data after .on("connection"); enables realtime communication and updates */
  wss.on("connection", (ws) => {
    /* confirmation message iding the connected user (previously attached id 
    during WebSocket upgrade with the decoded JWT) */
    console.log(`WebSocket connected for user ${ws.user.id}`);

    /* gets id of authenticated user from WebSocket connection 
    - ws.user was set during JWT validation in the upgrade phase 
    - userId gets used as key in the Map */
    const userId = ws.user.id;

    // ensures the map has an entry for this userId and that that user has active connections
    if (!activeConnections.has(userId)) {
      /* Y8. if not, initializes the userId value with a new empty Set 
       - stores Set of ws connections per user ID, Set prevents duplicates 
       - each user has one connection per browser session, 1:1, user with multiple connections have 
         multiple browser sessions or devices in use 
         - the Set of ws connections per user ID enables targeted broadcasting or cleanup per user */
      activeConnections.set(userId, new Set());
    }
    /* Y8. fetches the Set for the userId, and registers this specific WebSocket connection
           into that set */
    activeConnections.get(userId).add(ws);

    /* Y8. lifecycleHandler function gets called by the server
       - "connection" events fires on the server 
       - websocket.js has access to each user's ws.user.id 
       - only the server can update the db to mark users online, calls markUserOnline(ws) and broadcasts 
         handleOnlineUsers()/handleOfflineUsers() */
    markUserOnline(ws);
    /* GETS ONLINE USERS - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, userHandlers.js, user.service.js, PageContext.jsx
    F3 gets the user objects of the online users */
    handleOnlineUsers();
    /* GETS OFFLINE USERS - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, userHandlers.js, user.service.js,PageContext.jsx
    G3 gets the user objects of the offline users */
    handleOfflineUsers();

    /*  WEBSOCKET FLOW - WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js...
       Y10. server receives a message from the client
       - ws.on("message", ...) event handler, at individual WebSocket client connection level
       - handles client message events sent over the ws connection
       - message arg is raw string sent from client over the ws 
       - parses and routes client messages */
    ws.on("message", async (message) => {
      try {
        // converts incoming client message string into JSON object so it can be processed
        const parsed = JSON.parse(message);

        /* A4, B4, C4, D4, E4, F5, G5, K6, K14. * backend server parses and dispatches client WebSocket messages
           (routes the client messages)
           Y10. server's message handler function, that inspects parsed.type, and server dispatches 
                message type to correct handler 
           - server responds to the client message by routing it (client then updates state and components re-render) */
        await routeWebSocketMessage(ws, parsed);
        // if message is not valid JSON, throws error
      } catch (err) {
        console.error("Message routing error:", err);
        // lets my frontend show a toast or console message without crashing
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Invalid request format.",
          })
        );
      }
      // server upgrades the protocol -> wss handles the connection -> ws handles per-client communication
    });

    /* ws.on("close", ...) event handler, at individual WebSocket client connection level 
    - this event fires when connection gets closed from the client
    - user closes the tab, network dropped, etc. */
    ws.on("close", async () => {
      console.log(`WebSocket disconnected for user ${ws.user.id}`);

      /* cleanup: updates in-memory activeConnections map when a client disconnects 
      - retrieves the Set of active WebSocket connections for the given userId */
      const userConns = activeConnections.get(userId);
      // if there are open connections associated with that userId
      if (userConns) {
        // removes the current WebSocket instance from the set for that user
        userConns.delete(ws);
        // if the user now has no remaining open connections
        if (userConns.size === 0) {
          // removes the userId entry from the activeConnections map
          activeConnections.delete(userId);
        }
      }

      /* lifecycleHandler function gets called by the server
      - server-side cleanup
      - websocket.js has access to each user's ws.user.id, 
      - only the server can update the db to mark the user offline */
      await markUserOffline(ws);
      // gets the user objects of the online users
      handleOnlineUsers();
      // gets the user objects of the offline users
      handleOfflineUsers();
    });

    /* ws.on("error" event handler, at individual WebSocket client connection level   
    - this event fires and captures any low-level errors in socket */
    ws.on("error", (err) => {
      // logs the issue or performs custom error recovery
      console.log(`WebSocket error for user ${ws.user.id}:`, err);
    });
  });
}

module.exports = { activeConnections, setupWebSocket };
