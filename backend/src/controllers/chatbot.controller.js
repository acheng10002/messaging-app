const { findOrCreateChat, getChatById } = require("../services/chat.service");
const { createMessage } = require("../services/message.service");
const {
  broadcastToChatMembers,
} = require("../websocket/handlers/chatHandlers");
// custom error
const ApiError = require("../utils/ApiError");
require("dotenv").config();

const getChatbotResponseController = async (req, res) => {
  const CHATBOT_ID = parseInt(process.env.CHATBOT_ID || 999);
  const userId = req.user.id;
  const { content, chatId } = req.body || {};

  try {
    const trimmedContent = typeof content === "string" ? content.trim() : "";
    if (!trimmedContent) {
      throw new ApiError(400, "Content text is required.");
    }

    let chat;
    if (chatId != null) {
      // validate chat and logged in user's membership
      chat = await getChatById(Number(chatId), userId);
      const hasChatbot = chat.members.some((m) => m.id === CHATBOT_ID);
      if (!hasChatbot) {
        throw new ApiError(400, "Provided chatId is not Chatbot chat.");
      }
    } else {
      // creates or fetches user <--> Chatbot chat
      chat = await findOrCreateChat(userId, CHATBOT_ID);
    }

    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{ role: "user", content: trimmedContent }],
      }),
    });

    if (!apiRes.ok) {
      const text = await apiRes.text();
      console.error("Chatbot API error:", apiRes.status, text);
      throw new ApiError(502, "Chatbot API request failed.");
    }

    const chatbotJson = await apiRes.json();
    const chatbotText =
      (Array.isArray(chatbotJson.content) &&
        chatbotJson.content.find((c) => c.type === "text")?.text) ||
      "(Chatbot returned no text.)";

    /* K24. CHAT WITH CHATBOT - ensureChatbotUser.js, AuthContext.js, auth.routes.js, passport.js, auth.routes.js, Sidebar.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx, websocket.handlers.js, chatHandlers.js, message.service.js, PageContext.jsx, ChatView.jsx, chatbot.routes.js, chatbot.controller.js, message.service.js, PageContext.jsx, ChatView.jsx 
    - chatbot's response is turned into a message object that gets broadcast */
    const chatbotMsg = await createMessage(CHATBOT_ID, chat.id, chatbotText);

    // K25 CHAT WITH CHATBOT - sends "new_message" event to frontend
    broadcastToChatMembers(chat.members, {
      type: "new_message",
      data: chatbotMsg,
    });

    return res.status(201).json({ message: chatbotMsg });
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
