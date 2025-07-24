/* entry point for my React app's JS code that Vite bundles first
- in dev mode, Vite will serve my app from memory, a local dev server, localhost:5173
- in prod mode, Vite will output the built prod frontend to a dist/ folder
- hot module replacement - feature in Vite, Webpack, etc. that allows modules to be 
                           updated in the browser at runtime without requiring a full 
                           page reload
-- When a file is edited, like a component or CSS< Vite sends the updated module to 
   the browser via WebSocket, and the browser patches the running app in-place
- this file mounts my root component, App.jsx, and wraps it with providers */
import { StrictMode } from "react";
// allows React to inject UI into index.html
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
// global styles
import "./styles/index.css";
// basic routing context for simple, declarative routing config
import { BrowserRouter } from "react-router-dom";
// 3 providers supply contexts to the component tree
// context for authenticated user details
import { AuthProvider } from "./contexts/AuthContext";
// context for a single authenticated real-time WebSocket connection
import { WebSocketProvider } from "./contexts/WebSocketContext";
import { PageProvider } from "./contexts/PageContext";

// React injects the UI into the root div in index.html
createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* wraps the app in a routing layer and context providers */}
    <BrowserRouter>
      {/* AuthProvider defines where and how the AuthContext data 
      is shared */}
      <AuthProvider>
        {/* WebSocketProvider defines where and how the WebSocketContext 
        data is shared */}
        <WebSocketProvider>
          {/* PageProvider defines where and how the PageContext 
        data is shared */}
          <PageProvider>
            {/* initializes/mounts my top-level React component, <App />, 
            into the DOM */}
            <App />
          </PageProvider>
        </WebSocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
