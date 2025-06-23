// environment variables
require("dotenv").config();
// db access layer
const prisma = require("../db/prisma");
// for hashing passwords
const bcrypt = require("bcryptjs");
// Passport JWT strategy components
const { Strategy: LocalStrategy } = require("passport-local");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");

// loads JWT secret from .env, the secret will sign and verify tokens
const SECRET = process.env.JWT_SECRET;

/* Local Strategy for login using username/pw
initializes Local Strategy which expects a username and pw by default 
done - Passport callback that signals success or failure of authentication */
const localStrategy = new LocalStrategy(async (username, password, done) => {
  try {
    /* queries the db, specifically the user model, for a user whoses username
    matches the input */
    const user = await prisma.user.findUnique({ where: { username } });

    // if user is not found, return - no error, no user object, and Passport error message
    if (!user) return done(null, false, { message: "Incorrect username." });

    /* compares plain-text input pw will hashed pw stored in the db using bcrypt */
    const isValid = await bcrypt.compare(password, user.password);
    // if pw doesn't match, return - no error, no user object, and Passport error message
    if (!isValid) return done(null, false, { message: "Incorrect password." });

    //if username and pw are valid, authentication success, return - no error, and user object
    return done(null, user);
  } catch (err) {
    // if any error occurs (e.g. db error) signal to Passport
    return done(err);
  }
});

// JWT Strategy for protecting routes by checking for valid tokens
const jwtStrategy = new JwtStrategy(
  {
    // server finds the token in the Authorization header as a Bearer token
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    // secret server uses to verify the token's signature
    secretOrKey: SECRET,
  },
  // callback that runs after the token is decoded and verified
  async (payload, done) => {
    try {
      /* queries the db, the user model for a user with the id embedded in the 
      token payload */
      const user = await prisma.user.findUnique({ where: { id: payload.id } });
      // if user is found, authentication succeeds, if not authentication fails
      return done(null, user || false);
    } catch (err) {
      // if there's a db error, authentication fails with err
      return done(err, false);
    }
  }
);

// exports strategies to be registered in app.js
module.exports = {
  localStrategy,
  jwtStrategy,
};
