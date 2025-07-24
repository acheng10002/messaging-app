/* gets all validators errors for registration
- backend validation that enforces same rules as the client-side
- imports body function from middleware for validating and sanitizing request data in Express.js */
const { body } = require("express-validator");

/* defines what to validate and how to validate it 
REGISTER FIELDS GETS SANITIZED AND VALIDATED WITH A CUSTOM VALIDATOR FOR THE 
CONFIRMPASSWORD FIELD 
H4. REGISTERS USER - UserForm.jsx, AuthContext.jsx, users.routes.js, userValidation.js, validate.js, users.controller.js, user.service.js, UserForm.jsx 
- validates and sanitizes all fields */
const userValidationRules = [
  // validates and sanitizes Name
  body("name")
    .trim() // sanitization: removes leading/trailing spaces
    .notEmpty()
    .withMessage("Name is required") // validation: ensures it's not empty
    .isLength({ max: 150 })
    .withMessage("Name cannot exceed 150 characters") // validation: max length
    .matches(/^[a-zA-Z\s-]+$/)
    .withMessage("Name can only contain letters, spaces, and hyphens"), // validation: pattern

  // validates and sanitizes username
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ max: 30 })
    .withMessage("Username cannot exceed 30 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage(
      "Username can only contain letters, numbers, underscores, and hyphens"
    ),

  // validates and sanitizes email
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isLength({ max: 255 })
    .withMessage("Username cannot exceed 255 characters")
    .isEmail()
    .withMessage("Invalid email format"),

  // validates password
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/\d/)
    .withMessage("Password must contain at least one number")
    .matches(/[@$!%*?&]/)
    .withMessage("Password must contain at least one special character"),

  // custom validation for password confirmation
  body("passwordConfirmation").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match");
    }
    return true;
  }),
];

module.exports = userValidationRules;
