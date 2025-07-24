/* holds user-related db queries/business rules
db access layer */
const prisma = require("../db/prisma");
// Prisma's runtime client used to query my db
const { Prisma } = require("@prisma/client");
// custom error
const ApiError = require("../utils/ApiError");

/* H7. REGISTERS USER - UserForm.jsx, AuthContext.jsx, users.routes.js, userValidation.js, validate.js, users.controller.js, user.service.js, UserForm.jsx 
- user record created in database */
async function register(name, username, email, hash) {
  try {
    // creates a new user
    return await prisma.user.create({
      data: { name, username, email, password: hash },
    });
  } catch (err) {
    if (
      // checks if new record violates a unique field constraint/email or username already exists
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      // custom error for known error
      throw new ApiError(400, "User already exists");
    }
    throw err;
  }
}
/* GETS ONLINE USERS - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, userHandlers.js, user.service.js, PageContext.jsx, Sidebar.jsx
F9. backend service layer reads db via Prisma and returns array of online users */
async function getOnlineUsers() {
  try {
    // returns array of online users
    const users = await prisma.user.findMany({
      where: { isOnline: true },
      select: { id: true, username: true },
    });
    return users;
  } catch (err) {
    console.error("Failed to fetch online users:", err);
    // custom error for known error
    throw new ApiError(500, "Unable to retrieve online users");
  }
}

/* GETS OFFLINE USERS - AuthContext.js, auth.routes.js, passport.js, auth.routes.js, WebSocketContext.jsx, websocket.js, PageContext.jsx, websocket.js, websocket.handlers.js, userHandlers.js, user.service.js, PageContext.jsx, Sidebar.jsx
G9. backend service layer reads db via Prisma and returns array of offline users */
async function getOfflineUsers() {
  try {
    // returns array of offline users
    const users = await prisma.user.findMany({
      where: { isOnline: false },
      select: { id: true, username: true },
    });
    return users;
  } catch (err) {
    console.error("Failed to fetch offline users:", err);
    // custom error for known error
    throw new ApiError(500, "Unable to retrieve offline users");
  }
}

module.exports = {
  register,
  getOnlineUsers,
  getOfflineUsers,
};
