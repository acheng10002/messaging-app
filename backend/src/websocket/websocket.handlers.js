/* acts as a router for WebSocket message types
- reads parsed.type from client messages
- calls appropriate handler
- delegates to functions in chatHandlers.js or userHandler.js */
const {
  handlePing,
  handleChat,
  handleGetChat,
  handleDeleteMessage,
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
    // 3C. if client message type is "ping"
    case "ping":
      // 3D. "pong" server response/message type
      return handlePing(ws);
    // 6C. if client message type is "chat"
    case "new_message":
      // 6D. "new_message" server response/message type
      return handleChat(ws, parsed);
    // 7C. if client message type is "get_chat"
    case "get_chat":
      // 7D. "chat_history" server response/message type
      return handleGetChat(ws, parsed);
    // 10C. if client message type is "delete_message"
    case "delete_message":
      // 10D. message_deleted server response/message type
      return handleDeleteMessage(ws, parsed);
    // 5C. if client message type is "get_user_chats"
    case "get_user_chats":
      // 5D."chats_list" server response/message type
      return handleGetUserChats(ws);
    // 4C. if client message type is "find_or_create_chat"
    case "find_or_create_chat":
      // 4D. "chat_ready" server response/message type
      return handleFindOrCreateChat(ws, parsed);
    // 8C. if client message type is "online_users"
    case "online_users":
      // 8D.  "online_users" server response/message type
      return handleOnlineUsers(ws);
    // 9C. if client message type is "offline_users"
    case "offline_users":
      // 9D. "offline_users" server response/message type
      return handleOfflineUsers(ws);

    default:
      ws.send(
        JSON.stringify({ type: "error", message: "Unsupported message type." })
      );
  }
}

module.exports = { routeWebSocketMessage };
