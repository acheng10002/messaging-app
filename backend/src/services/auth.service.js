/* holds authentication-related db queries/business rules
db access layer */
const prisma = require("../db/prisma");
// custom error
const ApiError = require("../utils/ApiError");

async function setUserOnline(userId) {
  try {
    // updates user's isOnline field
    return await prisma.user.update({
      where: { id: userId },
      data: { isOnline: true },
    });
  } catch (err) {
    console.error(`Failed to set user ${userId} online:`, err);
    // custom error for known error
    throw new ApiError(500, "Unable to update user status to online");
  }
}

async function setUserOffline(userId) {
  try {
    // updates user's isOnline field
    return await prisma.user.update({
      where: { id: userId },
      data: { isOnline: false },
    });
  } catch (err) {
    console.error(`Failed to set user ${userId} offline:`, err);
    // custom error for known error
    throw new ApiError(500, "Unable to update user status to offline");
  }
}

module.exports = {
  setUserOnline,
  setUserOffline,
};
