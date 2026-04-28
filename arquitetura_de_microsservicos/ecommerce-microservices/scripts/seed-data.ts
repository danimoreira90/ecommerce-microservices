/**
 * Seed script for development data.
 * Run: npx ts-node scripts/seed-data.ts
 * Or from repo root: npm run seed
 */
async function main(): Promise<void> {
  console.log('Seed script placeholder. Implement per-service seeds or call service seed endpoints.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
