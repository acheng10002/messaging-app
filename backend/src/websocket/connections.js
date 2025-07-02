/* set of WebSocket connections 
maps a logged-in user's id to a Set of WebSocket instances
- Map enables efficient lookup by userId
- Set is the multiple active WebSocket connections each user has, Set prevents duplicates */
const activeConnections = new Map();

module.exports = { activeConnections };
