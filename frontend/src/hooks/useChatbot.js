export const useChatbot = () => {
  /* K22. CHAT WITH CHATBOT - ensureChatbotUser.js, AuthContext.js, auth.routes.js, passport.js, auth.routes.js, Sidebar.jsx, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx, useChatbot.js, chatbot.routes, chatbot.controller.js, websocket.js, websocket.handlers.js, chatHandlers.js, chat.service.js, PageContext.jsx, ChatView.jsx 
  - data sent to Chatbot REST API and returns chatbot's response */
  const sendMessage = async ({ token, chatId, content }) => {
    // url for the POST request using env variable
    const url = `${import.meta.env.VITE_API_BASE_URL}/chatbot/message`;
    const headers = {
      // req body format
      "Content-Type": "application/json",
      // required for backend JWT auth
      Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
    };

    // for req body converts the function args into a JSON string
    const body = JSON.stringify({ chatId, content });

    try {
      // makes a POST re to the chatbot endpoint and waits for the res
      const res = await fetch(url, {
        method: "POST",
        headers,
        body,
      });
      // if response status is not OK
      if (!res.ok) {
        // extracts res body as text for error logging
        const text = await res.text();
        console.error(
          `Chatbot message failed:, ${res.status} ${res.statusText}`,
          text
        );
        // throws a new error with HTTP status
        throw new Error(`Failed to send chatbot message (status ${res.status}`);
      }
      // if req successful, parse the response JSON and return it to the caller
      return await res.json();
    } catch (err) {
      // if any error during fetch or JSON parsing, log it and re-throw error
      console.error("Chatbot fetch error:", err);
      throw err;
    }
  };
  return { sendMessage };
};
