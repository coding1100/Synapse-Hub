import { prisma } from '../src/prisma-client';

async function seed() {
  const adminEmail = 'owner@synapsehub.local';

  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      passwordHash: '$2b$12$u78pnrL2B8onSMz11u87lexsN2VYhuM4fJv3S95WfUr4gVf2Gtsm6',
      displayName: 'Workspace Owner',
      timezone: 'UTC',
    },
    update: {
      displayName: 'Workspace Owner',
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: 'general' },
    create: {
      name: 'General Workspace',
      slug: 'general',
      ownerId: user.id,
    },
    update: {
      ownerId: user.id,
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: user.id,
      },
    },
    create: {
      workspaceId: workspace.id,
      userId: user.id,
      role: 'OWNER',
    },
    update: {
      role: 'OWNER',
    },
  });

  await prisma.channel.upsert({
    where: {
      workspaceId_name: {
        workspaceId: workspace.id,
        name: 'general',
      },
    },
    create: {
      workspaceId: workspace.id,
      createdById: user.id,
      name: 'general',
      type: 'PUBLIC',
      topic: 'Company-wide announcements and work-based matters',
    },
    update: {
      topic: 'Company-wide announcements and work-based matters',
    },
  });

  console.log('Seed complete');
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
