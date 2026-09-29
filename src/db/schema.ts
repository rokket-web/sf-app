import { relations } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  jsonb,
  boolean,
  primaryKey,
  unique,
  index,
} from "drizzle-orm/pg-core";

export const groupType = pgEnum("group_type", ["work", "personal"]);
export const groupRole = pgEnum("group_role", ["owner", "member"]);
export const inviteStatus = pgEnum("invite_status", ["pending", "accepted", "declined"]);
export const visibility = pgEnum("visibility", ["private", "group_members", "public"]);
export const userStatus = pgEnum("user_status", ["active", "suspended"]);

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

// Credentials, email verification and sessions live in Clerk; this mirrors the account.
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  email: text("email").notNull(),
  status: userStatus("status").notNull().default("active"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: createdAt(),
});

export const profiles = pgTable("profiles", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  photoUrl: text("photo_url"),
  bio: text("bio"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  visibility: visibility("visibility").notNull().default("group_members"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Connects a user to their record on the TTI platform.
export const assessmentLinks = pgTable("assessment_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  ttiExternalId: text("tti_external_id").notNull(),
  createdAt: createdAt(),
});

// Cached TTI result JSON with fetched-at timestamp.
export const assessmentResults = pgTable("assessment_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  linkId: uuid("link_id").notNull().unique().references(() => assessmentLinks.id, { onDelete: "cascade" }),
  data: jsonb("data").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
});

export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: groupType("type").notNull(),
  ownerId: uuid("owner_id").notNull().references(() => users.id),
  createdAt: createdAt(),
});

export const groupMembers = pgTable(
  "group_members",
  {
    groupId: uuid("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: groupRole("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.groupId, t.userId] }), index("group_members_user_idx").on(t.userId)],
);

export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  invitedByUserId: uuid("invited_by_user_id").notNull().references(() => users.id),
  inviteeEmail: text("invitee_email").notNull(),
  status: inviteStatus("status").notNull().default("pending"),
  createdAt: createdAt(),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
});

// Per-user consent: the owner lets a specific viewer see their assessment results.
export const resultAccessGrants = pgTable(
  "result_access_grants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    viewerId: uuid("viewer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("result_access_owner_viewer_uq").on(t.ownerId, t.viewerId)],
);

export const usersRelations = relations(users, ({ one }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
  assessmentLink: one(assessmentLinks, { fields: [users.id], references: [assessmentLinks.userId] }),
}));


export const assessmentLinksRelations = relations(assessmentLinks, ({ one }) => ({
  result: one(assessmentResults, { fields: [assessmentLinks.id], references: [assessmentResults.linkId] }),
}));

export const resultAccessGrantsRelations = relations(resultAccessGrants, ({ one }) => ({
  owner: one(users, { fields: [resultAccessGrants.ownerId], references: [users.id] }),
  viewer: one(users, { fields: [resultAccessGrants.viewerId], references: [users.id] }),
}));

export const groupsRelations = relations(groups, ({ many, one }) => ({
  members: many(groupMembers),
  invitations: many(invitations),
  owner: one(users, { fields: [groups.ownerId], references: [users.id] }),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, { fields: [groupMembers.groupId], references: [groups.id] }),
  user: one(users, { fields: [groupMembers.userId], references: [users.id] }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  group: one(groups, { fields: [invitations.groupId], references: [groups.id] }),
  invitedBy: one(users, { fields: [invitations.invitedByUserId], references: [users.id] }),
}));
