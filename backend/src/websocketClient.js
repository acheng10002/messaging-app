/* ws library for a WebSocket implementation for Node.js 
lets me create and manage WebSocket connections from the client side */
const WebSocket = require("ws");

/* log in via Postman 
copy token from login response, paste here */
const token = "Bearer <paste JWT here>";

/* creates a new authenticated WebSocket connection to my backend server using JWT 
- token is appended as a query parameter in the connection URL 
- token will be parsed and vaidated in my server's upgrade handler in websocket.js 
- simulates a real client without a frontend */
const ws = new WebSocket(
  `ws://localhost:3000?token=${encodeURIComponent(token)}`
);

// WebSocket event: connection opened
// runs when WebSocket connection is successfully opened
ws.on("open", () => {
  // logs a confirmation to the terminal
  console.log("WebSocket connected");

  // sends test message to the server (example format)
  ws.send(JSON.stringify({ type: "ping" }));
});

// WebSocket event: message received
// runs whenever the client receives a message from the server
ws.on("message", (data) => {
  // logs the message data to the console
  console.log("Received:", data.toString());
});

// WebSocket event: connection closed
// runs when the WebSocket connection is closed
ws.on("close", () => {
  // logs a disconnection notice to the console
  console.log("WebScoket disconnected");
});

// WebSocket event: error occurred
// runs if there is any error during the WebSocket connection lifecycle
ws.on("error", (err) => {
  /* useful for catching and diagnosing issues like, invalid token,
    server not running, port mismatch, network issues */
  console.error("WebSocket error:", err);
});
