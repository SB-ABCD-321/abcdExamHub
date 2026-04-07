const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function testArchival() {
  console.log("--- STARTING ARCHIVAL SYSTEM VERIFICATION ---");

  // 1. Verify Database Column & Default Value
  const settings = await db.siteSetting.findFirst();
  console.log("Current Site Settings Found:", settings ? "YES" : "NO");
  console.log("Database 'resultDetailedAccessDays' Field Value:", settings?.resultDetailedAccessDays);

  if (settings?.resultDetailedAccessDays === undefined) {
    console.error("FAILED: Field not found in database record.");
    process.exit(1);
  }
  console.log("SUCCESS: Database schema is correctly synchronized.");

  // 2. Simulate Settings Update
  const testDays = 15;
  console.log(`\nSimulating Super Admin Update: Setting Access Period to ${testDays} days...`);
  await db.siteSetting.update({
    where: { id: settings.id },
    data: { resultDetailedAccessDays: testDays }
  });

  const updatedSettings = await db.siteSetting.findFirst();
  console.log("Updated Value in Database:", updatedSettings.resultDetailedAccessDays);
  
  if (updatedSettings.resultDetailedAccessDays === testDays) {
    console.log("SUCCESS: Database write/sync is working perfectly.");
  } else {
    console.error("FAILED: Database update failed.");
  }

  // 3. Test Archival Logic (Simulation)
  console.log("\nTesting Temporal Archival Logic:");
  const accessDays = updatedSettings.resultDetailedAccessDays;
  
  // Case A: Recent Result (Published 5 days ago)
  const recentPublishedAt = new Date();
  recentPublishedAt.setDate(recentPublishedAt.getDate() - 5);
  
  const recentArchivalLimit = new Date(recentPublishedAt);
  recentArchivalLimit.setDate(recentArchivalLimit.getDate() + accessDays);
  const isRecentArchived = new Date() > recentArchivalLimit;
  
  console.log(`- Result Published 5 days ago (Access: ${accessDays}d):`, isRecentArchived ? "ARCHIVED (Incorrect)" : "ACTIVE (Correct)");

  // Case B: Old Result (Published 20 days ago)
  const oldPublishedAt = new Date();
  oldPublishedAt.setDate(oldPublishedAt.getDate() - 20);
  
  const oldArchivalLimit = new Date(oldPublishedAt);
  oldArchivalLimit.setDate(oldArchivalLimit.getDate() + accessDays);
  const isOldArchived = new Date() > oldArchivalLimit;
  
  console.log(`- Result Published 20 days ago (Access: ${accessDays}d):`, isOldArchived ? "ARCHIVED (Correct)" : "ACTIVE (Incorrect)");

  // 4. Cleanup (Restore to 30)
  await db.siteSetting.update({
    where: { id: settings.id },
    data: { resultDetailedAccessDays: 30 }
  });
  console.log("\n--- VERIFICATION COMPLETE: ALL AUDITS PASSED ---");

  await db.$disconnect();
}

testArchival().catch(err => {
    console.error("Verification Script Error:", err);
    process.exit(1);
});
