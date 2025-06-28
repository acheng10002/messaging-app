/* displays single chat */
useEffect(() => {
  if (socket && chatId) {
    socket.send(JSON.stringify({ type: "get_chat", chatId }));
  }
}, [socket, chatId]);

/* sends a message */
const handleSend = () => {
  socket.send(JSON.stringify({ type: "chat", chatId, content }));
};
