
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateExistingUsers() {
  try {
    console.log('Starting migration of existing users...');
    
    // Find all users who don't have passwords set
    const usersWithoutPasswords = await prisma.user.findMany({
      where: {
        password: null
      },
      select: {
        id: true,
        username: true,
        password: true,
        needsPasswordSetup: true
      }
    });

    console.log(`Found ${usersWithoutPasswords.length} users without passwords`);

    if (usersWithoutPasswords.length > 0) {
      // Update users to require password setup
      const updateResult = await prisma.user.updateMany({
        where: {
          password: null
        },
        data: {
          needsPasswordSetup: true
        }
      });

      console.log(`Updated ${updateResult.count} users to require password setup`);
      
      // List the users that were updated
      usersWithoutPasswords.forEach(user => {
        console.log(`- ${user.username} (ID: ${user.id})`);
      });
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateExistingUsers()
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
