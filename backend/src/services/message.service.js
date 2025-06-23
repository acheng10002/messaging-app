// holds db queries/business rules
// db access layer
const prisma = require("../db/prisma");
const { updateLastMessageAt } = require("./chat.service");
const ApiError = require("../utils/ApiError");

async function createMessage(senderId, chatId, content) {
  try {
    // checks if a chat with chatId and senderId as a member, already exists
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { members: true },
    });

    // error handling if chat not found or if senderId is not a member of the chat
    if (!chat || !chat.members.some((member) => member.id === senderId)) {
      throw new ApiError(403, "User is not authorized to post in this chat");
    }

    // id of other member in the chat is recipientId
    const recipientId = chat.members.find(
      (member) => member.id !== senderId
    )?.id;

    // creates the message
    const message = await prisma.message.create({
      data: {
        content,
        senderId,
        recipientId,
        chatId,
      },
    });

    // updates chat's lastMessageAt
    await updateLastMessageAt(chatId, message.sentAt);
    return message;
  } catch (err) {
    console.error("Failed to create message:", err);
    throw new ApiError(500, "Failed to create message");
  }
}

async function softDeleteMessageByUser(messageId, userId) {
  try {
    // finds the message with matching id
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new ApiError(404, "Message not found");
    }

    if (message.senderId !== userId && message.recipientId !== userId) {
      throw new ApiError(403, "User not authorized to delete this message");
    }

    // soft delete
    return await prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true },
    });
  } catch (err) {
    console.error("Failed to delete message:", err);
    throw err instanceof ApiError
      ? err
      : new ApiError(500, "Failed to delete message");
  }
}

module.exports = {
  createMessage,
  softDeleteMessageByUser,
};
