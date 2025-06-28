import { useEffect, useState } from "react";
import { useWebSocket } from "../contexts/WebSocketContext";
import { usePageContext } from "../contexts/PageContext";
import { useAuth } from "../hooks/useAuth";
import { useParams } from "react-router-dom";

const ChatView = () => {
  const socket = useWebSocket();
  const { messages, chat } = usePageContext();
  const { user } = useAuth();
  const { chatid } = useParams();
  const [content, setContent] = useState("");

  /* requests chat history for single chat when chatId changes */
  useEffect(() => {
    if (socket && chatid) {
      socket.send(JSON.stringify({ type: "get_chat", chatId: Number(chatid) }));
    }
  }, [socket, chatid]);

  /* sends a message */
  const handleSend = () => {
    if (!content.trim()) return;
    /* SENDS A MESSAGE
    1. Client sends a message to the server via WebSocket */
    socket.send(
      JSON.stringify({ type: "chat", chatId: Number(chatid), content })
    );
    setContent("");
  };

  const otherMember = chat?.members?.find((m) => m.id !== user.id);

  if (!chat) return <div>Loading chat...</div>;

  return (
    <div className="main-chat">
      <div className="chat-header">
        <strong>Chat with {otherMember?.username || "Unknown"}</strong>
      </div>
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className="chat-message">
            <strong>{msg.sender?.username}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your message"
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default ChatView;
