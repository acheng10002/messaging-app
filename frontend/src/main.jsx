// entry point for my app's JS code
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./App.jsx";
// basic routing context for simple, declarative routing config
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import { PageProvider } from "./contexts/PageContext";

// React injects the UI into the root div in index.html
createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* wraps the app in a routing layer and context providers */}
    <BrowserRouter>
      <AuthProvider>
        <WebSocketProvider>
          <PageProvider>
            {/* initializes/mounts my top-level React component into, <App /> the DOM */}
            <App />
          </PageProvider>
        </WebSocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
