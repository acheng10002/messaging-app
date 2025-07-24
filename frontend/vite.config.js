/* Vite config file tells Vite how to build and server my React app/ my frontend server 
- frontend server, Vite on localhost:5173 serves HTTP
-- delivers my React app
-- responds to HTTP request during development
- initiates WebSocket connections to ws://localhost:3000 but does not handle them */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
});
