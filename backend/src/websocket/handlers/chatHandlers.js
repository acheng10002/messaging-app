/* implements WebSocket-specific logic for chats
- handles sending messages
- handles retrieving a chat
- handles getting chats list
- handles finding/creating a chat 
- calls service layer
- sends back server-formated responses */
const { createMessage } = require("../../services/message.service");
const {
  getChatById,
  getUserChats,
  findOrCreateChat,
} = require("../../services/chat.service");

async function handlePing(ws) {
  // 3D. Received (from server): {"type":"pong","message":"Alive"}
  ws.send(JSON.stringify({ type: "pong", message: "Alive" }));
}

/* user creates a new message in a chat 
SENDS A MESSAGE
2. Server processes the message and responds */
async function handleChat(ws, parsed) {
  try {
    const message = await createMessage(
      ws.user.id,
      parsed.chatId,
      parsed.content
    );
    /* handleChat sends back to the client something like this:
    6D. Received (from server): {"type":"chat","data":{"id":4,"sentAt":"2025-06-24T19:38:31.281Z",
    "content":"Hello from client!","isDeleted":false,"senderId":1,"recipientId":2,"chatId":2}} */
    ws.send(JSON.stringify({ type: "chat", data: message }));
  } catch (err) {
    ws.send(JSON.stringify({ type: "error", message: err.message }));
  }
}

// user navigates to an existing chat
async function handleGetChat(ws, parsed) {
  try {
    const chat = await getChatById(parsed.chatId, ws.user.id);
    // 7B. Received (from server): {"type":"chat_history","data":{"id":2,"createdAt":"2025-06-23T16:11:12.837Z",
    // "lastMessageAt":"2025-06-24T19:38:31.281Z","members":[{"id":1,"name":"Alice","username":"alice123",
    // "email":"alice@example.com","password":"$2b$10$8H9lkNI/Dezni2euj8Q3Lu9bURR8e/YthUJaOmNgEDGvxptGkBirG",
    // "isOnline":true,"createdAt":"2025-06-23T15:59:52.824Z"},{"id":2,"name":"Bob","username":"bob",
    // "email":"bob@example.com","password":"$2b$10$mIH51D85vZIm0CFRuCQzS.iFCJaMxkHq2S70wrNo0ZvTulBry3zTK",
    // "isOnline":false,"createdAt":"2025-06-23T16:08:43.889Z"}],"messages":[{"id":2,
    // "sentAt":"2025-06-23T16:41:02.966Z","content":"Hi again!","isDeleted":false,"senderId":1,"recipientId":2,
    // "chatId":2},{"id":3,"sentAt":"2025-06-24T19:11:00.804Z","content":"Hello from client!","isDeleted":false,
    // "senderId":1,"recipientId":2,"chatId":2},{"id":4,"sentAt":"2025-06-24T19:38:31.281Z",
    // "content":"Hello from client!","isDeleted":false,"senderId":1,"recipientId":2,"chatId":2}]}}
    ws.send(JSON.stringify({ type: "chat_history", data: chat }));
  } catch (err) {
    ws.send(JSON.stringify({ type: "error", message: err.message }));
  }
}

// user sees all chats, newest message in all chats, and lastMessageAt for all chats
async function handleGetUserChats(ws) {
  try {
    const chats = await getUserChats(ws.user.id);
    // 5D. Received (from server): {"type":"chats:list","data":[{"id":2,"createdAt":"2025-06-23T16:11:12.837Z",
    // "lastMessageAt":"2025-06-24T19:11:00.804Z","members":[{"id":1,"name":"Alice","username":"alice123",
    // "email":"alice@example.com","password":"$2b$10$8H9lkNI/Dezni2euj8Q3Lu9bURR8e/YthUJaOmNgEDGvxptGkBirG",
    // "isOnline":true,"createdAt":"2025-06-23T15:59:52.824Z"},{"id":2,"name":"Bob","username":"bob",
    // "email":"bob@example.com","password":"$2b$10$mIH51D85vZIm0CFRuCQzS.iFCJaMxkHq2S70wrNo0ZvTulBry3zTK",
    // "isOnline":false,"createdAt":"2025-06-23T16:08:43.889Z"}],"messages":[{"id":3,
    // "sentAt":"2025-06-24T19:11:00.804Z","content":"Hello from client!","isDeleted":false,"senderId":1,
    // "recipientId":2,"chatId":2}]}]}
    ws.send(JSON.stringify({ type: "chats:list", data: chats }));
  } catch (err) {
    ws.send(JSON.stringify({ type: "error", message: err.message }));
  }
}

// user initializes or re-opens a conversation
async function handleFindOrCreateChat(ws, parsed) {
  const { recipientId } = parsed;
  if (!recipientId) {
    ws.send(JSON.stringify({ type: "error", message: "Missing recipientId" }));
    return;
  }
  try {
    const chat = await findOrCreateChat(ws.user.id, recipientId);
    // 4D. Received (from server): {"type":"chat:ready","data":{"id":2,"createdAt":"2025-06-23T16:11:12.837Z",
    // "lastMessageAt":"2025-06-23T16:49:47.970Z","members":[{"id":1,"name":"Alice",
    // "username":"alice123","email":"alice@example.com","password":
    // "$2b$10$8H9lkNI/Dezni2euj8Q3Lu9bURR8e/YthUJaOmNgEDGvxptGkBirG","isOnline":true,
    // "createdAt":"2025-06-23T15:59:52.824Z"},{"id":2,"name":"Bob","username":"bob",
    // "email":"bob@example.com","password":"$2b$10$mIH51D85vZIm0CFRuCQzS.iFCJaMxkHq2S70wrNo0ZvTulBry3zTK",
    // "isOnline":false,"createdAt":"2025-06-23T16:08:43.889Z"}]}}
    ws.send(JSON.stringify({ type: "chat:ready", data: chat }));
  } catch (err) {
    ws.send(JSON.stringify({ type: "error", message: err.message }));
  }
}

module.exports = {
  handlePing,
  handleChat,
  handleGetChat,
  handleGetUserChats,
  handleFindOrCreateChat,
};
