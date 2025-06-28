/* context listens for WebSocket messages */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useWebSocket } from "./WebSocketContext";
// custom hook to access logged in user info
import { useAuth } from "../hooks/useAuth";

const PageContext = createContext();
export const usePageContext = () => useContext(PageContext);

export const PageProvider = ({ children }) => {
  const socket = useWebSocket();
  const { user } = useAuth();

  const [chats, setChats] = useState([]);
  // current open chat
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [offlineUsers, setOfflineUsers] = useState([]);

  const handleSocketMessage = useCallback((event) => {
    const data = JSON.parse(event.data);
    switch (data.type) {
      case "chats:list":
        setChats(data.data);
        break;
      case "chat_history":
        setChat(data.data);
        setMessages(data.data.messages || []);
        break;
      /* SENDS A MESSAGE
      3. Client receives updated messages state with new message appended 
         ChatView re-renders with updated messages because ChatView
         consumes messages from this context */
      case "chat":
        setMessages((prev) => [...prev, data.data]);
        break;
      case "chat:ready":
        setChat(data.data);
        setMessages(data.data.messages || []);
        break;
      case "online_users":
        setOnlineUsers(data.data);
        break;
      case "offline_users":
        setOfflineUsers(data.data);
        break;
      default:
        console.warn("Unhandled WS message type:", data.type);
    }
  }, []);

  useEffect(() => {
    if (!socket || !user) return;

    socket.addEventListener("message", handleSocketMessage);
    socket.send(JSON.stringify({ type: "get_user_chats" }));
    socket.send(JSON.stringify({ type: "online_users" }));
    socket.send(JSON.stringify({ type: "offline_users" }));

    return () => {
      socket.removeEventListener("message", handleSocketMessage);
    };
  }, [socket, user, handleSocketMessage]);

  return (
    <PageContext.Provider
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
