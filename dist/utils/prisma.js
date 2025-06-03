import { PrismaClient } from '@prisma/client';
const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}
console.log("Prisma client initialized:", !!prisma);
export default prisma;
