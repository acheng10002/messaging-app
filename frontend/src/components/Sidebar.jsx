// custom hook accesses shared WebSocket connection
import { useWebSocket } from "../contexts/WebSocketContext";
// accesses global page-level state
import { usePageContext } from "../contexts/PageContext";
// accesses current logged-in user info
import { useAuth } from "../hooks/useAuth";

const Sidebar = () => {
  // accesses current authenticated WebSocket connection
  const socket = useWebSocket();
  // accesses logged-in user
  const { user } = useAuth();
  const {
    // accesses list of all chats involving the current user
    chats,
    // accesses chat currently open in the UI and renames it locally to currentChat
    chat: currentChat,
    // accesses array of online users
    onlineUsers,
    // accesses array of offline users
    offlineUsers,
  } = usePageContext();

  // guards against null user
  if (!user) return null;

  /* instantiates a Map() object that stores key-value pairs and maintains the 
  insertion order of those pairs */
  const existingChatMap = new Map();
  // loops over each chat
  chats.forEach((chat) => {
    // finds the other chat participant (not the logged-in user)
    const other = chat.members.find((m) => m.id !== user.id);
    /* in the Map, set the key to the user Id of other.id and the value is chat Id
    of the chat the logged-in user has with them */
    if (other) existingChatMap.set(other.id, chat.id);
  });

  const handleStartOrResumeChat = (recipientId) => {
    if (!socket || !recipientId) return;
    // sends a WebSocket message to either start or resume a chat with recipientId
    socket.send(JSON.stringify({ type: "find_or_create_chat", recipientId }));
  };

  const renderUserList = (users) =>
    users
      // filters out the logged-in user by username
      .filter((username) => username !== user.username)
      // maps over onlineUsers or offlineUsers, username is other user
      .map((username) => {
        const existingChat = chats.find((chat) =>
          /* searches full list of chats for a conversation where 
        chat.members is an array of users in the chat
        .some(...) checks if any member
        has a username matching the one I'm currently rendering
        and is not the logged-in user 
        if a chat with that other user exists, existingChat will be that chat object
        if not, it'll be undefined */
          chat.members.some((m) => m.username === username && m.id !== user.id)
        );
        /* if a matching chat is found, searches the chat's members again to extract the
      full user object of the other user whose username I'm rendering */
        const otherMember = existingChat?.members.find(
          (m) => m.username === username
        );
        // if there is full user object of the other user, assigns their user.id to recipientId
        const recipientId = otherMember?.id || null;
        // button label should be Resume if existingChat exists, Start if it doesn't
        const label = existingChat ? "Resume Chat" : "Start Chat";

        const isCurrentChat =
          currentChat &&
          currentChat.members.some(
            /* checks if the current chat involves the user with username and if the user 
          with username does not have the user id of the logged in user */
            (m) => m.username === username && m.id !== user.id
          );

        return (
          <div key={username} className="sidebar-user">
            {/* each user gets their username displayed */}
            <span>{username}</span>
            <button
              className="sidebar-button"
              // each user gets a button that triggers handleStartOrResumeChat
              onClick={() => handleStartOrResumeChat(recipientId)}
              // disables the button for the currently open chat
              disabled={isCurrentChat}
            >
              {isCurrentChat ? "In Chat" : label}
            </button>
          </div>
        );
      });

  return (
    <div className="sidebar">
      {/* renders online users section with corresponding user list and buttons */}
      <h4>Online Users</h4>
      {renderUserList(onlineUsers)}
      <hr />
      {/* renders offline users section with corresponding user list and buttons */}
      <h4>Offline Users</h4>
      {renderUserList(offlineUsers)}
    </div>
  );
};

export default Sidebar;
