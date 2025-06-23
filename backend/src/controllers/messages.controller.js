const {
  createMessage,
  softDeleteMessageByUser,
} = require("../services/message.service");
const ApiError = require("../utils/ApiError");

const createMessageController = async (req, res, next) => {
  try {
    const senderId = req.user.id;
    const chatId = Number(req.params.chatid);
    const { content } = req.body;

    if (!content) {
      throw new ApiError(400, "Message content is required");
    }

    const message = await createMessage(senderId, chatId, content);
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
};

const deleteMessageController = async (req, res, next) => {
  try {
    const messageId = Number(req.params.messageid);
    const userId = req.user.id;

    const result = await softDeleteMessageByUser(messageId, userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createMessageController,
  deleteMessageController,
};
