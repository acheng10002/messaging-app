// imports chat-related functions
const { findOrCreateChat, getChatById } = require("../services/chat.service");
// imports chatbot's integration logic
const { getChatbotResponse } = require("../services/chatbot.service");
// imports function to send real-time message updates to all WebSocket-connected members
const {
  broadcastToChatMembers,
} = require("../websocket/handlers/chatHandlers");
// custom error
const ApiError = require("../utils/ApiError");
require("dotenv").config();

// Express controller that handles POST /chatbot/message requests
const getChatbotResponseController = async (req, res) => {
  // CHATBOT_ID from env
  const CHATBOT_ID = parseInt(process.env.CHATBOT_ID || 999);
  // authenticated user's id from JWT
  const userId = req.user.id;
  // content/message text and chatId from request body
  const { content, chatId } = req.body || {};

  try {
    // ensures content is a non-empty trimmed string
    const trimmedContent = typeof content === "string" ? content.trim() : "";
    if (!trimmedContent) {
      // throws a structured 400 error if invalid
      throw new ApiError(400, "Content text is required.");
    }

    let chat;
    if (chatId != null) {
      /* validates chat and logged in user's membership 
      - fetches chat and confirms the logged-in user is a member */
      chat = await getChatById(Number(chatId), userId);
      // ensures chatbot is part of the conversation
      const hasChatbot = chat.members.some((m) => m.id === CHATBOT_ID);
      if (!hasChatbot) {
        throw new ApiError(400, "Provided chatId is not Chatbot chat.");
      }
    } else {
      /* creates or fetches user <--> Chatbot chat fallback 
      - can't assume the chat will always exist by the time a POST /chatbot/messsage call is made */
      chat = await findOrCreateChat(userId, CHATBOT_ID);
    }

    /* K24. CHAT WITH CHATBOT - ensureChatbotUser.js, AuthContext.js, auth.routes.js, passport.js, auth.routes.js, Sidebar.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx, websocket.handlers.js, chatHandlers.js, message.service.js, PageContext.jsx, ChatView.jsx, chatbot.routes.js, chatbot.controller.js, message.service.js, PageContext.jsx, ChatView.jsx 
    - chatbot's response is turned into a message object that gets broadcast 
    - getChatbotResponse includes recent messages, gets reply, stores Claude's reply as a new message in db */
    const chatbotMsg = await getChatbotResponse({
      chatId: chat.id,
      content: trimmedContent,
    });

    /* K25 CHAT WITH CHATBOT - sends "new_message" event to frontend 
    WebSocket sends the message to all members in the chat in real-time */
    broadcastToChatMembers(chat.members, {
      type: "new_message",
      data: chatbotMsg,
    });

    // responds to the original POST /chatbot/message HTTP call with the chatbot message
    return res.status(201).json({ message: chatbotMsg });
    /* distinguishes between expected validation (bad input or invalid chat) and
       unexpected errors (Chatbot API failure or db error) */
  } catch (err) {
    if (err instanceof ApiError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("Chatbot controller unexpected error:", err);
    res.status(500).json({ error: "Failed to get Chatbot response" });
  }
};
module.exports = {
  getChatbotResponseController,
};
