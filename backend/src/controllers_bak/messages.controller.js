/* message-related HTTP request handlers  
maps HTTP chats routes to business logic  
service functions with db queries */
const {
  createMessage,
  softDeleteMessageByUser,
} = require("../services/message.service");
// custom error
const ApiError = require("../utils/ApiError");

/* POST /users/1/chats/2/messages
protected, creates a new message */
const createMessageController = async (req, res, next) => {
  try {
    // takes id from req.user
    const senderId = req.user.id;
    // takes chatid from the route paramters
    const chatId = Number(req.params.chatid);
    // destructures content from req.body
    const { content } = req.body;

    if (!content) {
      throw new ApiError(400, "Message content is required");
    }
    /* creates a message from the user in req.user, in the chat with chatId, 
    with the content from req.body */
    const message = await createMessage(senderId, chatId, content);
    res.status(201).json(message);
  } catch (err) {
    // next cb passes control to error handler
    next(err);
  }
};

/* DELETE /users/1/chats/2/messages/1 
protected, deletes a message */
const deleteMessageController = async (req, res, next) => {
  try {
    // takes messageid from the route paramters
    const messageId = Number(req.params.messageid);
    // takes message's owner's id from req.user.id
    const userId = req.user.id;

    // deletes the message with messageId belonging to user with userId
    const result = await softDeleteMessageByUser(messageId, userId);
    res.json(result);
  } catch (err) {
    // next cb passes control to error handler
    next(err);
  }
};

module.exports = {
  createMessageController,
  deleteMessageController,
};
