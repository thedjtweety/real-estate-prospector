import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createBusiness,
  createSearch,
  updateSearch,
  searchBusinesses,
  createContact,
  createMlsAssociation,
} from "../db";
import { scrapeBusinessComprehensive } from "../services/webScraper";
import { categorizeContactRole, detectDuplicateContact } from "../services/llmIntelligence";

export const prospectRouter = router({
  search: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        website: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const startTime = Date.now();

      // Create search record
      const searchId = await createSearch({
        userId: ctx.user.id,
        searchType: "multi",
        searchQuery: input,
        status: "pending",
      });

      try {
        // Step 1: Check if business already exists in database
        const existingBusinesses = await searchBusinesses({
          name: input.name,
          phone: input.phone,
          email: input.email,
          city: input.city,
          state: input.state,
        });

        if (existingBusinesses.length > 0) {
          // Found existing business
          const processingTime = Date.now() - startTime;
          await updateSearch(searchId, {
            status: "completed",
            businessId: existingBusinesses[0].id,
            resultsCount: existingBusinesses.length,
            processingTime,
            resultsSummary: {
              found: true,
              businessId: existingBusinesses[0].id,
              businessName: existingBusinesses[0].name,
              source: "database",
            },
          });

          return {
            searchId,
            found: true,
            businessId: existingBusinesses[0].id,
            source: "database",
          };
        }

        // Step 2: Scrape comprehensive data from multiple sources
        const scrapedData = await scrapeBusinessComprehensive({
          name: input.name,
          website: input.website,
          phone: input.phone,
          email: input.email,
          city: input.city,
          state: input.state,
        });

        // Step 3: Create business record
        const businessId = await createBusiness({
          name: scrapedData.name,
          website: scrapedData.website,
          phone: scrapedData.phone,
          email: scrapedData.email,
          address: scrapedData.address,
          city: scrapedData.city,
          state: scrapedData.state,
          zipCode: scrapedData.zipCode,
          verified: scrapedData.overallConfidence > 0.7,
          verificationScore: String(scrapedData.overallConfidence),
          dataSource: scrapedData.sources.join(", "),
          createdBy: ctx.user.id,
        });

        // Step 4: Process and categorize contacts using LLM
        for (const contact of scrapedData.contacts) {
          // Use LLM to categorize role
          const roleInfo = await categorizeContactRole({
            name: contact.name,
            title: contact.title,
            companyName: scrapedData.name,
          });

          // Check for duplicates
          const existingContacts = await searchBusinesses({ name: contact.name });
          const duplicationCheck = await detectDuplicateContact({
            newContact: {
              name: contact.name,
              title: contact.title,
              email: contact.email,
              phone: contact.phone,
            },
            existingContacts: existingContacts.map(b => ({
              id: b.id,
              name: b.name || "",
              title: undefined,
              email: b.email || undefined,
              phone: b.phone || undefined,
            })),
          });

          if (!duplicationCheck.isDuplicate) {
          await createContact({
            businessId,
            name: contact.name,
            title: contact.title,
            role: roleInfo.role,
            email: contact.email || null,
            phone: contact.phone || null,
            isPrimary: roleInfo.role === "owner" || roleInfo.role === "broker",
            roleConfidence: String(roleInfo.confidence),
            inferredFrom: roleInfo.reasoning,
            dataSource: contact.source,
            createdBy: ctx.user.id,
          });
          }
        }

        // Step 5: Create MLS associations
        for (const mls of scrapedData.mlsAssociations) {
          await createMlsAssociation({
            businessId,
            name: mls.name,
            type: mls.type,
            state: scrapedData.state,
            dataSource: mls.source,
          });
        }

        // Step 6: Update search record
        const processingTime = Date.now() - startTime;
        await updateSearch(searchId, {
          status: "completed",
          businessId,
          resultsCount: 1,
          processingTime,
          resultsSummary: {
            found: true,
            businessId,
            businessName: scrapedData.name,
            contactsFound: scrapedData.contacts.length,
            mlsAssociationsFound: scrapedData.mlsAssociations.length,
            sources: scrapedData.sources,
            confidence: scrapedData.overallConfidence,
          },
        });

        return {
          searchId,
          found: true,
          businessId,
          source: "web_scraping",
          confidence: scrapedData.overallConfidence,
          contactsFound: scrapedData.contacts.length,
          mlsAssociationsFound: scrapedData.mlsAssociations.length,
        };
      } catch (error) {
        // Handle errors
        console.error("Search error:", error);
        await updateSearch(searchId, {
          status: "failed",
          resultsSummary: {
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });

        throw error;
      }
    }),
});
