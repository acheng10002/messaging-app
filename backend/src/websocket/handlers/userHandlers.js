/* implements WebSocket-specific logic for users
- handles listing online/offline users via calls to service layer/Prisma queries
- returns lists via WebSocket */
const {
  getOnlineUsers,
  getOfflineUsers,
} = require("../../services/user.service");

// imports the Map from the central WebSocket connection manager module
const { activeConnections } = require("../connections");

// function that takes a payload object and sends it to all connected WebSocket clients
function broadcastToAllClients(payload) {
  // serializes the payload into a JSON string, the format required for sending data over a WebSocket
  const data = JSON.stringify(payload);
  /* iterates over the values in the activeConnections Map */
  activeConnections.forEach((conns) => {
    conns.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(data);
      }
    });
  });
}

/* F8. GETS ONLINE USERS - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, userHandlers.js, user.service.js, PageContext.jsx, Sidebar.jsx
- backend message handler gets online users and broadcasts online users to all logged-in users
- user sees all online users */
async function handleOnlineUsers() {
  try {
    const users = await getOnlineUsers();
    /* - client user sends a new message / client's "online_users" message
    - server routes the client's message to the correct handler / server's routeWebSocketMessage(ws, parsed)
    - server handler here gets all online users via a service function / server's getOnlineUsers()
    - server sends "online_users" message and online users object to all users / below  
    - sender client updates its state when all online users are retrieved
    - broadcasts message to all connected WebSocket clients */
    broadcastToAllClients({ type: "online_users", data: users });
  } catch (err) {
    // sends error message back to client who reads online users with relevant error message
    ws.send(JSON.stringify({ type: "error", message: err.message }));
  }
}

/* G8. GETS OFFLINE USERS - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, userHandlers.js, user.service.js, PageContext.jsx, Sidebar.jsx
- backend message handler gets offline users and broadcasts offline users to all logged-in users
- user sees all offline users */
async function handleOfflineUsers() {
  try {
    const users = await getOfflineUsers();
    /* - client user sends a new message / client's "offline_users" message
    - server routes the client's message to the correct handler / server's routeWebSocketMessage(ws, parsed)
    - server handler here gets all online users via a service function / server's getOfflineUsers()
    - server sends "offline_users" message and offline users object to all users / below  
    - sender client updates its state when all offline users are retrieved */
    broadcastToAllClients({ type: "offline_users", data: users });
  } catch (err) {
    ws.send(JSON.stringify({ type: "error", message: err.message }));
  }
}

module.exports = { handleOnlineUsers, handleOfflineUsers };
