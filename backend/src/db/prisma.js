/* imports PrismaClient constructor, providing access to my db through Prisma 
uses client library Prisma outputted to node_modules/prisma/client */
const { PrismaClient } = require("@prisma/client");

// instantiates Prisma Client, establishes connection to my db
const prisma = new PrismaClient();

module.exports = prisma;
