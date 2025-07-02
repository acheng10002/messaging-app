/* client-side context listens for server WebSocket messages 
it is the client-side state for pages involving user chats, online/offline status,
and messages 
React hooks for context/state/lifecycle */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
// custom hook to acess active WebSocket
import { useWebSocket } from "./WebSocketContext";
// custom hook to access logged-in user info
import { useAuth } from "../hooks/useAuth";

// creates a context object
const PageContext = createContext();

// exposes a custom hook so components can consume PageContext values
export const usePageContext = () => useContext(PageContext);

/* context provider wraps part of my app that needs to access to 
chat-related state */
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

  const handleSocketMessage = useCallback(
    (event) => {
      // parses the incoming client WebSocket message
      const data = JSON.parse(event.data);
      switch (data.type) {
        /* each case updates local state based on the server message type 
      (client message was "get_user_chats") */
        case "chats_list":
          setChats(data.data);
          break;
        // (client message was "get_chat")
        case "chat_history":
          setChat(data.data);
          setMessages(data.data.messages || []);
          break;
        case "delete_message":
          setMessages((prev) => prev.filter((msg) => msg.id !== data.data.id));
          break;
        // (client message was "chat")
        /* SENDS A MESSAGE
      3. Client receives updated messages state with new message appended 
         ChatView re-renders with updated messages because ChatView
         consumes messages from this context */
        case "new_message":
          setMessages((prev) => [...prev, data.data]);
          break;
        // (client message was "find_or_create_chat")
        case "chat_ready":
          setChat(data.data);
          if (!existingChats.some((c) => c.id === data.chat.id)) {
            setChats((prev) => [data.chat, ...prev]);
          }
          setMessages(data.data.messages || []);
          navigate(`/users/${user.id}/chats/${data.data.id}`);
          break;
        // (client message was "online_users")
        case "online_users":
          setOnlineUsers(data.data);
          break;
        // (client message was "offline_users")
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

  useEffect(() => {
    // only runs after socket/user are available
    if (!socket || !user) return;

    const sendInitialMessages = () => {
      // ensures the socket is OPEN
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "get_user_chats" }));
        socket.send(JSON.stringify({ type: "online_users" }));
        socket.send(JSON.stringify({ type: "offline_users" }));
      } else {
        // subscribes WebSocket messages
        socket.addEventListener(
          "open",
          () => {
            /* requests initial data, the logged-in user's chats, online users, 
                and offline users right after connection */
            socket.send(JSON.stringify({ type: "get_user_chats" }));
            socket.send(JSON.stringify({ type: "online_users" }));
            socket.send(JSON.stringify({ type: "offline_users" }));
          },
          { once: true }
        );
      }
    };

    sendInitialMessages();
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
