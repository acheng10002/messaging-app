/* context provides logged-in user, token, login, out, and register
- holds my app's global authentication state (user, token, login/logout, etc. )
createContext - mechanism for passing data through component tree without prop drilling
useEffect - triggers effects, like fetching user data, on dependency changes
useState - manages internal state */
import { createContext, useEffect, useState } from "react";

/* creates a context object to share auth state across components 
- AuthContext is used by components via useAuth to access auth 
  data and methods */
export const AuthContext = createContext();

/* defines a context provider component, and children are any JSX nested inside AuthProvider 
- provider is "the faucet that distributes the state to components" */
export function AuthProvider({ children }) {
  /* user will eventually hold logged-in user data, setUser updates 
  logged-in user */
  const [user, setUser] = useState(null);
  /* for page reload, token gets extracted from localStorage by this lazy initializer 
  function to avoid unnecessary reads on re-renders, runs only on first render/mount
  - passes .getItem function that returns the value to useState() to delay execution of 
    an expensive operation until the component's initial render 
  - subsequent renders uses the persisted token state value, it's held in memory by React 
    and can be accessed throughout the component tree 
  - the user stays logged in across page refreshes or browser sessions
  - server won't store any session state; this scales well 
  - all protected routes (REST requests) and the WebSocket upgrade flow expect this token */
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  /* A. GETS USER CHATS - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatsPanel.jsx
  B. GETS SELECTED CHAT - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatsView.jsx 
  C. FINDS OR CREATES A CHAT - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, Sidebar.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx   
  D. CREATES A MESSAGE - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, message.service.js, PageContext.jsx, ChatView.jsx
  E. DELETES A MESSAGE - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, message.service.js,PageContext.jsx, ChatView.jsx 
  F. GETS ONLINE USERS - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, userHandlers.js, user.service.js, PageContext.jsx, Sidebar.jsx
  G. GETS OFFLINE USERS -  AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, userHandlers.js, user.service.js, PageContext.jsx, Sidebar.jsx 
  K. CHAT WITH CHATBOT - ensureChatbotUser.js, AuthContext.js, auth.routes.js, passport.js, auth.routes.js, Sidebar.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, message.service.js, PageContext.jsx, ChatView.jsx, chatbot.routes.js, chatbot.controller.js, message.service.js, PageContext.jsx, ChatView.jsx
  K2. retrieves token from authenticated user context
      - token is the same JWT token used for authenticating all other API calls and WebSocket connections
  A1, B1, C1, D1, E1, F1, G1, K1
  - HTTP path (AuthContext) that rehydrates the user via /auth/me; uses Passport's JwtStrategy
  - it's one-way, async, and stateless
  - this effect runs immediately after initial render and when token changes 
  - without this, I'd lose the user context on any reload since useState(null) is the default */
  useEffect(() => {
    // if token exists but user is null, fetches the user's profile
    if (token && !user) {
      /* Z. REST API REQUEST FLOW - AuthContext.jsx, auth.routes.js, passport.js, auth.routes.js, AuthContext.jsx 
      Z1. client attaches the token in the Authorization header
          - this happens on the client BEFORE any request is even made
      Z2. client sends request and hits the protected route, /auth/me
          - client's request to /auth/me validates the token from state and retrieve user data; 
            token authenticates REST requests and authorizes the user on the backend */
      fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/me`, {
        headers: {
          // Bearer token in Authorization header
          Authorization: `Bearer ${token}`,
        },
      })
        // res is raw HTTP response object, res.json parses it into JSON
        .then((res) => res.json())
        /* Z6. if token is valid, data is that parsed JSON, client receives that response data 
               (i.e. the user object) and sets the user state to it */
        .then((data) => setUser(data))
        .catch(() => {
          // token might be invalid or expired
          localStorage.removeItem("token");
          // clears token from state and storage
          setToken(null);
        });
    }
  }, [token]);

  /* H2. REGISTERS USER - UserForm.jsx, AuthContext.jsx, users.routes.js, userValidation.js, validate.js, users.controller.js, user.service.js, UserForm.jsx 
  - it sends a POST request to /users/register via fetch
    header is "Content-Type": "application/x-www-form-urlencoded"
    payload is JSON body with form fields 
  - register is available to consumers of this context */
  const register = async ({
    name,
    email,
    username,
    password,
    passwordConfirmation,
  }) => {
    // server-side registration, registration request sent the backend with appropriate headers and body
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/users/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          username,
          password,
          passwordConfirmation,
        }),
      }
    );

    // throws error if no server response
    if (!res.ok) throw new Error(await res.text());

    return await res.json();
  };

  const setTokenAndUser = (token, user) => {
    // stores the token on the browser client
    localStorage.setItem("token", token);
    // updates token and user states
    setToken(token);
    setUser(user);
  };

  /* I2. LOGS IN USER - UserForm.jsx, AuthContext.jsx, auth.routes.js, passport.js, auth.routes.js, auth.controller.js, auth.service.js, UserForm.jsx
  - fetch('/auth/login'), parses the response, sets the token and user via setToken and setUser 
  - login is available to consumers of this context */
  const login = async (username, password) => {
    // server-side login; sends credentials to my backend /auth/login
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        // says data is sent in a key-value format (URL encoded)
        "Content-Type": "application/x-www-form-urlencoded",
      },
      /* converts { username, password } object into URL-encoded form data in the request body 
      - Passport's local strategy expects this format */
      body: new URLSearchParams({ username, password }),
    });

    // returns false if login failed
    if (!res.ok) throw new Error(await res.text());

    const data = await res.json();

    /* on success, login stores the returned token in localStorage, which AuthContext then stores
    - this is client-side instead of in a server-managed session as with express-session */
    // updates token and user states
    setTokenAndUser(data.token, data.user);
    // returns true if login succeeded
    return {
      user: data.user,
      token: data.token,
    };
  };

  /* J3. LOGS OUT USER - Header.jsx, useHandleLogout.js, AuthContext.jsx, auth.routes.js, passport.js, auth.routes.js, auth.controller.js, auth.service.js, UserForm.jsx  
  - logout is available to consumers of this context */
  const logout = async () => {
    // triggers server-side logout, updates isOnline: false
    if (token) {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/auth/logout`,
          {
            method: "POST",
            // backend receives the token and can mark the user offline and broadcast presence changes
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!res.ok) {
          if (res.status === 401) {
            if (!import.meta.env.DEV) {
              console.warn(
                "Token was already expired or invalidated(401). Proceeding with client logout."
              );
            }
          } else {
            console.error(`Logout failed with status ${res.status}`);
          }
        }
      } catch (err) {
        if (!import.meta.env.DEV) {
          console.error("Unexpected logout error:", err);
        }
      }
    }
    /* clears auth state and removes token from localStorage on client-side 
    - the client side remains responsive and stateless */
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    /* exposes user, token, login(), logout(), setTokenAndUser() through context 
    to all descendant components 
    - wraps children components in the provider */
    <AuthContext.Provider value={{ user, token, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
