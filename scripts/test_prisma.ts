import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  console.log('Testing Prisma Client...');
  console.log('Prisma object:', prisma);
  console.log('Prisma.score:', prisma.score);
  
  try {
    const count = await prisma.score.count();
    console.log('✅ Successfully connected! Score count:', count);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
