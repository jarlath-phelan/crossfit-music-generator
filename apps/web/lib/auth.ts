import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "./db";
import * as schema from "./schema";

let _auth: ReturnType<typeof betterAuth> | null = null;

/** Lazy singleton — safe to import at module level in server actions */
export const auth = new Proxy({} as ReturnType<typeof betterAuth>, {
  get(_, prop) {
    return Reflect.get(getAuth(), prop);
  },
});

export function getAuth() {
  if (!_auth) {
    _auth = betterAuth({
      baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      database: drizzleAdapter(getDb(), {
        provider: "pg",
        schema,
      }),
      socialProviders: {
        spotify: {
          clientId: process.env.SPOTIFY_CLIENT_ID!,
          clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
          scope: [
            "user-read-email",
            "user-read-private",
            "streaming",
            "user-modify-playback-state",
            "user-read-playback-state",
          ],
        },
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
      },
    });
  }
  return _auth;
}
