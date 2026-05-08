import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin1234", 12);

  const org = await prisma.organization.create({
    data: {
      name: "Fluxifia Admin",
      slug: "fluxifia-admin",
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@fluxifia.com",
      password: hashedPassword,
      role: "owner",
      orgId: org.id,
    },
  });

  await prisma.subscription.create({
    data: {
      orgId: org.id,
      plan: "free",
      status: "active",
    },
  });

  console.log(`✅ Admin créé : ${admin.email} / mot de passe: admin1234`);
  console.log(`   Organisation : ${org.name} (${org.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
