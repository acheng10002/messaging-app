// extracts and handles the validation errors collected by express-validator
const { validationResult } = require("express-validator");
// my custom ApiError class standardizes error handling in the backend
const ApiError = require("../utils/ApiError");

/* gets run after userValidationRules 
executes the validator logic and handles validation errors */
const validate = (req, res, next) => {
  /* retrieves result of userValidationRules, returns a Result object which
  contains validation errors if they exist */
  const errors = validationResult(req);

  // if any validation errors are collected
  if (!errors.isEmpty()) {
    const message = errors
      // converts the error result to an array of error objects
      .array()
      // extracts only the human-readable error message I set in withMessage()
      .map((err) => err.msg)
      // joins the error messages into a single string separated by |
      .join(" | ");
    // returns a Bad Request error and halts further request processing
    return next(new ApiError(400, message));
  }

  next();
};

module.exports = { validate };
