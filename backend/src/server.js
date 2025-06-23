// entry point for Express app
// allos access to config values
require("dotenv").config();
/* HTTP modules creates a service instance which allows attaching both Express
and WebSocket logic */
const http = require("http");
// imports Express app instance
const app = require("./app");
// function configures WebSocket logic, enabling bi-directional comm
const { setupWebSocket } = require("./websocket");
// uses port defined in .env or defaults to 3000
const PORT = process.env.PORT || 3000;
// wraps Express app with HTTP server so WebSocket can share the same port
const server = http.createServer(app);
// attaches WebSocket server
setupWebSocket(server);
// starts the server and listens on the chosen port
server.listen(PORT, () => {
  console.log(`Server running`);
});
