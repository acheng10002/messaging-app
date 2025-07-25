// for db operations
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
// service function that handles creating and saving new messages to the db
const { createMessage } = require("./message.service");
// custom error class to throw known errors with HTTP status codes
const ApiError = require("../utils/ApiError");
require("dotenv").config();

// base url for sending message requests to the Chatbot API
const CHATBOT_API_URL = "https://api.anthropic.com/v1/messages";
// reads my Chatbot API key from env variables
const CHATBOT_API_KEY = process.env.CHATBOT_API_KEY;
// the senderId for the chatbot that's replying
const CHATBOT_ID = parseInt(process.env.CHATBOT_ID || 999);

// takes chat id and the user message content
async function getChatbotResponse({ chatId, content }) {
  /* retrieves the 20 most recent non-deleted messages from the chat, ordered chronologically,
  and includes sender info for role mapping */
  const recentMessages = await prisma.message.findMany({
    where: {
      chatId,
      isDeleted: false,
    },
    include: {
      sender: true,
    },
    orderBy: { sentAt: "asc" },
    take: 20,
  });

  // transforms the message history into Chatbot-compatible format
  const historyText = recentMessages
    .map((msg) => {
      // "role": "assistant" if sent by the bot; otherwise, "user" and actual message text
      const label = msg.senderId === CHATBOT_ID ? "assistant" : "user";
      return `${label}: ${msg.content}`;
    })
    .join("\n");

  // adds the current user message to the conversation context before sending to Chatbot
  const messages = [
    {
      role: "user",
      content: `CONVERSATION HISTORY:\n${historyText}`,
    },
    {
      role: "user",
      content: `NEW QUESTION:\n${content}`,
    },
  ];

  // sends POST request to Chatbot with
  const response = await fetch(CHATBOT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // API key
      "x-api-key": CHATBOT_API_KEY,
      // version header
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      // model selection
      model: "claude-sonnet-4-20250514",
      // token limit
      max_tokens: 1024,
      // randomness
      temperature: 0.7,
      // conversation context
      messages,
    }),
  });

  // reads the raw response body as text before parsing JSON manually
  const rawBody = await response.text();

  // if HTTP status is not 200, log the error and throw a custom ApiError
  if (!response.ok) {
    console.error("Chatbot API error:", response.status, rawBody);
    throw new ApiError(response.status, "Chatbot API request.");
  }

  let data;
  try {
    // attempts to parse the response as JSON
    data = JSON.parse(rawBody);
  } catch (err) {
    // if parsing fails, throw an ApiError
    console.error("Failed to parse Chatbot response:", rawBody);
    throw new ApiError(502, "Chatbot returned invalid JSON.");
  }

  /* logs the entire chatbot response for debugging 
  JSON.stringify(value, replacer, space)
  value - data I want to stringify 
  replacer - optional second arg, function that lets me control how values are serialized in JSON
             (how to convert a JS object or value into a string format)
  space - number of spaces used for indentation 
  /* - AFTER WEBSOCKET CONNECTED FOR USER ID,
  CONFIRMS FRONTEND WEBSOCKET REQUESTS,
  AUTOMATICALLY FETCHES CURRENT USER CHATS, RETRIEVES ONLINE USERS, RETRIEVES OFFLINE USERS,
  USER REQUESTS FULL DETAILS FOR A CHAT ID,
  USER HAS SUBMITTED A MESSAGE TO THE CHATBOT VIA WEBSOCKET,
  MESSAGE HANDED OFF TO THE MESSAGE HANDLER FOR ROUTING, 
  HANDLECHAT WAS INVOKED WITH THE CORRECT DATA, 
  CONTENT WAS NON-EMPTY AND PASSED VALIDATION,
  THE JWT TOKEN WAS INCLUDED WITH THE REQUEST FOR AUTHENTICATION,
  THE USER'S MESSAGE WAS SUCCESSFULLY WRITTEN TO THE DB, INCLUDING METADATA, 
  MESSAGE IS BEING SENT IN REAL-TIME TO BOTH CHAT MEMBERS,
  CONFIRMS THE RAW CHATBOT API RESPONSE INCUDES MESSAGE ID, MODEL USED, TEXT CONTENT OF REPLY, TOKEN USAGE, AND COMMENTARY */
  console.log("Full Chatbot response:", JSON.stringify(data, null, 2));

  // extracts the chatbot's reply from the response object
  const rawReply = data.content?.[0]?.text;
  // ensure the chatbot's replay is a string and trims whitespace
  const reply = typeof rawReply === "string" ? rawReply.trim() : "";

  if (!reply) {
    // if the reply is empty or malformed, log and throw a 500-level ApiError
    console.error(
      "Chatbot returned empty or malformed reply:",
      JSON.stringify(data, null, 2)
    );
    throw new ApiError(500, "Chatbot returned an empty response.");
  }

  /* logs the reply that will be saved 
  - AFTER WEBSOCKET CONNECTED FOR USER ID,
  CONFIRMS FRONTEND WEBSOCKET REQUESTS,
  AUTOMATICALLY FETCHES CURRENT USER CHATS, RETRIEVES ONLINE USERS, RETRIEVES OFFLINE USERS,
  USER REQUESTS FULL DETAILS FOR A CHAT ID,
  USER HAS SUBMITTED A MESSAGE TO THE CHATBOT VIA WEBSOCKET,
  MESSAGE HANDED OFF TO THE MESSAGE HANDLER FOR ROUTING, 
  HANDLECHAT WAS INVOKED WITH THE CORRECT DATA, 
  CONTENT WAS NON-EMPTY AND PASSED VALIDATION,
  THE JWT TOKEN WAS INCLUDED WITH THE REQUEST FOR AUTHENTICATION,
  THE USER'S MESSAGE WAS SUCCESSFULLY WRITTEN TO THE DB, INCLUDING METADATA, 
  MESSAGE IS BEING SENT IN REAL-TIME TO BOTH CHAT MEMBERS,
  THE RAW CHATBOT API RESPONSE,
  CONFIRMS THE EXTRACTED REPLY FROM CHATBOT AND IS READY TO BE SAVED */
  console.log("Saving Chatbot reply:", reply);

  // save chatbot's response to db
  const saved = await createMessage(CHATBOT_ID, chatId, reply);

  // returns the saved message object to the caller, getChatbotResponse controller
  return saved;
}

module.exports = { getChatbotResponse };
