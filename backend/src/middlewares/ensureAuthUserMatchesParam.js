/* enforces route level authorization by verifying that the authenticated user, 
req.user.id, matches the userid found in the route parameters 
custom error */
const ApiError = require("../utils/ApiError");

function ensureAuthUserMatchesParam(paramKey) {
  return (req, res, next) => {
    // takes the paramKey from the route parameters
    const routeUserId = Number(req.params[paramKey]);
    // takes id of any user attached to request
    const authenticatedUserId = req.user?.id;

    // throws error if they are not the same
    if (routeUserId != authenticatedUserId) {
      return next(new ApiError(403, "Unauthorized access"));
    }

    next();
  };
}

module.exports = ensureAuthUserMatchesParam;
