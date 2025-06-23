// maps HTTP chats routes to budiness logic
// db queries
const {
  getUserChats,
  findOrCreateChat,
  getChatById,
  updateLastMessageAt,
} = require("../services/chat.service");
const ApiError = require("../utils/ApiError");

// protected controller
const getUserChatsController = async (req, res, next) => {
  try {
    // userid already validated by ensureAuthUserMatchesParam
    const userId = Number(req.params.userid);
    // queries the db for authenticated user's chats
    const chats = await getUserChats(userId);
    // sends the list of chats back to client in JSON format
    res.json(chats);
  } catch (err) {
    next(err);
  }
};

// protected controller
const createChatController = async (req, res, next) => {
  try {
    // authenticated user
    const userAId = req.user.id;
    // other user to chat with
    const userBId = Number(req.body.recipientId);
    if (!userBId) throw new ApiError(400, "Recipient ID required");

    // delegates chat logic to service function
    const chat = await findOrCreateChat(userAId, userBId);
    res.status(201).json(chat);
  } catch (err) {
    next(err);
  }
};

// protected controller
const getChatByIdController = async (req, res) => {
  // extracts the chatid parameter from the route and parses it into an integer
  const chatId = Number(req.params.chatid);

  try {
    // delegates chat logic to service function
    const chat = await getChatById(chatId);

    // if successful, return chat (with members and messages) as JSON
    res.json(chat);
  } catch (err) {
    next(err);
  }
};

// protected controller
const updateChatController = async (req, res, next) => {
  try {
    // extracts chatid from URL
    const chatId = Number(req.params.chatid);

    const timestamp = new Date();

    // delegates chat logic to service function
    const updated = await updateLastMessageAt(chatId, timestamp);

    // returns result as JSON
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUserChatsController,
  createChatController,
  getChatByIdController,
  updateChatController,
};
