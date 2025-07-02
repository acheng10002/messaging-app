// holds message-related db queries/business rules
// db access layer
const prisma = require("../db/prisma");
// service query with db query
const { updateLastMessageAt } = require("./chat.service");
// custom error
const ApiError = require("../utils/ApiError");

async function createMessage(senderId, chatId, content) {
  try {
    if (!content?.trim()) {
      throw new ApiError(400, "Message content cannot be empty");
    }

    // checks if a chat with chatId and senderId as a member, already exists
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { members: true },
    });

    // error handling if chat not found or if senderId is not a member of the chat
    if (!chat || !chat.members.some((member) => member.id === senderId)) {
      // custom error for known error
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
      include: {
        sender: true,
        recipient: true,
        chat: {
          include: {
            members: true,
          },
        },
      },
    });

    // updates chat's lastMessageAt
    await updateLastMessageAt(chatId, message.sentAt);
    return message;
  } catch (err) {
    console.error("Failed to create message:", err);
    // custom error for known error
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
      // custom error for known error
      throw new ApiError(404, "Message not found");
    }
    // checks if the logged in user is neither the message's sender nor its recipient
    if (message.senderId !== userId && message.recipientId !== userId) {
      // custom error for known error
      throw new ApiError(403, "User not authorized to delete this message");
    }

    // soft delete
    return await prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true },
      include: {
        chat: {
          include: {
            members: true,
          },
        },
      },
    });
  } catch (err) {
    console.error("Failed to delete message:", err);
    // if ApiError already thrown, throws it again
    throw err instanceof ApiError
      ? err
      : // otherwise, throws custom error for known error
        new ApiError(500, "Failed to delete message");
  }
}

module.exports = {
  createMessage,
  softDeleteMessageByUser,
};
