/* acts as a router for WebSocket message types
- reads parsed.type from client messages
- calls appropriate handler
- delegates to functions in chatHandlers.js or userHandler.js */
const {
  handlePing,
  handleChat,
  handleGetChat,
  handleGetUserChats,
  handleFindOrCreateChat,
} = require("./handlers/chatHandlers");
const {
  handleOnlineUsers,
  handleOfflineUsers,
} = require("./handlers/userHandlers");

/* ws - specific client's websocket connection
parsed - incoming client message parsed into JSON object */
async function routeWebSocketMessage(ws, parsed) {
  switch (parsed.type) {
    // 3B. if parsed.type is "ping"
    case "ping":
      // 3C.
      return handlePing(ws);
    // 6B. if it's "chat"
    case "chat":
      // 6C.
      return handleChat(ws, parsed);
    // 7B.
    case "get_chat":
      // 7C.
      return handleGetChat(ws, parsed);
    // 5B.
    case "get_user_chats":
      // 5C.
      return handleGetUserChats(ws);
    // 4B.
    case "find_or_create_chat":
      // 4C.
      return handleFindOrCreateChat(ws, parsed);
    // 8B.
    case "online_users":
      // 8C.
      return handleOnlineUsers(ws);
    // 9B.
    case "offline_users":
      // 9C.
      return handleOfflineUsers(ws);

    default:
      ws.send(
        JSON.stringify({ type: "error", message: "Unsupported message type." })
      );
  }
}

module.exports = { routeWebSocketMessage };
