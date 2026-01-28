import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import {
  createBusiness,
  createContact,
  createMlsAssociation,
  createSearch,
} from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
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

describe("results router", () => {
  let testBusinessId: number;
  let testSearchId: number;

  beforeAll(async () => {
    // Create test business
    testBusinessId = await createBusiness({
      name: "Test Realty Group",
      phone: "(555) 123-4567",
      email: "contact@testrealty.com",
      city: "Los Angeles",
      state: "CA",
      verified: true,
      verificationScore: "0.95",
      dataSource: "Test",
      createdBy: 1,
    });

    // Create test contacts
    await createContact({
      businessId: testBusinessId,
      name: "John Broker",
      title: "Principal Broker",
      role: "broker",
      email: "john@testrealty.com",
      phone: "(555) 123-4567",
      isPrimary: true,
      roleConfidence: "0.95",
      dataSource: "Test",
      createdBy: 1,
    });

    await createContact({
      businessId: testBusinessId,
      name: "Jane Manager",
      title: "Office Manager",
      role: "office_manager",
      email: "jane@testrealty.com",
      isPrimary: false,
      roleConfidence: "0.90",
      dataSource: "Test",
      createdBy: 1,
    });

    // Create test MLS associations
    await createMlsAssociation({
      businessId: testBusinessId,
      name: "California Association of REALTORS",
      type: "state",
      state: "CA",
      dataSource: "Test",
    });

    await createMlsAssociation({
      businessId: testBusinessId,
      name: "Los Angeles MLS",
      type: "local",
      state: "CA",
      dataSource: "Test",
    });

    // Create test search
    testSearchId = await createSearch({
      userId: 1,
      searchType: "multi",
      searchQuery: { name: "Test Realty Group" },
      status: "completed",
      businessId: testBusinessId,
      resultsCount: 1,
    });
  });

  it("retrieves search results with business, contacts, and MLS data", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.results.getSearchResult({ searchId: testSearchId });

    expect(result.search).toBeDefined();
    expect(result.search.id).toBe(testSearchId);
    expect(result.search.status).toBe("completed");

    expect(result.business).toBeDefined();
    expect(result.business?.name).toBe("Test Realty Group");
    expect(result.business?.verified).toBe(true);

    expect(result.contacts).toHaveLength(2);
    expect(result.contacts.some(c => c.name === "John Broker")).toBe(true);
    expect(result.contacts.some(c => c.name === "Jane Manager")).toBe(true);

    expect(result.mlsAssociations).toHaveLength(2);
    expect(result.mlsAssociations.some(m => m.type === "state")).toBe(true);
    expect(result.mlsAssociations.some(m => m.type === "local")).toBe(true);
  });

  it("retrieves business details directly", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.results.getBusinessDetails({ businessId: testBusinessId });

    expect(result.business).toBeDefined();
    expect(result.business.name).toBe("Test Realty Group");
    expect(result.contacts).toHaveLength(2);
    expect(result.mlsAssociations).toHaveLength(2);
  });

  it("retrieves user search history", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const history = await caller.results.getSearchHistory({ limit: 10 });

    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].userId).toBe(1);
  });

  it("retrieves saved prospects", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const prospects = await caller.results.getSavedProspects();

    expect(Array.isArray(prospects)).toBe(true);
    expect(prospects.length).toBeGreaterThan(0);
    expect(prospects.some(p => p.name === "Test Realty Group")).toBe(true);
  });

  it("throws error for unauthorized search access", async () => {
    const { ctx } = createAuthContext();
    // Modify user ID to simulate different user
    ctx.user!.id = 999;
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.results.getSearchResult({ searchId: testSearchId })
    ).rejects.toThrow("Unauthorized");
  });

  it("throws error for non-existent search", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.results.getSearchResult({ searchId: 99999 })
    ).rejects.toThrow("Search not found");
  });

  it("throws error for non-existent business", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.results.getBusinessDetails({ businessId: 99999 })
    ).rejects.toThrow("Business not found");
  });
});
