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
import { scrapeWithEnhancements, setProgressTracker } from "../services/enhancedScraper";
import { categorizeContactRole, detectDuplicateContact } from "../services/llmIntelligence";
import { createProgressTracker } from "../services/progressTracker";
import { emitProgress } from "./progress";

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

      // Create progress tracker
      const progressTracker = createProgressTracker((update) => {
        emitProgress(searchId.toString(), update);
      });

      try {
        console.log('[ProspectRouter] Starting fresh search for:', input);
        progressTracker.startStage('Initializing search');
        
        // Set the global progress tracker for the scraper to use
        setProgressTracker(progressTracker);
        
        // Skip database lookup - always do fresh scraping
        progressTracker.completeStage('Initializing search', 'Starting fresh search');
        progressTracker.startStage('Building intelligent queries');
        
        const scrapedData = await scrapeWithEnhancements({
          name: input.name,
          website: input.website,
          phone: input.phone,
          email: input.email,
          address: input.address,
          city: input.city,
          state: input.state,
          zipCode: input.zipCode,
        });

        progressTracker.completeStage('Identifying MLS associations', `Found ${scrapedData.mlsAssociations.length} MLS associations`);
        progressTracker.startStage('Cross-referencing data');

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
          verified: scrapedData.confidence > 70,
          verificationScore: String(scrapedData.confidence),
          dataSource: scrapedData.dataSources.join(", "),
          createdBy: ctx.user.id,
        });

        // Step 4: Process and categorize contacts using LLM
        progressTracker.update('Cross-referencing data', `Processing ${scrapedData.contacts.length} contacts...`);
        
        for (const contact of scrapedData.contacts) {
          // Use LLM to categorize role
          const roleInfo = await categorizeContactRole({
            name: contact.name,
            title: contact.role,
            companyName: scrapedData.name,
          });

          // Check for duplicates
          const existingContacts = await searchBusinesses({ name: contact.name });
          const duplicationCheck = await detectDuplicateContact({
            newContact: {
              name: contact.name,
              title: contact.role,
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
            title: contact.role,
            role: roleInfo.role,
            email: contact.email || null,
            phone: contact.phone || null,
            isPrimary: roleInfo.role === "owner" || roleInfo.role === "broker",
            roleConfidence: String(roleInfo.confidence),
            inferredFrom: roleInfo.reasoning,
            dataSource: scrapedData.dataSources[0] || 'web_scraping',
            createdBy: ctx.user.id,
          });
          }
        }

        // Step 5: Create MLS associations
        progressTracker.startStage('Calculating confidence scores');
        
        for (const mls of scrapedData.mlsAssociations) {
          await createMlsAssociation({
            businessId,
            name: mls.name,
            type: mls.type,
            state: scrapedData.state,
            dataSource: scrapedData.dataSources[0] || 'web_scraping',
          });
        }

        // Step 6: Update search record
        progressTracker.startStage('Finalizing results');
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
            sources: scrapedData.dataSources,
            confidence: scrapedData.confidence,
          },
        });

        progressTracker.complete();

        return {
          searchId,
          found: true,
          businessId,
          source: "web_scraping",
          confidence: scrapedData.confidence,
          contactsFound: scrapedData.contacts.length,
          mlsAssociationsFound: scrapedData.mlsAssociations.length,
        };
      } catch (error) {
        // Handle errors
        console.error("[ProspectRouter] Search error:", error);
        progressTracker.failStage('Search', error instanceof Error ? error.message : 'Unknown error');
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
