// server framework that handles routing & middleware
const express = require("express");
// raw passport lib for handling authentication
const passport = require("passport");
/* local - for authentication/validating user's identity for login
jwt - for authorization/verifying the token attached to future requests &
checking the user is who they claim to be before they get access to 
protected routes */
const { localStrategy, jwtStrategy } = require("./config/passport");
// three routers/inline middleware applied in route definitions below
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/users.routes");
const chatRoutes = require("./routes/chats.routes");
const messageRoutes = require("./routes/messages.routes");

// initializes the Express app
const app = express();

/* global middleware that parses incoming JSON request bodies, req.body, 
used for API endpoints - the Express backend can handle the parsed JSON
request body as a plain JS object in req.body 
const { email, password, name } = req.body; */
app.use(express.json());

/* global middleware parses incoming URL-encoded HTTP request bodies,  
used for API endpoints 
email=test%40example.com&password=secret123 is url-encoded version of 
email=test@example.com
password=secret123 
and can be accessed in my route handler 
const { email, password } = req.body */
app.use(express.urlencoded({ extended: true }));

// registers the authentication strategy inside Passport
passport.use(localStrategy);
// registers the authorization strategy inside Passport
passport.use(jwtStrategy);
// initializes Passport middleware to handle authentication
app.use(passport.initialize());
// route handler that redirects user from root to /auth/login
app.get("/", (req, res) => {
  res.redirect("/auth/login");
});

/* router-level middleware - route definitions that registers routers into 
my main app 
- backend routes use both HTTP method and the path to distinguish routes,
- it's valid, standard RESTful design 
- Express routes requests to different handlers based on the HTTP method used,
  even if the URL path is the same */
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/users", chatRoutes);
app.use("/users", messageRoutes);

module.exports = app;
