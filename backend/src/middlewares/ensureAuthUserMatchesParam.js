const ApiError = require("../utils/ApiError");

function ensureAuthUserMatchesParam(paramKey) {
  return (req, res, next) => {
    const routeUserId = Number(req.params[paramKey]);
    const authenticatedUserId = req.user?.id;

    if (routeUserId != authenticatedUserId) {
      return next(new ApiError(403, "Unauthorized access"));
    }

    next();
  };
}

module.exports = ensureAuthUserMatchesParam;
