/* implements WebSocket-specific logic for chats
- handles sending messages
- handles deleting messages
- handles retrieving a chat
- handles getting chats list
- handles finding/creating a chat 
- calls service layer
- sends back server-formated responses */
const {
  createMessage,
  softDeleteMessageByUser,
} = require("../../services/message.service");
const {
  getChatById,
  getUserChats,
  findOrCreateChat,
} = require("../../services/chat.service");

// imports the Map from the central WebSocket connection manager module
const { activeConnections } = require("../connections");

/* will broadcast an operation to all members of a chat
- chatMembers - array of user objects who are part of a chat
- payload - a serialized object to be sent to each member
  ("serialized" - object can be passed to JSON.stringify(obj) 
  without throwing an error)
*/
function broadcastToChatMembers(chatMembers, payload) {
  // iterates over each member in the chatMembers array
  chatMembers.forEach((member) => {
    // retrieves the Set of live WebSocket connections for this user's id
    const conns = activeConnections.get(member.id);
    // if there are active WebSocket connections for this user
    if (conns) {
      // iterates over each of the connections
      conns.forEach((ws) => {
        // sends the payload to the client over WebSocket after serializing it to JSON
        ws.send(JSON.stringify(payload));
      });
    }
  });
}

/* A7. GETS USER CHATS - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatsPanel.jsx 
- backend message handler gets user chats
- user sees all chats, newest message in all chats, and lastMessageAt for all chats */
async function handleGetUserChats(ws) {
  try {
    //  accesses all of the logged-in user's chats from db via getUserChats service function, returns all the user's chats
    const chats = await getUserChats(ws.user.id);
    /* - on mount, client user automatically sees their chats / client's "get_user_chats" message
    - server routes the client's message to the correct handler / server's routeWebSocketMessage(ws, parsed)
    - server handler here gets all the chats via a service function / server's getUserChats(ws.user.id)
    - server sends "chats_list" message and chats object data to the client / below  
    - sender client updates its state when all their chats are retrieved */
    ws.send(JSON.stringify({ type: "chats_list", data: chats }));
  } catch (err) {
    // sends error message back to client who initiated request for all chats with relevant error message
    ws.send(JSON.stringify({ type: "error", message: err.message }));
  }
}

/* B7. GETS SELECTED CHAT - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx
- backend message handler for WebSocket message requesting a specific chat */
async function handleGetChat(ws, parsed) {
  try {
    /* accesses the chat from db via getChatByUd service function, returns the full chat 
    parsed.chatId - relevant chat's id
    ws.user.id - logged-in user's id */
    const chat = await getChatById(parsed.chatId, ws.user.id);
    /* - client user clicks view full chat button / client's "get_chat" message
    - server routes the client's message to the correct handler / server's routeWebSocketMessage(ws, parsed)
    - server handler here gets the chat via a service function / server's getChatById(parsed.chatId, ws.user.id)
    - server sends "chat_history" message and chat object data to the client / below  
    - sender client updates its state when the full chat is retrieved */
    ws.send(JSON.stringify({ type: "chat_history", data: chat }));
  } catch (err) {
    // sends error message back to client who initiated request for specific chat with relevant error message
    ws.send(JSON.stringify({ type: "error", message: err.message }));
  }
}

/* C7. FINDS OR CREATES A CHAT - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, Sidebar.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx
K9. CHAT WITH CHATBOT - ensureChatbotUser.js, AuthContext.js, auth.routes.js, passport.js, auth.routes.js, Sidebar.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, message.service.js, PageContext.jsx, ChatView.jsx, chatbot.routes.js, chatbot.controller.js, message.service.js, PageContext.jsx, ChatView.jsx
- handleFindOrCreateChat calls backend service layer which returns selected or created chat object
- user initializes or re-opens a conversation */
async function handleFindOrCreateChat(ws, parsed) {
  // extracts recipientId from the parsed WebSocket message
  const { recipientId } = parsed;
  if (!recipientId) {
    // if recipientId is null or undefined, send error response back and exists function early
    ws.send(JSON.stringify({ type: "error", message: "Missing recipientId" }));
    return;
  }
  try {
    //  gets the chat object between the logged-in user and user with recipientId via findOrCreateChat service function
    const chat = await findOrCreateChat(ws.user.id, recipientId);

    /* K10. CHAT WITH CHATBOT - server message handler broadcasts data to chat members and sends a "chat_ready" 
    message to the frontend
    - client user clicks sidebar button to start or resume a chat / client's "find_or_create_chat" message
    - server routes the client's message to the correct handler / server's routeWebSocketMessage(ws, parsed)
    - server handler here finds or creates the chat via a service function / server's handleFindOrCreateChat(ws, parsed) 
    - server sends "chat_ready" message and chat object data to the client / below 
    - sender client updates its state when the chat is created or resumed */
    ws.send(JSON.stringify({ type: "chat_ready", data: chat }));
  } catch (err) {
    // if error occurs during chat creation or lookup, error message sent back to requester
    ws.send(JSON.stringify({ type: "error", message: err.message }));
  }
}

/* D7. CREATES A MESSAGE - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, message.service.js, PageContext.jsx, ChatView.jsx
K17. CHAT WITH CHATBOT - ensureChatbotUser.js, AuthContext.js, auth.routes.js, passport.js, auth.routes.js, Sidebar.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx, chatbot.routes.js, chatbot.controller.js, chat.service.js, PageContext.jsx, ChatView.jsx
- backend message handler saves the message and broadcasts the new message to all chat participiants via their WebSocket connections  
ws - specific client's websocket connection
parsed - incoming client message parsed into JSON object */
async function handleChat(ws, parsed) {
  try {
    /* - AFTER WEBSOCKET CONNECTED FOR USER ID,
    CONFIRMS FRONTEND WEBSOCKET REQUESTS,
    AUTOMATICALLY FETCHES CURRENT USER CHATS, RETRIEVES ONLINE USERS, RETRIEVES OFFLINE USERS,
    USER REQUESTS FULL DETAILS FOR A CHAT ID,
    USER HAS SUBMITTED A MESSAGE TO THE CHATBOT VIA WEBSOCKET,
    MESSAGE HANDED OFF TO THE MESSAGE HANDLER FOR ROUTING, 
    CONFIRMS HANDLECHAT WAS INVOKED WITH THE CORRECT DATA */
    console.log("handleChat invoked with data:", parsed);
    // persists the message to db via createMessage service function returns the full message
    const message = await createMessage(
      // sender's user id (attached to the WebSocket during auth)
      ws.user.id,
      // chat id of chat receiving the message
      parsed.chatId,
      // actual message text
      parsed.content
    );
    /* - AFTER WEBSOCKET CONNECTED FOR USER ID,
    CONFIRMS FRONTEND WEBSOCKET REQUESTS,
    AUTOMATICALLY FETCHES CURRENT USER CHATS, RETRIEVES ONLINE USERS, RETRIEVES OFFLINE USERS,
    USER REQUESTS FULL DETAILS FOR A CHAT ID,
    USER HAS SUBMITTED A MESSAGE TO THE CHATBOT VIA WEBSOCKET,
    MESSAGE HANDED OFF TO THE MESSAGE HANDLER FOR ROUTING, 
    HANDLECHAT WAS INVOKED WITH THE CORRECT DATA, 
    CONTENT WAS NON-EMPTY AND PASSED VALIDATION,
    THE JWT TOKEN WAS INCLUDED WITH THE REQUEST FOR AUTHENTICATION,
    CONFIRMS THE USER'S MESSAGE WAS SUCCESSFULLY WRITTEN TO THE DB, INCLUDING METADATA */
    console.log("Message created in DB:", message);

    // ensures saved message is linked to a valid chat object and that chat includes member info
    if (!message.chat || !message.chat.members) {
      // if chat or chat members are missing, returns an error directly to the sender and exits early
      return ws.send(
        JSON.stringify({
          type: "error",
          message: "Chat not found or missing members.",
        })
      );
    }
    // CONFIRMS MESSAGE IS BEING SENT IN REAL-TIME TO BOTH CHAT MEMBERS
    console.log(
      "Broadcasting new_message to chat members:",
      message.chat.members.map((m) => m.id)
    );

    /* - client user sends a new message / client's "new_message" message
    - server routes the client's message to the correct handler / server's routeWebSocketMessage(ws, parsed)
    - server handler here creates the message via a service function / server's createMessage(ws.user.id, parsed.chatId, parsed.content)
    - server sends "new_message" message and message object data to all chat members / below  
    - sender client updates its state when the message is posted 
    - looks up each member's WebSocket connections and pushes the message to each socket */
    broadcastToChatMembers(message.chat.members, {
      type: "new_message",
      data: message,
    });
  } catch (err) {
    ws.send(JSON.stringify({ type: "error", message: err.message }));
  }
}

/* E7. DELETES A MESSAGE - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, message.service.js, PageContext.jsx, ChatView.jsx
- backend message handler soft deletes the message and broadcasts the soft deletion to all chat participants */
async function handleDeleteMessage(ws, parsed) {
  // destructures messageId from client's message payload
  const { messageId } = parsed;
  if (!messageId) {
    // if messageId is missing, sends an error response to the client and exits function early
    return ws.send(
      JSON.stringify({ type: "error", message: "Missing messageId" })
    );
  }

  try {
    /* soft deletes the message in the db via softDeleteMessageByUser service function 
    service function verifies permissions and updates the isDeleted flag */
    const deletedMessage = await softDeleteMessageByUser(messageId, ws.user.id);

    // checks that the chat associated with the deleted message exists and has members
    if (deletedMessage.chat?.members) {
      /* - client user sends a new message / client's "delete_message" message
      - server routes the client's message to the correct handler / server's routeWebSocketMessage(ws, parsed)
      - server handler here soft deletes the message via a service function / server's createMessage(ws.user.id, parsed.chatId, parsed.content)
      - server sends "delete_message" message and id of the deleted message to all chat members / below  
      - sender client updates its state when the message is deleted
      sends a WebSocket message to all members of the chat, informing them the message has been deleted */
      broadcastToChatMembers(deletedMessage.chat.members, {
        type: "delete_message",
        data: { id: deletedMessage.id },
      });
    }
  } catch (err) {
    // sends error message back to client who initiated delete with relevant error message
    ws.send(JSON.stringify({ type: "error", message: err.message }));
  }
}

module.exports = {
  broadcastToChatMembers,
  handleChat,
  handleGetChat,
  handleDeleteMessage,
  handleGetUserChats,
  handleFindOrCreateChat,
};
