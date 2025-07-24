/* defines user-related HTTP route paths and binds them to users.controller functions
POST /users/
GET /users/1/chats */
// server framework
const express = require("express");
// for handling authentication
// creates a sub-app for handling user routes
const router = express.Router();
// controller functions to fullfill register and user posts requests
const { registerController } = require("../controllers/users.controller");
// middleware that validates and sanitizes user input before the request reaches register
const userValidationRules = require("../validators/userValidation");
const { validate } = require("../validators/validate");

/* POST /users/register /////////////////////////////// WORKS
- this file is mounted on /users in app.js
- user submits registration details 
H3. REGISTERS USER - UserForm.jsx, AuthContext.jsx, users.routes.js, userValidation.js, validate.js, users.controller.js, user.service.js, UserForm.jsx
- API's backend route handler receives registration request
- userValidationRules runs validations via express-validator
- validate middleware that checks for validation errors
- registerController handles actual registration logic */
router.post("/register", userValidationRules, validate, registerController);

module.exports = router;
