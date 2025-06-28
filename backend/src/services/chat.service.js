// holds chat-related db queries/business rules
// db access layer
const prisma = require("../db/prisma");
// custom error
const ApiError = require("../utils/ApiError");

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

async function findOrCreateChat(userAId, userBId) {
  try {
    // checks if sender and recipient are the same person
    if (userAId === userBId) {
      // custom error for known error
      throw new ApiError(400, "Sender and recipient must be different");
    }

    // searches for the first chat matching the specified conditions
    const existingChat = await prisma.chat.findFirst({
      where: {
        members: {
          // ensures all members are within the [userAId, userBId] set
          every: {
            id: { in: [userAId, userBId] },
          },
          // ensures current user is one of the members
          some: {
            id: userAId,
          },
        },
      },
      // includes the related members in the returned field
      include: {
        members: true,
      },
    });

    // returns matching chat between two specified people if found
    if (existingChat && existingChat.members.length === 2) return existingChat;

    // creates new chat with two members
    const chat = await prisma.chat.create({
      data: {
        members: {
          // tells Prisma to link existing users with the new chat
          connect: [{ id: userAId }, { id: userBId }],
        },
      },
      // includes the related members in the returned field
      include: {
        members: true,
      },
    });

    // checks if chat has too few or too many members
    if (chat.members.length !== 2) {
      throw new ApiError(400, "Chat must have exactly 2 members");
    }

    return chat;
  } catch (err) {
    console.log("findOrCreateChat error:", err);
    // if ApiError already thrown, throws it again
    throw err instanceof ApiError
      ? err
      : // otherwise, throws custom error for known error
        new ApiError(500, "Failed to find or create chat");
  }
}

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
  findOrCreateChat,
  getChatById,
  updateLastMessageAt,
};
