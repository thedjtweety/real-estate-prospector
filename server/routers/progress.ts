import { observable } from "@trpc/server/observable";
import { EventEmitter } from "events";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import type { ProgressUpdate } from "../services/progressTracker";

// Event emitter for progress updates
const progressEmitter = new EventEmitter();

export const progressRouter = router({
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
  progressEmitter.emit("progress", { searchId, update });
}
