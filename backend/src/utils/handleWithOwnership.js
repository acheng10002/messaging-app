/* utility that centralizes the secure resource action pattern
- loads a resource
- checks whether the current user owns it
performas a secure action (edit, delete, etc.) */
const { authorizeOwnership } = require("./authorization");

async function handleWithOwnership({ fetchResource, userId, action }) {
  /* fetchResource - callback that fetches the resource that I want to act 
  on e.g. a db query */
  const resource = await fetchResource();
  /* userId - id of the currently authenticated user
  checks if current user is allowed to perform this action */
  authorizeOwnership(resource, userId);
  /* action - callback for the action to perform if ownership is confirmed 
  and returns the result of the action */
  return action(resource);
}

module.exports = { handleWithOwnership };
