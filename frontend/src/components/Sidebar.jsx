/* */
const handleStartResume = () => {
  socket.send(JSON.stringify({ type: "find_or_create_chat", recipientId }));
};
