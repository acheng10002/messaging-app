/* React hooks 
useRef - holds a mutable value that doesn't trigger re-renders */
import { useEffect, useState, useRef } from "react";
// gives access to active WebSocket instance
import { useWebSocket } from "../../contexts/WebSocketContext";
// provides current chat and its messages
import { usePageContext } from "../../contexts/PageContext";
// gives access to logged-in user
import { useAuth } from "../../hooks/useAuth";
// gives access to function to send message to chatbot
import { useChatbot } from "../../hooks/useChatbot";
// extract route parameters, specifically chatid
import { useParams, useNavigate } from "react-router-dom";
import "./ChatView.css";

const ChatView = () => {
  /* initializes...
  active WebSocket connection */
  const socket = useWebSocket();
  /* messages and chat pulled from page-level context 
  K12, K20, & K28. CHAT WITH CHATBOT - ensureChatbotUser.js, AuthContext.js, auth.routes.js, passport.js, auth.routes.js, Sidebar.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx  
  - ChatView gets the updated chat and messages objects from PageContext */
  const { messages, chat } = usePageContext();
  // currently authenticated user
  const { user, token } = useAuth();
  // function to send message to chatbot
  const { sendMessage } = useChatbot();
  const CHATBOT_ID = Number(import.meta.env.VITE_CHATBOT_ID);
  // chatid extracted from URL
  const { chatid } = useParams();
  const navigate = useNavigate();
  // message input content state
  const [content, setContent] = useState("");

  /* ref for the scroll anchor 
  reference to an empty <div> element that will be placed at the bottom of the 
  chat messages list */
  const bottomRef = useRef(null);

  // prevents render crash if user is not available
  if (!user)
    return (
      <div className="form-container">
        <h2>Welcome</h2>
        <p>Please register or log in if you have an account.</p>
      </div>
    );

  /* B10. GETS SELECTED CHAT - AuthContext.js, auth.routes.js, passport.js, WebSocketContext.jsx, websocket.js, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx
  - UI update, ChatView sees messages and chat change 
  C10. FINDS OR CREATES A CHAT - AuthContext.js, auth.routes.js, passport.js, WebSocketContext.jsx, websocket.js, Sidebar.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx
  - UI update, ChatView sees messages and chat change
  D10. CREATES A MESSAGE - AuthContext.js, auth.routes.js, passport.js, WebSocketContext.jsx, websocket.js, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, message.service.js, PageContext.jsx, ChatView.jsx 
  - UI update, ChatView sees messages change
  - useEffect() tied to [messages] fires and scrolls to the bottom
  - message sender, content, and time are rendered immediately
  requests chat history for single chat when chatId changes 
  /* E10. DELETES A MESSAGE - AuthContext.js, auth.routes.js, passport.js, WebSocketContext.jsx, websocket.js, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, message.service.js, PageContext.jsx, ChatView.js 
  - UI update, ChatView sees messages change */
  useEffect(() => {
    if (socket && chatid) {
      /* sends a get_chat request via WebSocket to fetch messages for this chat 
      B3. GETS SELECTED CHAT - AuthContext.js, auth.routes.js, passport.js, WebSocketContext.jsx, websocket.js, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx   
      - frontend client sends a Websocket "get_chat" message to the server */
      socket.send(JSON.stringify({ type: "get_chat", chatId: Number(chatid) }));
    }
    // effect runs on mount, when socket or when chatid changes
  }, [socket, chatid]);

  // auto-scrolls to bottom on new messages
  useEffect(() => {
    // checks if the bottomRef DOM node exists
    if (bottomRef.current) {
      /* if yes, scrollInView gets called on that node 
      scrolls the container to bring the anchor <div> into view */
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
    /* auto-scrolling  runs every time messages change (i.e. when a new message 
  is received) */
  }, [messages]);

  // finds the other user in the chat, besides the logged-in user
  const otherMember = chat?.members?.find((m) => m.id !== user.id);

  const handleSend = async () => {
    // prevents sending empty or whitespace-only messages
    if (!content.trim()) return;

    try {
      console.log("Token being sent to chatbot:", token);
      console.log("Sending message via WebSocket:", content);

      /* D3. CREATES A MESSAGE - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, message.service.js, PageContext.jsx, ChatView.jsx
      K13. CHAT WITH CHATBOT - ensureChatbotUser.js, AuthContext.js, auth.routes.js, passport.js, auth.routes.js, Sidebar.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, message.service.js, PageContext.jsx, ChatView.jsx, chatbot.routes.js, chatbot.controller.js, message.service.js, PageContext.jsx, ChatView.jsx
      K - 1. creates the chatbot user once on server start, 2. gets token from AuthContext, 3 & 4. with token gets req.user in auth.routes 
          and passport.js, 5. resumes or starts chat with chatbot in Sidebar.jsx which sends a "find_or_create_chat" ws message to 
          backend server, 6. backend server routes that client message, 7. backend router routes it to server message handler, 
          8. server message handler finds or creates the chat via service layer, 9. backend service layer returns selected or created chat 
          object, 10. server message handler broadcasts data to chat members and sends a "chat_ready" message to the frontend, 
          11. PageContext.js frontend listens for a "chat_ready" event from the backend and updates chat and messages, 
          12. user gets navigated to ChatView.jsx, ChatView consumes updated chat and messages, 13. user client sends "create_message" 
          event to backend with data 14. backend server routes this second client message in websocket.js, 15. backend router routes 
          it to server message handler in websocket.handlers, 16. server message handler creates the message via a service layer in
          chatHandlers.js, 17. server message handler broadcasts data to chat members and sends a "new_message" event to the frontend, 
          18. backend service layer returns new message object with the "new_message" event 19. PageContext.js frontend listens for a 
          "new_message" event from the backend and updates messages object, 20. ChatView consumes updated messages 21. messages data is 
          also sent via REST API via useChatbot, 22. Chatbot REST API returns chatbot's response, 23. getChatbotResponsecontroller 
          takes in chatbot's response in chatbot.routes.js, 24. chatbot's response is turned into a message object that gets broadcast in 
          chatbot.controller.js 25. chatbot.controller.js sends "new_message" event to frontend 26. backend service layer returns chatbot's 
          response with the "new_message" event 27. PageContext.js frontend listens for the "new_message" event from the backend and 
          updates messages object, 28. ChatView consumes updated messages 
      - frontend client sends a WebSocket "create_message" message to the server (no REST call made, no controller is hit ) */
      socket.send(
        JSON.stringify({
          type: "create_message",
          chatId: Number(chatid),
          content,
        })
      );

      // K21. CHAT WITH CHATBOT - data is also sent to Chatbot REST API via useChatbot
      if (otherMember?.id === CHATBOT_ID) {
        await sendMessage({
          token,
          chatId: Number(chatid),
          content,
        });
      }
      // clears the input field afterward
      setContent("");
    } catch (err) {
      console.error("Error in handleSend:", err);
    }
  };

  /* E3. DELETES A MESSAGE - AuthContext.js, auth.routes.js, passport.js, WebSocketContext.jsx, websocket.js, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, message.service.js,PageContext.jsx, ChatView.jsx 
  - frontend client sends a WebSocket "delete-message" message to the server (no REST call made, no controller is hit ) */
  const handleDelete = (messageId) => {
    socket.send(JSON.stringify({ type: "delete_message", messageId }));
  };

  // ensures chat and user exist before accessing .id
  if (!chat || !chat.members || !user) return null;

  // while chat is loading, shows a fallback UI
  if (!chat) return <div>Loading chat...</div>;

  return (
    <div className="main-chat">
      <div className="header">
        {/* displays the other participant's username in a header */}
        <strong>Chat with {otherMember?.username || "Unknown"}</strong>
      </div>
      <div className="chatview-messages">
        {/* looks over all the messages in the current chat */}
        {messages.map((msg, i) => {
          // creates a flag for messages sent by logged-in user
          const isOwnMessage = msg.senderId === user.id;
          if (!msg.id) console.log("Missing msg.id at index", i, msg);
          return (
            <div
              key={msg.id || `fallback-${i}`}
              className={`chatview-message ${isOwnMessage ? "own-message" : "other-message"}`}
            >
              <div>
                {/* displays each message with its sender name and its content */}
                <strong>{msg.sender?.username}:</strong> {msg.content}
              </div>
              {msg.senderId === user.id && (
                <button
                  className="delete-button"
                  onClick={() => handleDelete(msg.id)}
                >
                  Delete
                </button>
              )}
            </div>
          );
        })}
        {/* anchor for scrolling 
        empty div rendered after all chat messages in the .chat-messages container
        it is a scroll target at the bottom of the messages list */}
        <div ref={bottomRef} />
      </div>
      <div className="chatview-input">
        {/* renders an input field bound to content state */}
        <textarea
          className="message-textarea"
          value={content}
          // continously sets the input value to the content state
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type your message."
        />
        <div className="chatview-buttons">
          {/* triggers handleSend */}
          <button onClick={handleSend}>Send</button>
          <button
            className="back-button"
            onClick={() => navigate(`/users/${user.id}/chats/`)}
          >
            Back to All Chats
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
