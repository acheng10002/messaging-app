// throws an error if the user isn't the owner of the resource
const ApiError = require("./ApiError");

function authorizeOwnership(resource, userId) {
  // return status if specific resource not found
  if (!resource) {
    throw new ApiError(404, "Resource not found");
  }
  // return status if specific resource not owned by current user
  if (resource.authorId !== userId) {
    throw new ApiError(403, "Not authorized to perform this action");
  }
}

module.exports = {
  authorizeOwnership,
};
