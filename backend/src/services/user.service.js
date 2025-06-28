/* holds user-related db queries/business rules
db access layer */
const prisma = require("../db/prisma");
// Prisma's runtime client used to query my db
const { Prisma } = require("@prisma/client");
// custom error
const ApiError = require("../utils/ApiError");

async function register(name, username, email, hash) {
  try {
    // creates a new user
    return await prisma.user.create({
      data: { name, username, email, password: hash },
    });
  } catch (err) {
    if (
      // checks if new record violates a unique field constraint
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      // custom error for known error
      throw new ApiError(400, "User already exists");
    }
    throw err;
  }
}

async function getOnlineUsernames() {
  try {
    // returns array of online users
    const users = await prisma.user.findMany({
      where: { isOnline: true },
      select: { username: true },
    });
    return users.map((user) => user.username);
  } catch (err) {
    console.error("Failed to fetch online users:", err);
    // custom error for known error
    throw new ApiError(500, "Unable to retrieve online users");
  }
}

async function getOfflineUsernames() {
  try {
    // returns array of offline users
    const users = await prisma.user.findMany({
      where: { isOnline: false },
      select: { username: true },
    });
    return users.map((user) => user.username);
  } catch (err) {
    console.error("Failed to fetch offline users:", err);
    // custom error for known error
    throw new ApiError(500, "Unable to retrieve offline users");
  }
}

module.exports = {
  register,
  getOnlineUsernames,
  getOfflineUsernames,
};
