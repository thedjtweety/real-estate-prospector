import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getBusinessById,
  getContactsByBusinessId,
  getMlsAssociationsByBusinessId,
  getSearchById,
  getUserSearchHistory,
  getAllBusinesses,
} from "../db";

export const resultsRouter = router({
  /**
   * Get search result by ID
   */
  getSearchResult: protectedProcedure
    .input(z.object({ searchId: z.number() }))
    .query(async ({ input, ctx }) => {
      const search = await getSearchById(input.searchId);
      
      if (!search) {
        throw new Error("Search not found");
      }
      
      // Verify user has access to this search
      if (search.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }
      
      // Get business details if found
      let business = null;
      let contacts: Awaited<ReturnType<typeof getContactsByBusinessId>> = [];
      let mlsAssociations: Awaited<ReturnType<typeof getMlsAssociationsByBusinessId>> = [];
      
      if (search.businessId) {
        business = await getBusinessById(search.businessId);
        contacts = await getContactsByBusinessId(search.businessId);
        mlsAssociations = await getMlsAssociationsByBusinessId(search.businessId);
      }
      
      return {
        search,
        business,
        contacts,
        mlsAssociations,
      };
    }),

  /**
   * Get business details by ID
   */
  getBusinessDetails: protectedProcedure
    .input(z.object({ businessId: z.number() }))
    .query(async ({ input }) => {
      const business = await getBusinessById(input.businessId);
      
      if (!business) {
        throw new Error("Business not found");
      }
      
      const contacts = await getContactsByBusinessId(input.businessId);
      const mlsAssociations = await getMlsAssociationsByBusinessId(input.businessId);
      
      return {
        business,
        contacts,
        mlsAssociations,
      };
    }),

  /**
   * Get user's search history
   */
  getSearchHistory: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      const history = await getUserSearchHistory(ctx.user.id, input.limit);
      return history;
    }),

  /**
   * Get all saved prospects (businesses)
   */
  getSavedProspects: protectedProcedure.query(async ({ ctx }) => {
    const businesses = await getAllBusinesses(ctx.user.id);
    return businesses;
  }),
});
