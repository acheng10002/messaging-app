/* context provides a token-authenticated socket
standard React hooks 
useRef - hook that gives me a mutable object that persists across renders,
         without causing re-renders
- stores references to DOM elements
- stores stable objects like WebSocket connections
- tracks mutable state outside Render's render cycle
useCallback(fn, deps) - hook that returns a memoized version of a function
                        that only changes if one of its dependencies does
- prevents unnecesssary re-creations of functions on every render */
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
// // custom hook to access logged in user info, including JWT token
import { useAuth } from "../hooks/useAuth";

/* creates a WebSocket context
- allows components to access the socket using useContext */
export const WebSocketContext = createContext(null);

/* React context provider that will wrap part of my app 
- will provide a WebSocket instance to any child component */
export const WebSocketProvider = ({ children }) => {
  // extracts JWT token from my authentication hook
  const { token } = useAuth();

  /* stores the active WebSocket instance as a mutable reference, so it can persist 
  between renders and survive re-renders
  - can be accessed and cleaned up later */
  const socketRef = useRef(null);

  // allows reactive updates and makes the socket consumable via context
  const [socket, setSocket] = useState(null);

  /* keeps useEffect(() => { initializeSocket(); }, [initializeSocket]) stable and
  prevents re-running unless needed 
  - establishes a new WebSocket connection to my server */
  const initializeSocket = useCallback(() => {
    if (!token) return;

    // token passed as query parameter, enabling server-side authentication
    const ws = new WebSocket(
      `ws://localhost:3000?token=${encodeURIComponent(token)}`
    );

    /* handles socket lifecycle 
    logs when socket opens */
    ws.onopen = () => {
      console.log("Websocket connected");
    };

    // logs when socket closes
    ws.onclose = () => {
      console.log("Websocket disconnected");
      // notifies consumers and resets state
      setSocket(null);
    };

    // logs when socket has error
    ws.onerror = (err) => {
      console.log("Websocket error:", err);
    };

    /* stores socket instance in both useRef and useState 
    useRef.current = ws, for internal tracking, cleanup, and stable access
    - manages the socket's lifecycle
    - best for internals/side effects
    - won't cause re-renders when it changes */
    socketRef.current = ws;
    /* reactive exposure via context, will cause re-render
    - exposes the socket reactively
    - best for UI components needing access */
    setSocket(ws);

    // memoizes initializeSocket so it doesn't get recreated unless token changes
  }, [token]);

  useEffect(() => {
    // runs initializeSocket() when the component mounts or when the token changes
    initializeSocket();

    return () => {
      /* cleans up the socket connection when the component unmounts or reinitializes
      or when the token changes, this tears down the old socket safely */
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
        setSocket(null);
      }
    };
  }, [initializeSocket]);

  // makes the WebSocket instance available to all child components via useWebSocket()
  return (
    <WebSocketContext.Provider value={socket}>
      {children}
    </WebSocketContext.Provider>
  );
};

/* allows easy access to the socket from any functional component like
const ws = useWebSocket(); */
export const useWebSocket = () => useContext(WebSocketContext);
