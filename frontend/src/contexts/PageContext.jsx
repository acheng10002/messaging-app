/* client-side context listens for server WebSocket messages 
- client-side state for pages involving user chats, online/offline status, and messages */
// React hooks for context, state, and lifecycle
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
// custom hook to access active WebSocket
import { useWebSocket } from "./WebSocketContext";
// custom hook to access logged-in user info
import { useAuth } from "../hooks/useAuth";

// creates a context object
const PageContext = createContext();

// exposes a custom hook so components can consume PageContext values
export const usePageContext = () => useContext(PageContext);

// context provider wraps part of my app that needs to access to chat-related state
export const PageProvider = ({ children }) => {
  // gets the current WebSocket connection
  const socket = useWebSocket();
  // gets the logged-in user
  const { user } = useAuth();
  const navigate = useNavigate();

  // list of all conversations for the logged-in user
  const [chats, setChats] = useState([]);
  // currently selected open conversation
  const [chat, setChat] = useState(null);
  // messages for the currently selected open conversation
  const [messages, setMessages] = useState([]);
  // presence tracking
  const [onlineUsers, setOnlineUsers] = useState([]);
  // absence tracking
  const [offlineUsers, setOfflineUsers] = useState([]);

  // client-side handler of server messages
  const handleSocketMessage = useCallback(
    (event) => {
      // parses the incoming server WebSocket messages to the client
      const data = JSON.parse(event.data);
      /* each case updates local state based on the server message type 
      - each case/message is a response or broadcast from the backend WebSocket server */
      switch (data.type) {
        /* A9. GETS USER CHATS - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatsPanel.jsx 
        - frontend WebSocket listener inserts the read chats into the current chats state
        (client message was "get_user_chats") 
        - ChatsPanel re-renders with chats updated via React context/state since ChatsPanel consumes chats from this context */
        case "chats_list":
          setChats(data.data);
          break;
        /* B9. GETS SELECTED CHAT - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx
        - frontend WebSocket listener inserts the read chat into the current chat state and inserts the read messages into the 
          current messages state
        - ChatView renders with selected chat and its messages updated via React context/state since it consumes chat and messages from this context
        (client message was "get_chat") */
        case "chat_history":
          setChat(data.data);
          setMessages(data.data.messages || []);
          break;
        /* C9. FINDS OR CREATES A CHAT - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, Sidebar.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx
        K11. CHAT WITH CHATBOT - ensureChatbotUser.js, AuthContext.js, auth.routes.js, passport.js, auth.routes.js, Sidebar.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, message.service.js, PageContext.jsx, ChatView.jsx, chatbot.routes.js, chatbot.controller.js, message.service.js, PageContext.jsx, ChatView.jsx 
        - PageContext.js frontend listens for a "chat_ready" event from the backend and updates chat and messages
          (client message was "find_or_create_chat") */
        case "chat_ready":
          if (!data.data) {
            console.warn("chat_ready received with no data");
            break;
          }
          setChat(data.data);
          setMessages(data.data.messages || []);
          // sender is always navigated to ChatView upon starting/resuming a chat
          const isSender =
            // checks if the logged in user is part of the chat members
            data.data.members.some((member) => member.id === user?.id);
          /* &&
            // checks if the logged in user is not the recipient
            user?.id !== data.data.recipientId; */

          // if the user is the sender and they are not already viewing the chat
          if (isSender && chat?.id !== data.data.id) {
            // directs the sender to ChatView page for the chat they selected
            navigate(`/users/${user.id}/chats/${data.data.id}`);
          }
          break;
        /* D9. CREATES A MESSAGE - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, message.service.js, PageContext.jsx, ChatView.jsx
        K19. & K27. CHAT WITH CHATBOT 
        - ChatView re-renders with messages updated via React context/state since it consumes messages from this context 
        (client message was "new_message") */
        case "new_message":
          console.log("New message received:", data.data);
          setMessages((prev) => [...prev, data.data]);
          // directs recipient to ChatView page for the current chat
          if (
            // if the user is the recipient and
            user?.id === data.data.recipientId &&
            // if the user is not already viewing the chat
            chat?.id !== data.data.chatId
          ) {
            // directs the recipient to ChatView page for the chat they selected
            navigate(`/users/${user.id}/chats/${data.data.chatId}`);
          }
          break;
        /* E9. DELETES A MESSAGE - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, message.service.js, PageContext.jsx, ChatView.jsx
        - frontend WebSocket listener updates the current messages state with the soft deletion of the one message
          (client message was "delete_message") */
        case "delete_message":
          setMessages((prev) => prev.filter((msg) => msg.id !== data.data.id));
          break;
        /* F10. GETS ONLINE USERS - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, userHandlers.js, user.service.js, PageContext.jsx, Sidebar.jsx
        - backend service layer reads db via Prisma and returns array of online users 
        - Sidebar re- renders with online users
          (client message was "online_users") */
        case "online_users":
          setOnlineUsers(data.data);
          break;
        /* G10. GETS OFFLINE USERS - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, userHandlers.js, user.service.js, PageContext.jsx, Sidebar.jsx
        - backend service layer reads db via Prisma and returns array of online users 
        - Sidebar re-renders with offline users
        (client message was "online_users") */
        case "offline_users":
          setOfflineUsers(data.data);
          break;
        case "error":
          console.error("Websocket error from server:", data.message);
          break;
        // catch-all
        default:
          console.warn("Unhandled WS message type:", data.type);
      }
    },
    [navigate, user?.id]
  );

  // initializes real-time communication after login; sends client init message and server will begin real-time data push
  useEffect(() => {
    /* only runs after socket/user are available; when token is validated and WebSocket is created
    - user is set when the authenticated user context is hydrated in AuthContext.jsx
    - socket established the WebSocket instance is created in websocket.js */
    if (!socket || !user) return;

    /* message send operation: client-side logic for dispatching WebSocket messages after connection is established 
    - focused on React and app state integration */
    const sendInitialMessages = () => {
      /* if the socket is OPEN, client receives onopen, then I send initialization messages immediately 
      - socket.send() - sends a message to the server */
      if (socket.readyState === WebSocket.OPEN) {
        /* A3. GETS USER CHATS - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatsPanel.jsx
        - frontend client sends a Websocket "get_user_chats" message to the server (no REST call made, no controller is hit ) */
        socket.send(JSON.stringify({ type: "get_user_chats" }));
        /* F4. GETS ONLINE USERS - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, userHandlers.js, user.service.js,PageContext.jsx
        - frontend client sends a Websocket "online_users" message to the server (no REST call made, no controller is hit ) */
        socket.send(JSON.stringify({ type: "online_users" }));
        /* G4. GETS OFFLINE USERS - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, userHandlers.js, user.service.js, PageContext.jsx
        - frontend client sends a Websocket "offline_users" message to the server (no REST call made, no controller is hit ) */
        socket.send(JSON.stringify({ type: "offline_users" }));
      } else {
        /* waits for the WebSocket connection to be ready
        - if the socket is not OPEN yet, adds an event listener to wait for the connection to open, and once it is 
          open, sends the same three messages/ subscribes WebSocket messages */
        socket.addEventListener(
          "open",
          () => {
            // requests initial data, the logged-in user's chats, online users, and offline users right after connection
            socket.send(JSON.stringify({ type: "get_user_chats" }));
            socket.send(JSON.stringify({ type: "online_users" }));
            socket.send(JSON.stringify({ type: "offline_users" }));
          },
          { once: true }
        );
      }
    };

    /* Y9. WEBSOCKET FLOW - WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js...
    - dispaches client WebSocket messages to the server */
    sendInitialMessages();
    // message receive handler: receives a message from the server
    socket.addEventListener("message", handleSocketMessage);

    return () => {
      // cleans up the event listener
      socket.removeEventListener("message", handleSocketMessage);
    };
    // cleanup on unmount or dependency change
  }, [socket, user, handleSocketMessage]);

  return (
    <PageContext.Provider
      // exposes the state and setters to any child component that calls usePageContext()
      value={{
        chats,
        chat,
        messages,
        onlineUsers,
        offlineUsers,
        setChat,
        setMessages,
      }}
    >
      {children}
    </PageContext.Provider>
  );
};
