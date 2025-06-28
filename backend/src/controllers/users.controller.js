/* user-related HTTP request handlers 
maps HTTP users routes to business logic */
// for hashing passwords
const bcrypt = require("bcryptjs");
// service function with db query
const { register } = require("../services/user.service");
// custom error
const ApiError = require("../utils/ApiError");

/* POST /users/
public, registers a new user */
const registerController = async (req, res, next) => {
  // destructures fields from request body
  const { name, username, email, password, passwordConfirmation } = req.body;

  if (password !== passwordConfirmation) {
    throw new ApiError(400, "Passwords do not match");
  }
  // hashes the password
  const hash = await bcrypt.hash(password, 10);
  try {
    // registers the new user with service function
    await register(name, username, email, hash);
    // redirects to login on success
    res.status(201).json({
      message: "Registration successful. Please log in.",
      redirectTo: "/auth/login",
    });
  } catch (err) {
    // next cb passes control to error handler
    next(err);
  }
};

module.exports = {
  registerController,
};
