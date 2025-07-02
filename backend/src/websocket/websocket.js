/* sets up and manages the server 
- handles upgrade requests from HTTP to WebSocket
- validates JWT and attaches user to ws.user
- registers lifecycle hooks: on("connection"), on("message"), on("close"), on("error")
- forwards incoming messages to routeWebSocketMessage 
- delegates to websocket.handlers.js/routeWebSocketMessage for routing
- delegates to lifecycleHandlers.js for online/offline tracking */
require("dotenv").config();
// standard Node.js library to sign and verify JWTs
const jwt = require("jsonwebtoken");
// sets up WebSocket server using ws library
const WebSocket = require("ws");
const { activeConnections } = require("./connections");
// routes messages
const { routeWebSocketMessage } = require("./websocket.handlers");
// does online/offline tracking
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
  /* creates a new WebSocket server, wss, without attaching it to an HTTP server
  immediately 
  - wss manages all active connections 
  - ws is a single WebSocket connection, a client, managed by wss */
  const wss = new WebSocket.Server({ noServer: true });

  /* handles the HTTP upgrade manually 
  II. SERVER UPGRADES THE CONNECTION
  listens for HTTP upgrade event on the HTTP server, triggered when client tries to 
  upgrade connection to WebSocket, gives me access to:
  req - HTTP req object
  socket - underlying TCP socket
  head - optional bytes already read from the socket */
  server.on("upgrade", (req, socket, head) => {
    /* a. parses request URL into a structured URL object 
          req.url - path and query string part of raw HTTP request
          req.headers.host - domain/port to complete absolute URL */
    const url = new URL(req.url, `http://${req.headers.host}`);

    /* b. JWT-based auth on upgrade - extracts and validates the token
          - JWT User => req.user => ws.user
          - token query parameter gets parsed and validated by this upgrade handler */
    const token = url.searchParams.get("token");

    // if no token provided - optionally rejects the connection
    if (!token) {
      // socket connection is destroyed immediately
      socket.destroy();
      // prevents unauthenticated clients from reaching the WebSocket server
      return;
    }

    try {
      /* removes "Bearer " prefix if present 
      validates the JWT using the server's SECRET 
      if valid, decoded is the payload of the verified JWT */
      const decoded = jwt.verify(token.replace(/^Bearer\s/, ""), SECRET);

      /* req.user gets assigned the payload, the JWT data
      like behavior of passport.authenticate("jwt") */
      req.user = decoded;

      /* c. upgrades the HTTP request to a WebSocket connection 
            - hands off/passes the upgrade to the WebSocket server
            - once accepted, creates a live ws instance from the raw socket */
      wss.handleUpgrade(req, socket, head, (ws) => {
        /* inside callback here, receive the individual WebSocket connection instance,
        manually attaching the decoded JWT user data to the client connection instance */
        ws.user = req.user;
        /* emits the 'connection' event for the WebSocket server 
        - it's per-client, every ws will carry the user it authenticated with
        - get called every time a new ws connection is successfullt established */
        wss.emit("connection", ws, req);
      });
    } catch (err) {
      /* if JWT is invalid (bad signature, expired, etc.), error is logged 
      and socket is closed - optionally rejects the connection */
      console.error("Invalid WebSocket token", err);
      socket.destroy();
    }
  });

  /* III. SERVER EMITS CONNECTION EVENT AND ASSIGNS WEBSOCKET CONNECTION TO WS VARIABLE 
  this event fires when a new client connection is established */
  wss.on("connection", (ws) => {
    /* 1A. confirmation message iding the connected user (previously attached id 
    during WebSocket upgrade with the decoded JWT) */
    console.log(`WebSocket connected for user ${ws.user.id}`);

    /* gets id of authenticated user from WebSocket connection 
    - ws.user was set during JWT validation in the upgrade phase 
    - userId gets used as key in the Map */
    const userId = ws.user.id;

    // ensures the map has an entry for this userId and that that user has active connections
    if (!activeConnections.has(userId)) {
      // if not, initializes the userId value with a new empty Set
      activeConnections.set(userId, new Set());
    }
    /* fetches the Set for the userId, and registers this specific WebSocket connection
    into that set */
    activeConnections.get(userId).add(ws);

    /* lifecycleHandler function gets called by the server
    - "connection" events fires on the server 
    - websocket.js has access to each user's ws.user.id, 
    - only the server can update the db to mark users online */
    markUserOnline(ws);
    handleOnlineUsers(ws);
    handleOfflineUsers(ws);

    /* sets up an event listener on the individual WebSocket connection
    - listens for message events, i.e. when the client sends a message 
    - 3B, 4B, 5B, 6B, 7B, 8B, 9B
    - message arg is raw string sent from client */
    ws.on("message", async (message) => {
      try {
        // converts incoming message string into JSON object so it can be processed
        const parsed = JSON.parse(message);

        // message handler function, that inspects parsed.type and dispatches accordingly
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
    });

    // this event fires when connection gets closed from client
    ws.on("close", () => {
      console.log(`WebSocket disconnected for user ${ws.user.id}`);

      const userConns = activeConnections.get(userId);
      if (userConns) {
        userConns.delete(ws);
        if (userConns.size === 0) {
          activeConnections.delete(userId);
        }
      }

      /* lifecycleHandler function gets called by the server
      - server-side cleanup
      - websocket.js has access to each user's ws.user.id, 
      - only the server can update the db to mark users offline */
      markUserOffline(ws);
      handleOnlineUsers(ws);
      handleOfflineUsers(ws);
    });

    // this event fires and captures any socket-level errors
    ws.on("error", (err) => {
      console.log(`WebSocket error for user ${ws.user.id}:`, err);
    });

    /* ws.send(...) outside handlers - emitting (push)
    2A. server sends initial welcome message right after connection is established 
    ws.send(
      JSON.stringify({ type: "welcome", message: `Hello user ${ws.user.id}` })
    );
    */
  });
}

module.exports = { activeConnections, setupWebSocket };
