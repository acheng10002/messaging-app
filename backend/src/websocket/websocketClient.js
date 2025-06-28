/* simulates a WebSocket client, like a browser, for testing 
- 1. sends client messages of shape { type, ...data }
- receives server responses over the same socket
- ex. sends { type: "ping" } and logs the response
ws library for a WebSocket implementation for Node.js 
lets me create and manage WebSocket connections from the clients' side */
const WebSocket = require("ws");

/* log in via Postman 
copy token from login response, paste here */
const token =
  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzUwNzkyMTkyLCJleHAiOjE3NTA3OTU3OTJ9.tuqyWAvg-FO-vTK54u4kKJD2BAOA9Rjsa4-LIDrB4do";

/* I. CLIENT INITIATES CONNECTION
creates a new authenticated WebSocket connection to my backend server using JWT 
(begins a TCP handshake and HTTP upgrade request to the server)
- token is appended as a query parameter in the connection URL 
- token will be parsed and validated in my server's upgrade handler 
- simulates a real client without a frontend */
const ws = new WebSocket(
  `ws://localhost:3000?token=${encodeURIComponent(token)}`
);

/* IV. CONNECTION IS ACCEPTED AND ESTABLISHED,
WebSocket event: connection opened
runs when WebSocket connection is successfully opened */
ws.on("open", () => {
  /* 1B. client logs a confirmation to the terminal */
  console.log("WebSocket connected");

  /* 3A. Ping test - confirms connection is alive
  - "ping" client request/message type
  - sent to websocket.js 
  - routed to websocket.handlers.js/routeWebSocketMessage 
  - handled by handlePing in chatHandlers.js 
  - "pong" server response/message type */
  ws.send(JSON.stringify({ type: "ping" }));

  /* 4A. attempts to find or create a chat with recipientId = 2 
  - returns the found or newly created chat
  - "find_or_create_chat" client request/message type
  - sent to websocket.js 
  - routed to websocket.handlers.js/routeWebSocketMessage 
  - handled by handleFindOrCreateChat in chatHandlers.js 
  - "chats:ready" server response/message type */
  setTimeout(() => {
    ws.send(JSON.stringify({ type: "find_or_create_chat", recipientId: 2 }));
  }, 300);

  /* 5A. gets list of chats for this user
  - returns all user chats
  - "get_user_chats" client request/message type
  - sent to websocket.js 
  - routed to websocket.handlers.js/routeWebSocketMessage 
  - handled by handleGetUserChats in chatHandlers.js 
  - "chats:list" server response/message type */
  setTimeout(() => {
    ws.send(JSON.stringify({ type: "get_user_chats" }));
  }, 600);

  /* 6A. sends a chat message (chatId must exist)
  - echoes back saved message
  - "chat" client request/message type
  - sent to websocket.js 
  - routed to websocket.handlers.js/routeWebSocketMessage 
  - handled by handleChat in chatHandlers.js 
  - "chat" server response/message type */
  setTimeout(() => {
    ws.send(
      JSON.stringify({
        type: "chat",
        chatId: 2,
        content: "Hello from client!",
      })
    );
  }, 900);

  /* 7A. gets a specific chat (chatId must exist)
  - returns full chat history
  - "get_chat" client request/message type
  - sent to websocket.js 
  - routed to websocket.handlers.js/routeWebSocketMessage 
  - handled by handleGetChat in chatHandlers.js 
  - "chat_history" server response/message type */
  setTimeout(() => {
    ws.send(JSON.stringify({ type: "get_chat", chatId: 2 }));
  }, 1200);

  /* 8A. gets online users
  - returns list of online usernames
  - "online_users" client request/message type
  - sent to websocket.js 
  - routed to websocket.handlers.js/routeWebSocketMessage 
  - handled by handleOnlineUsers in userHandlers.js 
  - "online_users" server response/message type */
  setTimeout(() => {
    ws.send(JSON.stringify({ type: "online_users" }));
  }, 1500);

  /* 9A. gets oneline users 
  - returns list of offline usernames
  - "offline_users" client request/message type
  - sent to websocket.js 
  - routed to websocket.handlers.js/routeWebSocketMessage 
  - handled by handleOfflineUsers in userHandlers.js 
  - "offline_users" server response/message type */
  setTimeout(() => {
    ws.send(JSON.stringify({ type: "offline_users" }));
  }, 1800);
});

// WebSocket event: message received
/* runs whenever the client receives a message from the server 
2B. Received: {"type":"welcome","message":"Hello user 1"} */
ws.on("message", (data) => {
  // logs the message data to the console
  console.log("Received:", data.toString());
});

/* WebSocket event: connection closed from server 
frontend awareness, useful for reconnection or errors */
ws.on("close", () => {
  // logs a disconnection notice to the console
  console.log("WebSocket disconnected");
});

// WebSocket event: error occurred
// runs if there is any error during the WebSocket connection lifecycle
ws.on("error", (err) => {
  /* useful for catching and diagnosing issues like, invalid token,
    server not running, port mismatch, network issues */
  console.error("WebSocket error:", err);
});
