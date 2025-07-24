/* acts as a router for WebSocket message types
- reads parsed.type from client messages
- calls appropriate handler
- delegates to functions in chatHandlers.js or userHandler.js */
const {
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
  // logs every incoming message
  console.log("Incoming WS message:", parsed);
  switch (parsed.type) {
    /* A5. GETS USER CHATS - AuthContext.js, auth.routes.js, passport.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatsPanel.jsx   
    - backend router routes "get_user_chats" client message to backend message handler/chatHandlers.js */
    case "get_user_chats":
      /* **each handler can trust ws.user as the authenticated identity 
        A6. backend message handler gets the chats via getUserChats(authenticatedId) service function  
        - "chats_list" server response/message type */
      return handleGetUserChats(ws);
    /* B5. GETS SELECTED CHAT - AuthContext.js, auth.routes.js, passport.js, WebSocketContext.jsx, websocket.js, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx 
    - backend router routes "get_chat" client message to backend message handler/chatHandlers.js */
    case "get_chat":
      /* B6. backend message handler gets specific chat via getChatById(authenticatedId) service function   
      - "chat_history" server response/message type */
      return handleGetChat(ws, parsed);
    /* C5. FINDS OR CREATES A CHAT - AuthContext.js, auth.routes.js, passport.js, WebSocketContext.jsx, websocket.js, Sidebar.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx 
    K7. CHAT WITH CHATBOT - ensureChatbotUser.js, AuthContext.js, auth.routes.js, passport.js, auth.routes.js, Sidebar.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, message.service.js, PageContext.jsx, ChatView.jsx, chatbot.routes.js, chatbot.controller.js, message.service.js, PageContext.jsx, ChatView.jsx
    - backend router routes "find_or_create_chat" client message to server message handler/chatHandlers.js */
    case "find_or_create_chat":
      /* C6. & K8. backend message handler finds or creates the chat via findOrCreateChat(userAId, userBId) service layer
      - "chat_ready" server response/message type */
      return handleFindOrCreateChat(ws, parsed);
    /* D5. CREATES A MESSAGE - AuthContext.js, auth.routes.js, passport.js, WebSocketContext.jsx, websocket.js, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, message.service.js, PageContext.jsx, ChatView.jsx
    K15. CHAT WITH CHATBOT
    - backend router routes "new_message" client message to backend message handler/chatHandlers.js */
    case "create_message":
      console.log("Routing to handleChat with data:", parsed);
      /* D6. * K16. backend message handler saves the message via createMessage(senderId, chatId, content) service function 
      - "new_message" server response/message type */
      return handleChat(ws, parsed);
    /* E5. DELETES A MESSAGE - AuthContext.js, auth.routes.js, passport.js, WebSocketContext.jsx, websocket.js, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, message.service.js, PageContext.jsx, ChatView.js
    - backend router routes "delete_message" client message */
    case "delete_message":
      /* E6. backend message handler deletes the message via softDeleteMessageByUser(messageId, userId) service function 
      - "message_deleted" server response/message type */
      return handleDeleteMessage(ws, parsed);
    /* F6. GETS ONLINE USERS - AuthContext.js, auth.routes.js, passport.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, userHandlers.js, user.service.js, PageContext.jsx, Sidebar.jsx
    - backend router routes "online_users" client message */
    case "online_users":
      /* F7. backend message handler gets online users via getOnlineUsers() service function  
      - "online_users" server response/message type */
      return handleOnlineUsers(ws);
    /* G6. GETS OFFLINE USERS - AuthContext.js, auth.routes.js, passport.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, userHandlers.js, user.service.js, PageContext.jsx, Sidebar.jsx
    - backend router routes "offline_users" client message */
    case "offline_users":
      /* G7. backend message handler gets offline users via getOfflineUsers() service function
      - "offline_users" server response/message type */
      return handleOfflineUsers(ws);

    default:
      ws.send(
        JSON.stringify({ type: "error", message: "Unsupported message type." })
      );
  }
}

module.exports = { routeWebSocketMessage };
