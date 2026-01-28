import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { notifications } from "../../drizzle/schema";
import { desc, eq } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

export const notificationsRouter = router({
  // Get user notifications
  getNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const userNotifications = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, ctx.user.id))
        .orderBy(desc(notifications.createdAt))
        .limit(input.limit);

      return userNotifications;
    }),

  // Mark notification as read
  markAsRead: protectedProcedure
    .input(
      z.object({
        notificationId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      await db
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.id, input.notificationId));

      return { success: true };
    }),

  // Mark all notifications as read
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, ctx.user.id));

    return { success: true };
  }),

  // Send test notification (for development)
  sendTestNotification: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      await notifyOwner({
        title: "Test Notification from Super Scrubber",
        content: `This is a test notification sent by ${ctx.user.name || ctx.user.email} to verify the notification system is working correctly.`,
      });

      return { success: true, message: "Test notification sent successfully" };
    } catch (error) {
      console.error("Failed to send test notification:", error);
      return { success: false, message: "Failed to send notification" };
    }
  }),
});
