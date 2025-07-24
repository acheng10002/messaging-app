/* entry point for Express app that starts HTTP server
- backend server, Express on localhost:3000 
-- listens for HTTP, REST API endpoints
-- listens for WebSocket connections, accepts ws:// or wss:// connections 
   from the frontend and maintains persistent sockets */
// allows access to config values
require("dotenv").config();
/* HTTP modules creates a server instance which allows attaching both Express
and WebSocket logic */
const http = require("http");
// imports Express app instance
const app = require("./App");
// function configures WebSocket logic, enabling bi-directional comm
const { setupWebSocket } = require("./websocket/websocket");
const { ensureChatbotUser } = require("./utils/ensureChatbotUser");
// uses port defined in .env or defaults to 3000
const PORT = process.env.PORT || 3000;
// wraps Express app with HTTP server so WebSocket can share the same port
const server = http.createServer(app);
// ensures chatbot user exists and then attaches WebSocket server
ensureChatbotUser().then(() => {
  setupWebSocket(server);
  // starts the server and listens on the chosen port
  server.listen(PORT, () => {
    console.log(`Server running`);
  });
});
