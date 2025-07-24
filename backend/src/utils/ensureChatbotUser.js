/* 
K. CHAT WITH CHATBOT - ensureChatbotUser.js, AuthContext.js, auth.routes.js, passport.js, auth.routes.js, Sidebar.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx, chatbot.routes.js, chatbot.controller.js, chat.service.js, PageContext.jsx, ChatView.jsx
K1. creates the chatbot user once on server start */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
require("dotenv").config();

// takes CHATBOT_ID from .env and parses it as an int
const CHATBOT_ID = parseInt(process.env.CHATBOT_ID || 999);

async function ensureChatbotUser() {
  try {
    // finds the chatbot user in the db
    const chatbot = await prisma.user.findUnique({
      where: { id: CHATBOT_ID },
    });

    // if chatbot user doesn't yet exist, create it
    if (!chatbot) {
      await prisma.user.create({
        data: {
          id: CHATBOT_ID,
          name: "Chatbot",
          username: "chatbot",
          email: "chatbot@system.local",
          password: "",
          isOnline: true,
        },
      });
    }
  } catch (err) {
    // if any error during record check, log it
    console.error("Failed to ensure chatbot user:", err);
  }
}

module.exports = { ensureChatbotUser };
