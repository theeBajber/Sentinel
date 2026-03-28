// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_CREDENTIALS = {
  email: "admin@sentinel.net",
  password: "Sentinel@2024!",
};

const PRODUCTION_THREATS = [
  {
    id: "seed-1",
    pattern: "login-secure-example\\.com",
    isRegex: true,
    severity: "high",
    source: "seed",
    notes: "Typosquatted banking domain variant",
    category: "phishing",
  },
  {
    id: "seed-2",
    pattern: "paypal-secure-login\\.com",
    isRegex: false,
    severity: "critical",
    source: "seed",
    notes: "Common PayPal impersonation",
    category: "phishing",
  },
  {
    id: "seed-3",
    pattern: "amazon-support-team\\.net",
    isRegex: false,
    severity: "high",
    source: "seed",
    notes: "Amazon support scam",
    category: "phishing",
  },
  {
    id: "seed-4",
    pattern: "bit\\.ly/[a-zA-Z0-9]{5,}",
    isRegex: true,
    severity: "medium",
    source: "seed",
    notes: "Bit.ly shortened URL pattern",
    category: "shortener",
  },
];

async function main() {
  console.log("🌊 Seeding SentinelPhish database...");

  // Check if admin exists
  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email: ADMIN_CREDENTIALS.email },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(ADMIN_CREDENTIALS.password, 12);
    await prisma.adminUser.create({
      data: {
        email: ADMIN_CREDENTIALS.email,
        password: passwordHash,
      },
    });
    console.log("✅ Admin user created:", ADMIN_CREDENTIALS.email);
  } else {
    console.log("ℹ️ Admin user already exists");
  }

  // Upsert threats (update if exists, create if not)
  for (const threat of PRODUCTION_THREATS) {
    await prisma.threatEntry.upsert({
      where: { id: threat.id },
      update: {},
      create: threat,
    });
    console.log(`✅ Threat pattern: ${threat.pattern}`);
  }

  // Create sample logs if none exist
  const existingLogs = await prisma.detectionLog.count();
  if (existingLogs === 0) {
    const sampleUrls = [
      { url: "https://chatgpt.com", verdict: "safe", score: 0 },
      { url: "https://pinterest.com", verdict: "safe", score: 0 },
      { url: "http://login-secure-example.com", verdict: "unsafe", score: 85 },
      { url: "https://paypal-secure-login.com", verdict: "unsafe", score: 92 },
      { url: "http://bit.ly/suspicious", verdict: "suspicious", score: 45 },
    ];

    for (let i = 0; i < 10; i++) {
      const sample = sampleUrls[i % sampleUrls.length];
      await prisma.detectionLog.create({
        data: {
          url: sample.url,
          domain: new URL(sample.url).hostname,
          verdict: sample.verdict,
          score: sample.score,
          reasons: JSON.stringify(["Sample detection"]),
          clientIp: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          source: "seed",
        },
      });
    }
    console.log("✅ Sample logs created (10 entries)");
  }

  console.log("\n🎉 SEED COMPLETE!");
  console.log("🔐 Admin Login:", ADMIN_CREDENTIALS.email);
  console.log("🔑 Password:    ", ADMIN_CREDENTIALS.password);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
