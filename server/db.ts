import { eq, desc, and, or, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  businesses, 
  contacts, 
  mlsAssociations, 
  searches, 
  notifications,
  savedSearchCriteria,
  InsertBusiness,
  InsertContact,
  InsertMlsAssociation,
  InsertSearch,
  InsertNotification,
  InsertSavedSearchCriteria
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============= USER OPERATIONS =============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============= BUSINESS OPERATIONS =============

export async function createBusiness(business: InsertBusiness) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(businesses).values(business);
  return result[0].insertId;
}

export async function getBusinessById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(businesses).where(eq(businesses.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function searchBusinesses(params: {
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  
  if (params.name) {
    conditions.push(like(businesses.name, `%${params.name}%`));
  }
  if (params.phone) {
    conditions.push(like(businesses.phone, `%${params.phone}%`));
  }
  if (params.email) {
    conditions.push(like(businesses.email, `%${params.email}%`));
  }
  if (params.city) {
    conditions.push(like(businesses.city, `%${params.city}%`));
  }
  if (params.state) {
    conditions.push(eq(businesses.state, params.state));
  }
  
  if (conditions.length === 0) {
    return [];
  }
  
  return await db.select().from(businesses).where(or(...conditions)).orderBy(desc(businesses.createdAt));
}

export async function updateBusiness(id: number, updates: Partial<InsertBusiness>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(businesses).set(updates).where(eq(businesses.id, id));
}

export async function getAllBusinesses(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(businesses)
    .where(eq(businesses.createdBy, userId))
    .orderBy(desc(businesses.createdAt));
}

// ============= CONTACT OPERATIONS =============

export async function createContact(contact: InsertContact) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(contacts).values(contact);
  return result[0].insertId;
}

export async function getContactsByBusinessId(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(contacts)
    .where(eq(contacts.businessId, businessId))
    .orderBy(desc(contacts.isPrimary), desc(contacts.createdAt));
}

export async function updateContact(id: number, updates: Partial<InsertContact>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(contacts).set(updates).where(eq(contacts.id, id));
}

// ============= MLS ASSOCIATION OPERATIONS =============

export async function createMlsAssociation(association: InsertMlsAssociation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(mlsAssociations).values(association);
  return result[0].insertId;
}

export async function getMlsAssociationsByBusinessId(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(mlsAssociations)
    .where(eq(mlsAssociations.businessId, businessId))
    .orderBy(mlsAssociations.type, mlsAssociations.name);
}

// ============= SEARCH OPERATIONS =============

export async function createSearch(search: InsertSearch) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(searches).values(search);
  return result[0].insertId;
}

export async function getSearchById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(searches).where(eq(searches.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateSearch(id: number, updates: Partial<InsertSearch>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(searches).set(updates).where(eq(searches.id, id));
}

export async function getUserSearchHistory(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(searches)
    .where(eq(searches.userId, userId))
    .orderBy(desc(searches.createdAt))
    .limit(limit);
}

export async function getSharedSearches(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(searches)
    .where(eq(searches.shared, true))
    .orderBy(desc(searches.createdAt))
    .limit(limit);
}

// ============= NOTIFICATION OPERATIONS =============

export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(notifications).values(notification);
  return result[0].insertId;
}

export async function getUserNotifications(userId: number, unreadOnly: boolean = false) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(notifications.userId, userId)];
  if (unreadOnly) {
    conditions.push(eq(notifications.read, false));
  }
  
  return await db.select().from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(100);
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(notifications).set({ 
    read: true, 
    readAt: new Date() 
  }).where(eq(notifications.id, id));
}

// ============= SAVED SEARCH CRITERIA OPERATIONS =============

export async function createSavedSearchCriteria(criteria: InsertSavedSearchCriteria) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(savedSearchCriteria).values(criteria);
  return result[0].insertId;
}

export async function getUserSavedCriteria(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(savedSearchCriteria)
    .where(eq(savedSearchCriteria.userId, userId))
    .orderBy(desc(savedSearchCriteria.createdAt));
}

export async function getActiveSavedCriteria() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(savedSearchCriteria)
    .where(eq(savedSearchCriteria.active, true));
}
