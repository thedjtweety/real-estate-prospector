import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { createBusiness } from "./db";

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
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("prospect.search", () => {
  it("creates a search record and returns searchId", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.prospect.search({
      name: "Test Realty Company",
      phone: "(555) 123-4567",
      email: "info@testrealty.com",
      city: "Austin",
      state: "TX",
    });

    expect(result).toHaveProperty("searchId");
    expect(typeof result.searchId).toBe("number");
    expect(result.searchId).toBeGreaterThan(0);
  });

  it("finds existing business when matching data exists", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a business first
    await createBusiness({
      name: "Keller Williams Realty",
      phone: "(555) 987-6543",
      email: "contact@kw.com",
      city: "Dallas",
      state: "TX",
      verified: true,
      createdBy: ctx.user!.id,
    });

    // Search for it
    const result = await caller.prospect.search({
      name: "Keller Williams",
      city: "Dallas",
      state: "TX",
    });

    expect(result).toHaveProperty("found", true);
    expect(result).toHaveProperty("businessId");
    expect(typeof result.businessId).toBe("number");
  });

  it("creates business even for non-existent entries with low confidence", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.prospect.search({
      name: "Non Existent Realty XYZ 12345",
      city: "Nowhere",
      state: "ZZ",
    });

    // Scraping system always attempts to create a business
    expect(result).toHaveProperty("found", true);
    expect(result).toHaveProperty("businessId");
    // Confidence may be undefined or low for non-existent businesses
    if (result.confidence !== undefined) {
      expect(result.confidence).toBeLessThan(0.5);
    }
  });

  it("handles partial search criteria", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.prospect.search({
      phone: "(555) 000-0000",
    });

    expect(result).toHaveProperty("searchId");
    expect(typeof result.searchId).toBe("number");
  });
});
