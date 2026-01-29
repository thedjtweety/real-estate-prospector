import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Businesses/brokerages being prospected
 */
export const businesses = mysqlTable("businesses", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 500 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  website: varchar("website", { length: 500 }),
  address: text("address"),
  city: varchar("city", { length: 200 }),
  state: varchar("state", { length: 100 }),
  zipCode: varchar("zipCode", { length: 20 }),
  
  // Verification status
  verified: boolean("verified").default(false).notNull(),
  verificationScore: decimal("verificationScore", { precision: 3, scale: 2 }), // 0.00 to 1.00
  verificationDate: timestamp("verificationDate"),
  
  // Metadata
  dataSource: text("dataSource"), // Where the data came from
  rawData: json("rawData"), // Store original API/scraping results
  
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = typeof businesses.$inferInsert;

/**
 * Contacts identified at businesses (brokers, admins, etc.)
 */
export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  
  // Contact details
  name: varchar("name", { length: 300 }).notNull(),
  title: varchar("title", { length: 300 }),
  role: mysqlEnum("role", ["broker", "owner", "office_manager", "admin", "transaction_coordinator", "technology_poc", "other"]),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  
  // AI-powered categorization
  roleConfidence: decimal("roleConfidence", { precision: 3, scale: 2 }), // AI confidence in role assignment
  inferredFrom: text("inferredFrom"), // What data points led to this categorization
  decisionMakerScore: int("decisionMakerScore").default(0), // 0-100 score for decision-making authority
  
  // Metadata
  isPrimary: boolean("isPrimary").default(false).notNull(), // Primary contact for business
  dataSource: text("dataSource"),
  rawData: json("rawData"),
  
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

/**
 * MLS associations (state and local)
 */
export const mlsAssociations = mysqlTable("mlsAssociations", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  
  // Association details
  name: varchar("name", { length: 500 }).notNull(),
  type: mysqlEnum("type", ["MLS", "State Association", "Local Board", "Regional", "National"]).notNull(),
  mlsId: varchar("mlsId", { length: 200 }),
  website: varchar("website", { length: 500 }),
  
  // Location
  state: varchar("state", { length: 100 }),
  region: varchar("region", { length: 200 }),
  
  // Verification
  verified: boolean("verified").default(false).notNull(),
  verificationDate: timestamp("verificationDate"),
  
  // Metadata
  dataSource: text("dataSource"),
  rawData: json("rawData"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MlsAssociation = typeof mlsAssociations.$inferSelect;
export type InsertMlsAssociation = typeof mlsAssociations.$inferInsert;

/**
 * Search history for tracking and team collaboration
 */
export const searches = mysqlTable("searches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Search parameters
  searchType: varchar("searchType", { length: 50 }).notNull(), // "business_name", "phone", "email", "multi"
  searchQuery: json("searchQuery").notNull(), // Store all search parameters
  
  // Results
  businessId: int("businessId"), // Link to found business if any
  resultsCount: int("resultsCount").default(0).notNull(),
  resultsSummary: json("resultsSummary"), // Summary of what was found
  
  // Status
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
  processingTime: int("processingTime"), // milliseconds
  
  // Collaboration
  shared: boolean("shared").default(false).notNull(),
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Search = typeof searches.$inferSelect;
export type InsertSearch = typeof searches.$inferInsert;

/**
 * Notifications for high-value prospects and alerts
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Notification details
  type: mysqlEnum("type", ["high_value_prospect", "criteria_match", "team_share", "verification_complete"]).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  message: text("message").notNull(),
  
  // Links
  businessId: int("businessId"),
  searchId: int("searchId"),
  
  // Status
  read: boolean("read").default(false).notNull(),
  readAt: timestamp("readAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Saved search criteria for automated monitoring
 */
export const savedSearchCriteria = mysqlTable("savedSearchCriteria", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  name: varchar("name", { length: 300 }).notNull(),
  criteria: json("criteria").notNull(), // Search parameters to monitor
  notifyOnMatch: boolean("notifyOnMatch").default(true).notNull(),
  
  active: boolean("active").default(true).notNull(),
  lastChecked: timestamp("lastChecked"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SavedSearchCriteria = typeof savedSearchCriteria.$inferSelect;
export type InsertSavedSearchCriteria = typeof savedSearchCriteria.$inferInsert;

