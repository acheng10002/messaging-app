// extracts and handles the validation errors collected by express-validator
const { validationResult } = require("express-validator");
// my custom ApiError class standardizes error handling in the backend
const ApiError = require("../utils/ApiError");

/* gets run after userValidationRules 
executes the validator logic and handles validation errors 
H5. REGISTERS USER - UserForm.jsx, AuthContext.jsx, users.routes.js, userValidation.js, validate.js, users.controller.js, user.service.js, UserForm.jsx 
- checks for validation failures or short-circuits and returns an HTTP 400 with errors if there are */
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

  // passes control to next middleware
  next();
};

module.exports = { validate };
