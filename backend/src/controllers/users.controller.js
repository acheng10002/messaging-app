// maps HTTP users routes to budiness logic
// for hashing passwords
const bcrypt = require("bcryptjs");
// db queries
const { register } = require("../services/user.service");
const ApiError = require("../utils/ApiError");

const registerController = async (req, res, next) => {
  // destructures fields from request body
  const { name, username, email, password, passwordConfirmation } = req.body;

  if (password !== passwordConfirmation) {
    throw new ApiError(400, "Passwords do not match");
  }
  // hashes the password
  const hash = await bcrypt.hash(password, 10);
  try {
    await register(name, username, email, hash);
    // redirects to login on success
    res.status(201).json({
      message: "Registration successful. Please log in.",
      redirectTo: "/auth/login",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerController,
};
