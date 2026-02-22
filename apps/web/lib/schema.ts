import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  real,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ============================================================================
// Better Auth managed tables
// ============================================================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// ============================================================================
// App tables
// ============================================================================

export const coachProfiles = pgTable(
  "coach_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    gymName: text("gym_name"),
    defaultGenre: text("default_genre").default("rock"),
    preferredGenres: jsonb("preferred_genres").$type<string[]>().default([]),
    excludeArtists: jsonb("exclude_artists").$type<string[]>().default([]),
    minEnergy: real("min_energy").default(0.5),
    allowExplicit: boolean("allow_explicit").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("coach_profiles_user_id_idx").on(table.userId)]
);

export const savedPlaylists = pgTable("saved_playlists", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  name: text("name").notNull(),
  workoutText: text("workout_text"),
  workoutStructure: jsonb("workout_structure"),
  playlistData: jsonb("playlist_data"),
  spotifyPlaylistUrl: text("spotify_playlist_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const trackFeedback = pgTable("track_feedback", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  playlistId: uuid("playlist_id").references(() => savedPlaylists.id),
  trackId: text("track_id").notNull(),
  rating: integer("rating").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// App settings (feature flags)
// ============================================================================

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// User taste profiles
// ============================================================================

export const userTasteProfile = pgTable(
  "user_taste_profile",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    likedArtists: jsonb("liked_artists").$type<Record<string, number>>().default({}),
    dislikedArtists: jsonb("disliked_artists").$type<Record<string, number>>().default({}),
    expandedArtists: jsonb("expanded_artists").$type<string[]>().default([]),
    tasteDescription: text("taste_description"),
    onboardingArtists: jsonb("onboarding_artists").$type<string[]>().default([]),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("user_taste_profile_user_id_idx").on(table.userId)]
);
