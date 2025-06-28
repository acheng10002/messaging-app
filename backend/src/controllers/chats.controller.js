/* chat-related HTTP request handlers 
maps HTTP chats routes to business logic 
service functions with db queries */
const {
  getUserChats,
  findOrCreateChat,
  getChatById,
  updateLastMessageAt,
} = require("../services/chat.service");
// custom error
const ApiError = require("../utils/ApiError");

/* GET /users/1/chats
protected, gets all of a user's chats */
const getUserChatsController = async (req, res, next) => {
  try {
    // userid already validated by ensureAuthUserMatchesParam
    const userId = Number(req.params.userid);
    // queries the db for authenticated user's chats/delegates it to service function
    const chats = await getUserChats(userId);
    // sends the list of chats back to client in JSON format
    res.json(chats);
  } catch (err) {
    // next cb passes control to error handler
    next(err);
  }
};

/* POST /users/1/chats
protected, starts a chat for a user */
const createChatController = async (req, res, next) => {
  try {
    // authenticated user
    const userAId = req.user.id;
    // other user to chat with; recipientId added to req.body by client
    const userBId = Number(req.body.recipientId);
    if (!userBId) throw new ApiError(400, "Recipient ID required");

    // delegates chat logic to service function
    const chat = await findOrCreateChat(userAId, userBId);
    res.status(201).json(chat);
  } catch (err) {
    // next cb passes control to error handler
    next(err);
  }
};

/* GET /users/1/chats/2
protected controller, finds a user's chat */
const getChatByIdController = async (req, res, next) => {
  // extracts the chatid parameter from the route and parses it into an integer
  const chatId = Number(req.params.chatid);
  const userId = req.user.id;

  try {
    // delegates chat logic to service function
    const chat = await getChatById(chatId, userId);

    // if successful, return chat (with members and messages) as JSON
    res.json(chat);
  } catch (err) {
    // next cb passes control to error handler
    next(err);
  }
};

/* PATCH /users/1/chats/2 
protected controller, updates a user's chat */
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
    // next cb passes control to error handler
    next(err);
  }
};

module.exports = {
  getUserChatsController,
  createChatController,
  getChatByIdController,
  updateChatController,
};
