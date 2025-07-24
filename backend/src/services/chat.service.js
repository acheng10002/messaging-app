// holds chat-related db queries/business rules
// db access layer
const prisma = require("../db/prisma");
// custom error
const ApiError = require("../utils/ApiError");

/* GETS USER CHATS - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatsPanel.jsx 
A8. backend service layer reads from db via Prisma and returns all of the users' chat objects */
async function getUserChats(authenticatedId) {
  try {
    // queries the db's Chat table using Prisma's client to find all Chat records for this user
    return prisma.chat.findMany({
      /* filters chats where members relation include the user with id authenticatedId
        some says "at least one member of this chat has id === authenticatedId" */
      where: { members: { some: { id: authenticatedId } } },
      include: {
        // tells Prisma to include full members array for each chat
        members: {
          select: { id: true, username: true },
        },
        // for each chat, include its most recent message only
        messages: {
          // sorts messages from newest to oldest
          orderBy: { sentAt: "desc" },
          // limit to just the first result after ordering (i.e. the latest message)
          take: 1,
          include: {
            // also fetches the sender of the first result
            sender: {
              select: { id: true, username: true },
            },
          },
        },
      },
      // sorts list of chats globally by lastMessageAt
      orderBy: {
        lastMessageAt: "desc",
      },
    });
  } catch (err) {
    console.error("getUserChats error:", err);
    // custom error for known error
    throw new ApiError(500, "Unable to retrieve chats");
  }
}

/* GETS SELECTED CHAT - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx
B8. backend service layer reads from db via Prisma and returns selected chat object */
async function getChatById(chatId, userId) {
  try {
    // fetches the chat by id
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        // includes all members
        members: true,
        messages: {
          // includes all non-deleted messages
          where: { isDeleted: false },
          orderBy: { sentAt: "asc" },
          include: {
            // includes sender object
            sender: true,
            // includes recipient object
            recipient: true,
          },
        },
      },
    });

    if (!chat) {
      // throws custom error for known error
      throw new ApiError(404, "Chat not found");
    }

    if (chat.members.length !== 2) {
      // throws custom error for known error
      throw new ApiError(400, "Chat must have exactly 2 members");
    }

    // returns 403 if req.user.id is not a member
    if (!chat.members.some((member) => member.id === userId)) {
      throw new ApiError(403, "Chat not found");
    }
    return chat;
  } catch (err) {
    console.error("Failed to retrieve chat by ID:", err);
    // if ApiError already thrown, throws it again
    if (err instanceof ApiError) throw err;
    // otherwise, throws custom error for known error
    throw new ApiError(500, "Unable to fetch chat");
  }
}

/* FINDS OR CREATES A CHAT - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, Sidebar.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx 
CHAT WITH CHATBOT - ensureChatbotUser.js, AuthContext.js, auth.routes.js, passport.js, auth.routes.js, Sidebar.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, message.service.js, PageContext.jsx, ChatView.jsx, chatbot.routes.js, chatbot.controller.js, message.service.js, PageContext.jsx, ChatView.jsx 
C8. & K9. backend service layer reads from db via Prisma and returns found or created chat object */
async function findOrCreateChat(userAId, userBId) {
  try {
    // checks if sender and recipient are the same person
    if (userAId === userBId) {
      // custom error for known error
      throw new ApiError(400, "Sender and recipient must be different");
    }

    const includeBlock = {
      members: true,
      messages: {
        include: {
          sender: true,
          recipient: true,
        },
      },
    };

    // searches for the first chat matching the specified conditions
    const existingChat = await prisma.chat.findFirst({
      where: {
        AND: [
          {
            members: {
              // ensures all members are within the [userAId, userBId] set
              some: { id: userAId },
            },
          },
          {
            members: {
              // ensures current user is one of the members
              some: { id: userBId },
            },
          },
          {
            members: {
              every: { id: { in: [userAId, userBId] } },
            },
          },
        ],
      },
      // includes the related members in the returned field
      include: includeBlock,
    });

    // returns matching chat between two specified people if found
    if (existingChat) return existingChat;

    // creates new chat with two members
    const newChat = await prisma.chat.create({
      data: {
        members: {
          // tells Prisma to link existing users with the new chat
          connect: [{ id: userAId }, { id: userBId }],
        },
      },
      // includes the related members in the returned field
      include: includeBlock,
    });

    // checks if chat has too few or too many members
    if (newChat.members.length !== 2) {
      throw new ApiError(400, "Chat must have exactly 2 members");
    }

    return newChat;
  } catch (err) {
    console.log("findOrCreateChat error:", err);
    // if ApiError already thrown, throws it again
    throw err instanceof ApiError
      ? err
      : // otherwise, throws custom error for known error
        new ApiError(500, "Failed to find or create chat");
  }
}

async function updateLastMessageAt(chatId, timestamp) {
  try {
    // updates the lastMessageAt field of the chat with matching chatId
    return prisma.chat.update({
      where: { id: chatId },
      data: { lastMessageAt: timestamp },
    });
  } catch (err) {
    console.error("Failed to update lastMessageAt:", err);
    // throws custom error for known error
    throw new ApiError(500, "Failed to update chat timestamp");
  }
}

module.exports = {
  getUserChats,
  getChatById,
  findOrCreateChat,
  updateLastMessageAt,
};
