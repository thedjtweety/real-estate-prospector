import { observable } from "@trpc/server/observable";
import { EventEmitter } from "events";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import type { ProgressUpdate } from "../services/progressTracker";

// Event emitter for progress updates
const progressEmitter = new EventEmitter();

// Store latest progress for each search
const progressStore = new Map<string, ProgressUpdate>();

export const progressRouter = router({
  /**
   * Get latest progress for a search (for polling)
   */
  getProgress: publicProcedure
    .input(z.object({ searchId: z.string() }))
    .query(({ input }) => {
      const progress = progressStore.get(input.searchId);
      if (!progress) {
        // Return initial state if no progress yet
        return {
          stage: "Initializing",
          status: "in_progress" as const,
          message: "Starting search...",
          percentage: 0,
          timestamp: new Date(),
        };
      }
      return progress;
    }),

  /**
   * Subscribe to progress updates for a specific search
   */
  subscribe: publicProcedure
    .input(z.object({ searchId: z.string() }))
    .subscription(({ input }) => {
      return observable<ProgressUpdate>((emit) => {
        const onProgress = (data: { searchId: string; update: ProgressUpdate }) => {
          if (data.searchId === input.searchId) {
            emit.next(data.update);
          }
        };

        progressEmitter.on("progress", onProgress);

        return () => {
          progressEmitter.off("progress", onProgress);
        };
      });
    }),
});

/**
 * Emit a progress update for a search
 */
export function emitProgress(searchId: string, update: ProgressUpdate) {
  // Store latest progress
  progressStore.set(searchId, update);
  // Emit for subscriptions (if any)
  progressEmitter.emit("progress", { searchId, update });
}
