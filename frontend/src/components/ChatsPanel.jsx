import { useNavigate } from "react-router-dom";
import { usePageContext } from "../contexts/PageContext";
// custom hook to access logged in user info
import { useAuth } from "../hooks/useAuth";

const ChatsPanel = ({}) => {
  const navigate = useNavigate();
  // fetches from context
  const { chats } = usePageContext();
  // for current user ID
  const { user } = useAuth();

  return (
    <div className="main-chat">
      {chats.map((chat) => {
        const otherMember = chat.members.find((m) => m.id !== user.id);
        // messages is already sorted, takes the first
        const lastMessage = chat.messages[0];

        return (
          <div key={chat.id} className="chat-summary">
            <div>
              <strong>Chat with {otherMember?.username || "Unknown"}</strong>
            </div>
            {lastMessage ? (
              <div>
                {lastMessage.sender?.username}: {lastMessage.content}
              </div>
            ) : (
              <div>
                <em>No messages yet</em>
              </div>
            )}
            <div>
              Last active:{" "}
              {chat.lastMessageAt
                ? new Date(chat.lastMessageAt).toLocaleString()
                : "N/A"}
            </div>
            <button
              onClick={() => navigate(`/users/${user.id}/chats/${chat.id}`)}
            >
              View Full Chat
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ChatsPanel;
