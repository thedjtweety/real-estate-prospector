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
import { scrapeWithEnhancements } from "../services/enhancedScraper";
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
        progressTracker.startStage('Initializing search');
        
        // Step 1: Check if business already exists in database
        progressTracker.update('Initializing search', 'Checking existing database records...');
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
        progressTracker.completeStage('Initializing search', 'No existing records found');
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
