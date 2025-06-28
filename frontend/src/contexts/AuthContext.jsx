/* context provides user and token
holds my app's global authentication state (user, token, login/logout, etc. )
useEffect - triggers effects, like fetching user data, on dependency changes
useState - manages internal state */
import { createContext, useEffect, useState } from "react";

/* creates a context object to share auth state across components 
- AuthContext is used by components via useContext(AuthContext) to access auth 
  data and methods */
export const AuthContext = createContext();

/* defines a context provider component, and children are any JSX nested inside AuthProvider 
provider is "the faucet that distributes the state to components" */
export function AuthProvider({ children }) {
  // user will eventually hold user data
  const [user, setUser] = useState(null);
  /* initializes token from localStorage (persisted login state) 
  - uses a lazy initializer function to avoid unnecessary reads on re-renders
  -- passes .getItem function that returns the value to useState() to delay execution of an 
     expensive operation until the component's initial render 
     function here will only run once, and subsequent renders uses the stored state value */
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  /* AuthContext sends JWTs via an Authorization header with the Bearer schema 
  this effect runs when token changes
  - fetches /auth/me to rehydrate user 
  - without this, I'd lose the user context on any reload since useState(null) is 
    the default 
  - that way, if a valid token exists, the app doesn't require the user to log in again */
  useEffect(() => {
    // if token exists but user is null, fetches the user's profile
    if (token && !user) {
      // sends a request to /auth/me to validate the token and retrieve user data
      fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        // res is raw HTTP response object, res.json parses it into JSON
        .then((res) => res.json())
        // data is that parsed JSON, and user gets set to it
        .then((data) => setUser(data))
        .catch(() => {
          // token might be invalid or expired
          localStorage.removeItem("token");
          // clears token from state and storage
          setToken(null);
        });
    }
  }, [token]);

  // helper that updates both the token and the user state
  const setTokenAndUser = (token, user) => {
    /* stores the JWT token in localStorage, client-side instead of in a server-managed 
    session as with express-session so the user stays logged in across page refreshes 
    or browser sessions 
    - each request includes the token, typically in the Authorization header
    - server won't store any session state, scales well */
    localStorage.setItem("token", token);
    // updates state for the token, lets my app immediately respond to login state changes
    setToken(token);
    /* updates state for the user object, allows components across my app to access
    authenticated user's details */
    setUser(user);
  };

  /* login is available to consumers of this context 
  AuthContext stores the JWT in localStorage on the client */
  const login = async (username, password) => {
    // sends credentials to my backend /auth/login
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        // sends data in a key value format (URL encoded)
        "Content-Type": "application/x-www-form-urlencoded",
      },
      /* converts { username, password } object into URL-encoded form data 
      - Passport's local strategy expects this format */
      body: new URLSearchParams({ username, password }),
    });

    // returns false if login failed
    if (!res.ok) return false;

    // awaits the response and then parses it into JSON
    const data = await res.json();
    // on success, stores the returned token in localStorage
    localStorage.setItem("token", data.token);
    // updates token and user state
    setToken(data.token);
    setUser(data.user || { id: data.id });
    // returns true if login succeeded
    return true;
  };

  const logout = () => {
    // clears auth state and removes token from storage
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    /* exposes user, token, login(), and logout() through context to all descendant 
    components 
    - wraps children components in the provider */
    <AuthContext.Provider
      value={{ user, token, login, logout, setTokenAndUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
