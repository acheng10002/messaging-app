// custom hook accesses shared WebSocket connection
import { useWebSocket } from "../../contexts/WebSocketContext";
// accesses global page-level state
import { usePageContext } from "../../contexts/PageContext";
// accesses current logged-in user info
import { useAuth } from "../../hooks/useAuth";
import { useParams } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = () => {
  // accesses current authenticated WebSocket connection
  const socket = useWebSocket();
  // will be undefined on /chats, defined on /chats/:chatid
  const { chatid } = useParams();
  // accesses logged-in user
  const { user } = useAuth();
  const {
    // accesses list of all chats involving the current user
    chats,
    // accesses chat currently open in the UI and renames it locally to currentChat
    chat: currentChat,
    /* F11. GETS ONLINE USERS - AuthContext.js, auth.routes.js, passport.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, userHandlers.js, user.service.js, PageContext.jsx, Sidebar.jsx
    - UI update, Sidebar sees onlineUsers change
    accesses array of online users */
    onlineUsers,
    /* G11. GETS OFFLINE USERS - AuthContext.js, auth.routes.js, passport.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, userHandlers.js, user.service.js, PageContext.jsx, Sidebar.jsx
    - UI update, Sidebar sees offlineUsers change
    accesses array of offline users */
    offlineUsers,
  } = usePageContext();

  // guards against null user
  if (!user) return null;

  /* precomputes a map: { otherUserId -> chatId} 
  - instantiates a Map() object that stores key-value pairs and maintains the insertion 
  order of those pairs */
  const existingChatMap = new Map();
  // loops over each chat
  chats.forEach((chat) => {
    // finds the other chat participant (not the logged-in user)
    const other = chat.members.find((m) => m.id !== user.id);
    /* in the Map, set the key to the user Id of other.id and the value is chat Id
    of the chat the logged-in user has with them */
    if (other) existingChatMap.set(other.id, chat.id);
  });

  /* C3. FINDS OR CREATES A CHAT - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, Sidebar.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx
  - frontend client sends a Websocket "find_or_create_chat" message to the server (no REST call made, no controller is hit ) 
  - after client initiates an HTTP GET request and then server upgrades the request to WebSocket,
    user clicks button next to user to start or resume a chat 
  - client's "find_or_create_chat" message to server 
  K5. CHAT WITH CHATBOT - ensureChatbotUser.js, AuthContext.js, auth.routes.js, passport.js, auth.routes.js, Sidebar.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, message.service.js, PageContext.jsx, ChatView.jsx, chatbot.routes.js, chatbot.controller.js, message.service.js, PageContext.jsx, ChatView.jsx
  - resumes or starts chat with chatbot in Sidebar.jsx which sends a "find_or_create_chat" ws message to backend server
  - chatbot is always an online user */
  const handleStartOrResumeChat = (recipientId) => {
    if (!socket || !recipientId) return;
    // sends a WebSocket message to either start or resume a chat with recipientId
    socket.send(JSON.stringify({ type: "find_or_create_chat", recipientId }));
  };

  const renderUserList = (users) =>
    users
      // filters out the logged-in user by username
      .filter((u) => u.username !== user.username)
      // maps over onlineUsers or offlineUsers, u is other user
      .map((u) => {
        /* searches full list of chats for a conversation where an existing chat id exists 
        for a chat between the the other user with username and the logged in user */
        const existingChatId = existingChatMap.get(u.id);
        // button label should be Resume if existingChat exists, Start if it doesn't
        const label = existingChatId ? "Resume Chat" : "Start Chat";

        // In Chat appears only if
        const isCurrentChat =
          // logged in user is on a ChatView route
          chatid &&
          // currentChat exists
          currentChat &&
          currentChat.members.some(
            /* the current chat involves the user with username I'm rendering and that user 
            isn't the logged in user */
            (m) => m.id === u.id && m.id != user.id
          );

        return (
          <div key={u.id} className="user">
            {/* each user gets their username displayed */}
            <span>{u.username}</span>
            <button
              // each user gets a button that triggers handleStartOrResumeChat
              onClick={() => handleStartOrResumeChat(u.id)}
              // disables the button for the currently open chat on ChatView page
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
