require("dotenv").config();
const jwt = require("jsonwebtoken");
// sets up WebSocket server using ws library
const WebSocket = require("ws");

const SECRET = process.env.JWT_SECRET;
// allows WebSocket and HTTP to share the same TCP port
function setupWebSocket(server) {
  /* creates a new WebSocket server, wss, without attaching it to an HTTP server
  immediately */
  const wss = new WebSocket.Server({ noServer: true });

  /* handles the HTTP upgrade manually 
  listens for HTTP upgrade event, triggered when client tries to upgrade connection 
  to WebSocket, gives me access to:
  req - HTTP req object
  socket - underlying TCP socket
  head - optional bytes already read from the socket */
  server.on("upgrade", (req, socket, head) => {
    /* parses request URL into a structured URL object 
    req.headers.host - domain/port to complete absolute URL */
    const url = new URL(req.url, `http://${req.headers.host}`);

    // extracts the token query parameter from the URL
    const token = url.searchParams.get("token");

    // if no token provided
    if (!token) {
      // socket connection is destroyed immediately
      socket.destroy();
      // prevents unauthenticated clients from reaching the WebSocket server
      return;
    }

    try {
      /* removes "Bearer " prefix if present 
      validates the JWT using the server's SECRET 
      if valid, token payload/user id is returned and stored as decoded */
      const decoded = jwt.verify(token.replace(/^Bearer\s/, ""), SECRET);

      /* stores the user id on the req object 
      mimics behavior of passport.authenticate("jwt") */
      req.user = decoded;

      /* passes the upgrade to the WebSocket server 
      once accepted, creates a ws instance from the raw socket */
      wss.handleUpgrade(req, socket, head, (ws) => {
        /* assigns the decoded user data to the socket itself 
        allows me to access ws.user.id later in message handling */
        ws.user = req.user;
        /* emits the 'connection' event for the WebSocket server 
        triggers my app's logic for handling new connections */
        wss.emit("connection", ws, req);
      });
    } catch (err) {
      /* if JWT is invalid (bad signature, expired, etc.), error is logged 
      and socket is closed */
      console.error("Invalid WebSocket token", err);
      socket.destroy();
    }
  });

  /* sets up an event listener for new client connections, ws is socket for 
    individual client, on wss, the WebSocket server */
  wss.on("connection", (ws) => {
    console.log(`WebSocket connected for user ${ws.user.id}`);
  });
}

module.exports = setupWebSocket;
