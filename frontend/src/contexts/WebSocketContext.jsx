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
// custom hook to access logged-in user info, including JWT token
import { useAuth } from "../hooks/useAuth";

/* creates a WebSocket context
- allows components to access the socket using useWebSocket */
export const WebSocketContext = createContext(null);

/* React context provider that will wrap part of my App 
- will provide a WebSocket instance to any child component */
export const WebSocketProvider = ({ children }) => {
  /* A. GETS USER CHATS - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatsPanel.jsx
  B. GETS SELECTED CHAT - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatsView.jsx 
  C. FINDS OR CREATES A CHAT - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, Sidebar.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx   
  D. CREATES A MESSAGE - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, message.service.js, PageContext.jsx, ChatView.jsx
  E. DELETES A MESSAGE - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, message.service.js,PageContext.jsx, ChatView.jsx 
  F. GETS ONLINE USERS -  AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, userHandlers.js, user.service.js, PageContext.jsx, Sidebar.jsx
  G. GETS OFFLINE USERS -  AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, userHandlers.js, user.service.js, PageContext.jsx, Sidebar.jsx 
  A1, B1, C1, D1, E1, F1, G1 
  - WebSocket connects, validates JWT, and assigns ws.user
    (after the connection, frontend renders once user exists and sends a client message,
    server then receives the client message, uses ws.user.id, and returns the data)
  - WS path uses jwt.verify() to authenticate and gates the upgrade
  - WebSocket will connect, validate JWT, and assign ws.user
  - token from React state managed in AuthContext (token in AuthContext was initially hydrated 
    from localStorage) */
  const { token } = useAuth();

  /* stores the active WebSocket instance as a mutable reference, so it can persist 
  between renders and survive re-renders
  - can be accessed and cleaned up later 
  - best for access inside callbacks/side effects
  - manages the socket's lifecycle */
  const socketRef = useRef(null);

  /* allows reactive updates and makes the socket consumable via context 
  socket - bidirectional connection between the browser and the server
           <IP address>:<port number> on both the client and the server
  -- allows client to send messages to the server at any time
  -- allows server to push data to the client without waiting for a request
  - allows any UI component using useWebSocket() to re-render when the socket
    is created, replaced, or nullified */
  const [socket, setSocket] = useState(null);

  /* keeps useEffect(() => { initializeSocket(); }, [initializeSocket]) stable and
  prevents re-running unless needed 
  - establishes a new WebSocket connection to my server */
  const initializeSocket = useCallback(() => {
    if (!token) return;

    /* Y. how WebSocket connection gets made, from frontend to backend back to frontend 
    Y. WEBSOCKET FLOW - WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js...
    - creates a new authenticated WebSocket connection to my backend server using JWT 
      (begins a TCP handshake and HTTP upgrade request to the server)
    - A1, B1, C1, D1, E1, F1, G1 client calls and initiates an HTTP GET request to the url
    Y1. client builds WebSocket connection URL with token query parameter
    Y2. client initiates upgrade request via new WebSocket(url)
        - client says "Hey server, I'd like to upgrade to a WebSocket connection- here's my token. 
          If you accept, let's switch from HTTP to a persistent WebSocket"
        - client sends GET request with Connection: Upgrade and Upgrade: websocket headers over the TCP socket
    Y3. client starts TCP Handshake between the browser client and my HTTP server 
        - establishes a raw, low-level TCP connection using a three-way handshake
    - 1.-4. this global React context provides single authenticated WebSocket connection
      1. initializes connection using the JWT token 
    -- each logged-in user initializes their own WebSocket instance in their browser 
    -- the backend maintains a Set of WebSocket connections per user, allowing multiple tabs or devices for 
       the same user and distinct connections for each user */
    const ws = new WebSocket(
      `ws://localhost:3000?token=${encodeURIComponent(token)}`
    );

    /* client-side WebSocket events - lifecycle hooks available in the browser's WebSocket API
    - same lifecycle events on the server end
    - listens for connection, disconnects, and errors 
    - event fires when connection is successfully opened 
    - analogous to server.on("upgrade"), then wss.con("connection") */
    ws.onopen = () => {
      console.log("Websocket connected");
    };

    /* fires when the socket is closed (by client or server) 
    - analogous to ws.on("close") */
    ws.onclose = () => {
      console.log("Websocket disconnected");
      // notifies consumers and resets state
      setSocket(null);
    };

    /* fires on any network/protocol socket has error 
    analogous to ws.on("error")*/
    ws.onerror = (err) => {
      console.log("Websocket error:", err);
    };

    /* 2. stores socket instance in both useRef and useState 
    useRef.current = ws, for internal logic, cleanup, and stable access
    - non-reactive, won't cause re-renders when it changes 
    - React won't update closed connections automatically */
    socketRef.current = ws;
    /* useState reactive exposure via context, for components that need to re-render
    - exposes the socket reactively
    - resends init messages only after connection is open 
    - React needs state updates to notify components of change */
    setSocket(ws);

    // memoizes initializeSocket so it doesn't get recreated unless token changes
  }, [token]);

  useEffect(() => {
    // runs initializeSocket() when the component mounts or when the token changes
    initializeSocket();

    return () => {
      /* 3. cleans up the socket connection when the component unmounts or reinitializes,
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

/* 4. allows easy access to the socket from any functional component like
const ws = useWebSocket(); 
- all components needing to send or receive WebSocket messages will share this same 
  socket instance 
- consumers like Sidebar and ChatView call socket = useWebSocket() to access the 
  active connection */
export const useWebSocket = () => useContext(WebSocketContext);
