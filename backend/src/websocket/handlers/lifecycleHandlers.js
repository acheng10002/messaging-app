/* responds to WebSocket lifecycle events
- handles markUserOnline(ws) on connection and markUserOffline(ws) on disconnect 
- updates database presence info */
const {
  setUserOnline,
  setUserOffline,
} = require("../../services/auth.service");

// gets called by server when it opens the WebSocket connection
async function markUserOnline(ws) {
  try {
    await setUserOnline(ws.user.id);
  } catch (err) {
    console.error(`Could not mark user ${ws.user.id} online:`, err);
  }
}

// gets called by server when it closes the WebSocket connection
async function markUserOffline(ws) {
  try {
    await setUserOffline(ws.user.id);
  } catch (err) {
    console.error(`Could not mark user ${ws.user.id} offline:`, err);
  }
}

module.exports = {
  markUserOnline,
  markUserOffline,
};
