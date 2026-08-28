import { PrismaClient, UserRole } from '@prisma/client';

const account = process.argv[2]?.trim().toLowerCase();
if (!account) {
  console.error('Usage: npm run admin:promote -- <username-or-email>');
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ usernameNormalized: account }, { email: account }],
    },
    select: { id: true, username: true, email: true },
  });

  if (!user) {
    console.error(`User not found: ${account}`);
    process.exitCode = 1;
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: UserRole.ADMIN },
    });
    console.log(`Promoted ${user.username} (${user.email}) to ADMIN.`);
  }
} finally {
  await prisma.$disconnect();
}
