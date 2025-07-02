import { useNavigate } from "react-router-dom";
import { usePageContext } from "../contexts/PageContext";
// custom hook to access logged-in user info
import { useAuth } from "../hooks/useAuth";

const ChatsPanel = ({}) => {
  const navigate = useNavigate();
  // fetches chats from context
  const { chats } = usePageContext();
  // for current user ID
  const { user } = useAuth();

  return (
    <div className="main-chat">
      {/* iterates through all of logged-in user's chats, and for each chat, returns
      the following */}
      {chats.map((chat) => {
        // user other than logged-in user assigned to otherMember
        const otherMember = chat.members.find((m) => m.id !== user.id);
        // messages is already sorted, takes the first
        const lastMessage = chat.messages[0];

        return (
          <div key={chat.id} className="chat-summary">
            <div>
              {/* title of each chat, "Chat with 'Other User'"*/}
              <strong>Chat with {otherMember?.username || "Unknown"}</strong>
            </div>
            {/* if the chat has a most recent message, print the most recent message's
            sender username, and the content of it */}
            {lastMessage ? (
              <div>
                {lastMessage.sender?.username}: {lastMessage.content}
              </div>
            ) : (
              // otherwise, print "no messages yet"
              <div>
                <em>No messages yet</em>
              </div>
            )}
            <div>
              {/* prints chat's last MessageAt value */}
              Last active:{" "}
              {chat.lastMessageAt
                ? new Date(chat.lastMessageAt).toLocaleString()
                : "N/A"}
            </div>
            {/* upon click, directs user to the full chat*/}
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
