import { db } from "../lib/db";
import { appSettings } from "../lib/schema";

const DEFAULTS: Record<string, string> = {
  music_strategy: "claude",
  onboarding_style: "grid",
  artist_expansion: "claude",
};

async function seed() {
  for (const [key, value] of Object.entries(DEFAULTS)) {
    await db
      .insert(appSettings)
      .values({ key, value })
      .onConflictDoNothing();
  }
  console.log("Settings seeded:", DEFAULTS);
  process.exit(0);
}

seed();
