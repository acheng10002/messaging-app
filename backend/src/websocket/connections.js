/* Map() object of sets of WebSocket connections 
maps a logged-in user's id to a Set of WebSocket instances
- Map enables efficient lookup by userId */
const activeConnections = new Map();

module.exports = { activeConnections };
