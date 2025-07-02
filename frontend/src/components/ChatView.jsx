/* React hooks 
useRef - holds a mutable value that doesn't trigger re-renders */
import { useEffect, useState, useRef } from "react";
// gives access to active WebSocket instance
import { useWebSocket } from "../contexts/WebSocketContext";
// provides current chat and its messages
import { usePageContext } from "../contexts/PageContext";
// gives access to logged-in user
import { useAuth } from "../hooks/useAuth";
// extract route parameters, specifically chatid
import { useParams } from "react-router-dom";

const ChatView = () => {
  /* initializes...
  active WebSocket connection */
  const socket = useWebSocket();
  // messages and chat, pulled from page-level context
  const { messages, chat } = usePageContext();
  // currently authenticated user
  const { user } = useAuth();
  // chatid extracted from URL
  const { chatid } = useParams();
  // message input content state
  const [content, setContent] = useState("");

  /* ref for the scroll anchor 
  reference to an empty <div> element that will be placed at the bottom of the 
  chat messages list */
  const bottomRef = useRef(null);

  // requests chat history for single chat when chatId changes
  useEffect(() => {
    if (socket && chatid) {
      // sends a get_chat request via WebSocket to fetch messages for this chat
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

  const handleDelete = (messageId) => {
    socket.send(JSON.stringify({ type: "delete_message", messageId }));
  };

  // sends a message
  const handleSend = () => {
    // prevents sending empty or whitespace-only messages
    if (!content.trim()) return;
    /* SENDS A MESSAGE
    1. Client sends a message to the server via WebSocket */
    socket.send(
      JSON.stringify({ type: "new_message", chatId: Number(chatid), content })
    );
    // clears the input field afterward
    setContent("");
  };

  // finds the other user in the chat, besides the logged-in user
  const otherMember = chat?.members?.find((m) => m.id !== user.id);

  // while chat is loading, shows a fallback UI
  if (!chat) return <div>Loading chat...</div>;

  return (
    <div className="main-chat">
      <div className="chat-header">
        {/* displays the other participant's username in a header */}
        <strong>Chat with {otherMember?.username || "Unknown"}</strong>
      </div>
      <div className="chat-messages">
        {/* looks over all the messages in the current chat */}
        {messages.map((msg, i) => {
          if (!msg.id) console.log("Missing msg.id at index", i, msg);
          return (
            <div key={msg.id || `fallback-${i}`} className="chat-message">
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
      <div className="chat-input">
        {/* renders an input field bound to content state */}
        <textarea
          className="message-textarea"
          value={content}
          // continously sets the input value to the content state
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your message."
        />
        <div className="chat-buttons">
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
