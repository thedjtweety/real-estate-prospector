import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { notifications } from "../drizzle/schema";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("notifications router", () => {
  let testNotificationId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available for testing");
    }

    // Create test notification
    const result = await db.insert(notifications).values({
      userId: 1,
      title: "Test Notification",
      message: "This is a test notification for vitest",
      type: "high_value_prospect",
      read: false,
    });

    testNotificationId = Number(result[0].insertId);
  });

  it("retrieves user notifications", async () => {
    const { ctx } = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const userNotifications = await caller.notifications.getNotifications({ limit: 20 });

    expect(Array.isArray(userNotifications)).toBe(true);
    expect(userNotifications.length).toBeGreaterThan(0);
    expect(userNotifications.some(n => n.id === testNotificationId)).toBe(true);
  });

  it("marks notification as read", async () => {
    const { ctx } = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.markAsRead({ notificationId: testNotificationId });

    expect(result.success).toBe(true);

    // Verify it's marked as read
    const userNotifications = await caller.notifications.getNotifications({ limit: 20 });
    const notification = userNotifications.find(n => n.id === testNotificationId);
    expect(notification?.read).toBe(true);
  });

  it("marks all notifications as read", async () => {
    const { ctx } = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.markAllAsRead();

    expect(result.success).toBe(true);

    // Verify all are marked as read
    const userNotifications = await caller.notifications.getNotifications({ limit: 20 });
    expect(userNotifications.every(n => n.read)).toBe(true);
  });

  it("sends test notification successfully", async () => {
    const { ctx } = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.sendTestNotification();

    expect(result.success).toBe(true);
    expect(result.message).toBe("Test notification sent successfully");
  });

  it("only retrieves notifications for the authenticated user", async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Create notification for different user
    await db.insert(notifications).values({
      userId: 999,
      title: "Other User Notification",
      message: "This should not be visible to user 1",
      type: "high_value_prospect",
      read: false,
    });

    const { ctx } = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const userNotifications = await caller.notifications.getNotifications({ limit: 50 });

    // Should not include notifications for other users
    expect(userNotifications.every(n => n.userId === 1)).toBe(true);
  });

  it("respects limit parameter", async () => {
    const { ctx } = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const limitedNotifications = await caller.notifications.getNotifications({ limit: 1 });

    expect(limitedNotifications.length).toBeLessThanOrEqual(1);
  });
});
