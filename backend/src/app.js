/* main Express app config file - initialize and config HTTP server and middleware
before it's passed to to the actual server entry point, server.js */
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
during the handling of HTTP requests to my API endpoints- the Express 
backend can handle the parsed JSON
request body as a plain JS object in req.body 
ex. const { email, password, name } = req.body; */
app.use(express.json());

/* global middleware parses incoming URL-encoded HTTP request bodies,  
used for API endpoints 
email=test%40example.com&password=secret123 is url-encoded version of 
email=test@example.com
password=secret123 
and can be accessed in my route handler 
const { email, password } = req.body */
app.use(express.urlencoded({ extended: true }));

// registers/defines the authentication strategy inside Passport
passport.use(localStrategy);
// registers/defines the authorization strategy inside Passport
passport.use(jwtStrategy);
// initializes.mounts Passport middleware to handle authentication
app.use(passport.initialize());
// route handler that redirects user from root to /auth/login
app.get("/", (req, res) => {
  res.redirect("/auth/login");
});

/* router-level middleware - route definitions that registers routers into 
                             my main app 
- route - are differentiated by both HTTP methods and their paths
- route handler - function that runs when a matching route is hit
                  controller functions are route handlers
- router - container of related routes and their handlers
- REST - representational state transfer
         resources (users, messages, chats, etc.) are represented as as URLs
         state gets transferred using HTTP methods: GET to retrieve data, POST
         to create DATA, PUT/PATCH to update data, DELETE to remove data
- Express routes requests to different handlers based on the HTTP method used,
  even if the URL path is the same */
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/users", chatRoutes);
app.use("/users", messageRoutes);

module.exports = app;

/* package.json - project's metadata and declared dependencies
package-lock.json - has the exact version of every installed package and its dependencies
node_modules - directory in my Node.js project that contains all the installed packages
               including my direct dependencies and their dependencies */
