/* defines HTTP /users routes 
POST /users/
GET /users/1/chats */
// server framework
const express = require("express");
// for handling authentication
// const passport = require("passport");
// creates a sub-app for handling user routes
const router = express.Router();
// controller functions to fullfill register and user posts requests
const { registerController } = require("../controllers/users.controller");
// middleware that validates and sanitizes user input before the request reaches register
const userValidationRules = require("../validators/userValidation");
const { validate } = require("../validators/validate");

// POST /users/ WORKS
// this file is mounted on /users in app.js
// user submits registration details
router.post("/register", userValidationRules, validate, registerController);

module.exports = router;
