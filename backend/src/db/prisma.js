/* db client instance, allowing access to my db 
- this wrapper for Prisma Client centralizes and reuses the db connection across my app
-- avoids creating a new PrismaClient every time I access the db

- imports PrismaClient constructor, providing access to my db through Prisma 
-- connects to my db using the config from schema.prisma
- uses client library Prisma outputted to node_modules/prisma/client */
const { PrismaClient } = require("@prisma/client");

// instantiates Prisma Client, establishes connection to my db
const prisma = new PrismaClient();

// makes prisma accessible from any service, controller, or route file
module.exports = prisma;
