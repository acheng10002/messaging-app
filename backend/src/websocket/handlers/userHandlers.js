/* implements WebSocket-specific logic for users
- handles listing online/offline users via calls to service layer/Prisma queries
- returns lists via WebSocket */
const {
  getOnlineUsernames,
  getOfflineUsernames,
} = require("../../services/user.service");

const { activeConnections } = require("../connections");

function broadcastToAllClients(payload) {
  const data = JSON.stringify(payload);
  activeConnections.forEach((conns) => {
    conns.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(data);
      }
    });
  });
}

// user sees all online users
async function handleOnlineUsers(ws) {
  try {
    const usernames = await getOnlineUsernames();
    // 8E. Received (from server): {"type":"online_users","data":["kai","alice123"]}
    broadcastToAllClients({ type: "online_users", data: usernames });
  } catch (err) {
    ws.send(JSON.stringify({ type: "error", message: err.message }));
  }
}

// user sees all offline users
async function handleOfflineUsers(ws) {
  try {
    const usernames = await getOfflineUsernames();
    // 9E. Received (from server): {"type":"offline_users","data":["bob"]}
    broadcastToAllClients({ type: "offline_users", data: usernames });
  } catch (err) {
    ws.send(JSON.stringify({ type: "error", message: err.message }));
  }
}

module.exports = { handleOnlineUsers, handleOfflineUsers };
