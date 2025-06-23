// holds db queries/business rules
// db access layer
const prisma = require("../db/prisma");
const { Prisma } = require("@prisma/client");
const ApiError = require("../utils/ApiError");

async function register(name, username, email, hash) {
  try {
    // creates a new user
    return await prisma.user.create({
      data: { name, username, email, password: hash },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new ApiError(400, "User already exists");
    }
    throw err;
  }
}

async function getOnlineUsernames() {
  try {
    const users = await prisma.user.findMany({
      where: { isOnline: true },
      select: { username: true },
    });

    return users.map((user) => user.username);
  } catch (err) {
    console.error("Failed to fetch online users:", err);
    throw new ApiError(500, "Unable to retrieve online users");
  }
}

async function getOfflineUsernames() {
  try {
    const users = await prisma.user.findMany({
      where: { isOnline: false },
      select: { username: true },
    });

    return users.map((user) => user.username);
  } catch (err) {
    console.error("Failed to fetch offline users:", err);
    throw new ApiError(500, "Unable to retrieve offline users");
  }
}

module.exports = {
  register,
  getOnlineUsernames,
  getOfflineUsernames,
};
