# Contributing to Super Scrubber

**Development Guidelines for Humans and AI Assistants**

Thank you for your interest in contributing to Super Scrubber! This document provides comprehensive guidelines for developers and AI assistants (Claude, GPT, etc.) to effectively contribute to the project.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [For AI Assistants](#for-ai-assistants)
3. [Development Workflow](#development-workflow)
4. [Code Standards](#code-standards)
5. [Testing Guidelines](#testing-guidelines)
6. [Database Changes](#database-changes)
7. [API Development](#api-development)
8. [Frontend Development](#frontend-development)
9. [Scraping Services](#scraping-services)
10. [Pull Request Process](#pull-request-process)

---

## Getting Started

### Prerequisites

Before contributing, ensure you have the following installed:

- Node.js 22.13.0 or higher
- pnpm package manager
- PostgreSQL 14+ database
- Git for version control
- Code editor with TypeScript support (VS Code recommended)

### Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd real-estate-prospector

# Install dependencies
pnpm install

# Set up environment variables (provided by Manus platform)
# No manual configuration needed

# Push database schema
pnpm db:push

# Run tests to verify setup
pnpm test

# Start development server
pnpm dev
```

### Project Structure Overview

```
real-estate-prospector/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page-level components
│   │   ├── lib/           # Utilities and tRPC client
│   │   └── hooks/         # Custom React hooks
│   └── public/            # Static assets
├── server/                # Backend Express + tRPC
│   ├── routers/           # tRPC route handlers
│   ├── services/          # Business logic and scraping
│   ├── _core/             # Framework plumbing (don't modify)
│   └── *.test.ts          # Test files
├── drizzle/               # Database schema and migrations
├── shared/                # Shared types and constants
└── docs/                  # Additional documentation
```

---

## For AI Assistants

### Context Loading Protocol

When starting work on Super Scrubber, follow this sequence to build comprehensive context:

**Step 1: Read Core Documentation**

```
1. README.md - Project overview and features
2. ARCHITECTURE.md - System design and data flow
3. CONTRIBUTING.md - This file
4. todo.md - Current tasks and priorities
```

**Step 2: Review Key Files**

```
5. drizzle/schema.ts - Database schema
6. server/routers.ts - API structure
7. server/services/enhancedScraper.ts - Core scraping logic
8. client/src/pages/Home.tsx - Main UI
```

**Step 3: Check Test Files**

```
9. server/*.test.ts - Test patterns and expected behavior
```

### Communication Guidelines

When working with users on Super Scrubber:

**DO:**
- Reference specific file paths and line numbers
- Explain the reasoning behind architectural decisions
- Suggest alternatives when multiple approaches exist
- Ask clarifying questions about requirements
- Provide code examples with context
- Update todo.md when adding new tasks
- Run tests after making changes

**DON'T:**
- Make assumptions about user intent without confirmation
- Modify `server/_core/` files (framework internals)
- Break existing tests without discussing changes
- Add dependencies without justification
- Skip documentation updates
- Commit commented-out code or debug logs

### Task Execution Pattern

Follow this pattern for implementing features:

```
1. Understand the requirement
   ↓
2. Check todo.md for related tasks
   ↓
3. Review relevant files and tests
   ↓
4. Propose implementation approach
   ↓
5. Get user confirmation
   ↓
6. Implement changes
   ↓
7. Write/update tests
   ↓
8. Run test suite (pnpm test)
   ↓
9. Update todo.md (mark completed)
   ↓
10. Create checkpoint (if requested)
```

### Common Pitfalls to Avoid

**1. tRPC Subscription Errors**

Super Scrubber uses polling, not WebSocket subscriptions. Always use `useQuery` with `refetchInterval` for real-time updates:

```typescript
// ✅ Correct: Polling
const { data } = trpc.progress.getProgress.useQuery(
  { searchId },
  { refetchInterval: 1000 }
);

// ❌ Wrong: Subscription (not supported)
trpc.progress.subscribe.useSubscription({ searchId });
```

**2. Database Schema Changes**

Always use Drizzle schema and push changes:

```bash
# Edit drizzle/schema.ts first
# Then push to database
pnpm db:push
```

**3. Type Safety**

Leverage TypeScript's type inference. Don't use `any` unless absolutely necessary:

```typescript
// ✅ Correct: Type inference
const searchMutation = trpc.prospect.search.useMutation();

// ❌ Wrong: Explicit any
const searchMutation: any = trpc.prospect.search.useMutation();
```

---

## Development Workflow

### Branch Strategy

```
main (production)
  ↓
develop (integration)
  ↓
feature/feature-name (your work)
```

### Commit Message Format

Follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Build process or tooling changes

**Examples:**

```
feat(scraper): add LinkedIn profile scraping
fix(ui): resolve decision-maker score display bug
docs(readme): update installation instructions
test(prospect): add tests for sparse input handling
```

### Development Commands

```bash
# Start development server (hot reload)
pnpm dev

# Run type checking
pnpm typecheck

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Build for production
pnpm build

# Database commands
pnpm db:push        # Push schema changes
pnpm db:studio      # Open database GUI
pnpm db:generate    # Generate migration files
```

---

## Code Standards

### TypeScript Guidelines

**1. Use Strict Mode**

The project uses strict TypeScript. All code must pass type checking:

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

**2. Prefer Type Inference**

Let TypeScript infer types when possible:

```typescript
// ✅ Good: Type inference
const result = await searchBusiness({ name: "Keller Williams" });

// ❌ Unnecessary: Explicit type
const result: SearchResult = await searchBusiness({ name: "Keller Williams" });
```

**3. Use Zod for Runtime Validation**

All API inputs must be validated with Zod:

```typescript
const searchSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
});

type SearchInput = z.infer<typeof searchSchema>;
```

### Code Formatting

The project uses Prettier for consistent formatting:

```bash
# Format all files
pnpm format

# Check formatting
pnpm format:check
```

**Prettier Configuration:**

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | camelCase | `enhancedScraper.ts` |
| Components | PascalCase | `SearchProgress.tsx` |
| Functions | camelCase | `searchBusiness()` |
| Variables | camelCase | `businessName` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Types/Interfaces | PascalCase | `ContactIntelligence` |
| Database Tables | snake_case | `mls_associations` |

---

## Testing Guidelines

### Test Structure

All tests use Vitest and follow this structure:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { createCaller } from "./_core/trpc";

describe("feature name", () => {
  beforeEach(async () => {
    // Setup code
  });

  it("should do something specific", async () => {
    // Arrange
    const input = { /* test data */ };
    
    // Act
    const result = await caller.feature.method(input);
    
    // Assert
    expect(result).toMatchObject({ /* expected output */ });
  });
});
```

### Test Coverage Requirements

All new features must include tests covering:

1. **Happy path**: Normal operation with valid inputs
2. **Edge cases**: Boundary conditions and unusual inputs
3. **Error handling**: Invalid inputs and failure scenarios
4. **Integration**: Interaction with other components

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test server/prospect.search.test.ts

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Test Examples

**API Procedure Test:**

```typescript
describe("prospect.search", () => {
  it("creates a search record and returns searchId", async () => {
    const caller = createCaller({ user: mockUser });
    
    const result = await caller.prospect.search({
      name: "Test Realty",
      state: "FL"
    });
    
    expect(result).toHaveProperty("searchId");
    expect(result.searchId).toBeGreaterThan(0);
  });
});
```

**Service Function Test:**

```typescript
describe("enhancedScraper", () => {
  it("extracts domain from email address", () => {
    const email = "admin@kwrealty.com";
    const domain = extractDomain(email);
    
    expect(domain).toBe("kwrealty.com");
  });
});
```

---

## Database Changes

### Schema Modification Workflow

**Step 1: Edit Schema**

Modify `drizzle/schema.ts`:

```typescript
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  // Add new field
  newField: text("new_field"),
});
```

**Step 2: Push to Database**

```bash
pnpm db:push
```

**Step 3: Update TypeScript Types**

Drizzle automatically generates types. Import them:

```typescript
import { contacts } from "@/drizzle/schema";
import type { Contact } from "@/drizzle/schema";
```

**Step 4: Update Queries**

Modify queries to use new fields:

```typescript
const contact = await db.contacts.findFirst({
  where: eq(contacts.id, contactId),
  columns: {
    id: true,
    name: true,
    newField: true, // Include new field
  },
});
```

### Database Best Practices

**1. Use Indexes for Frequently Queried Fields**

```typescript
export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  state: varchar("state", { length: 2 }),
}, (table) => ({
  nameIdx: index("idx_businesses_name").on(table.name),
  stateIdx: index("idx_businesses_state").on(table.state),
}));
```

**2. Use Foreign Keys for Relationships**

```typescript
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .references(() => businesses.id)
    .notNull(),
});
```

**3. Use JSONB for Flexible Data**

```typescript
export const contacts = pgTable("contacts", {
  narDesignations: jsonb("nar_designations").$type<string[]>(),
  painPoints: jsonb("pain_points").$type<string[]>(),
});
```

---

## API Development

### Creating New tRPC Procedures

**Step 1: Define Router**

Create or edit a router file in `server/routers/`:

```typescript
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";

export const featureRouter = router({
  // Query (read operation)
  getItem: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      // Implementation
      return { id: input.id, data: "..." };
    }),
  
  // Mutation (write operation)
  createItem: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // ctx.user available in protectedProcedure
      // Implementation
      return { id: 1, name: input.name };
    }),
});
```

**Step 2: Register Router**

Add to `server/routers.ts`:

```typescript
import { featureRouter } from "./routers/feature";

export const appRouter = router({
  // ... existing routers
  feature: featureRouter,
});
```

**Step 3: Use in Frontend**

```typescript
// Query
const { data, isLoading } = trpc.feature.getItem.useQuery({ id: 1 });

// Mutation
const createMutation = trpc.feature.createItem.useMutation({
  onSuccess: (data) => {
    console.log("Created:", data);
  },
});

createMutation.mutate({ name: "Test" });
```

### Input Validation Patterns

**Optional Fields:**

```typescript
z.object({
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
})
```

**Conditional Validation:**

```typescript
z.object({
  name: z.string(),
  email: z.string().email(),
}).refine(data => data.name || data.email, {
  message: "Either name or email is required"
})
```

**Enums:**

```typescript
z.object({
  role: z.enum(["broker", "owner", "office_manager", "agent"]),
})
```

---

## Frontend Development

### Component Guidelines

**1. Use Functional Components with Hooks**

```typescript
export function SearchForm() {
  const [query, setQuery] = useState("");
  const searchMutation = trpc.prospect.search.useMutation();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchMutation.mutate({ name: query });
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

**2. Extract Reusable Logic to Custom Hooks**

```typescript
function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const searchMutation = trpc.prospect.search.useMutation({
    onSuccess: (data) => setResults(data.results),
  });
  
  return { results, search: searchMutation.mutate };
}
```

**3. Use shadcn/ui Components**

```typescript
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Click Me</Button>
      </CardContent>
    </Card>
  );
}
```

### Styling Guidelines

**1. Use Tailwind Utility Classes**

```tsx
<div className="flex items-center gap-4 p-6 bg-navy-50 rounded-lg">
  <h2 className="text-2xl font-display font-bold text-navy-900">Title</h2>
</div>
```

**2. Use Custom Color Tokens**

```tsx
// Navy and gold theme
<div className="bg-navy-700 text-white">
  <Badge className="bg-gold-500">Gold Badge</Badge>
</div>
```

**3. Responsive Design**

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>
```

---

## Scraping Services

### Adding New Scraping Sources

**Step 1: Create Service Function**

```typescript
// server/services/newSource.ts
export async function scrapeNewSource(businessName: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(`https://example.com/search?q=${businessName}`);
    const data = await page.evaluate(() => {
      // Extract data from page
      return { /* extracted data */ };
    });
    
    return data;
  } finally {
    await browser.close();
  }
}
```

**Step 2: Integrate into Enhanced Scraper**

```typescript
// server/services/enhancedScraper.ts
import { scrapeNewSource } from "./newSource";

export async function searchBusiness(params) {
  // ... existing code
  
  // Add new source
  const newSourceData = await scrapeNewSource(params.name);
  
  // Merge with existing data
  // ...
}
```

**Step 3: Add Progress Tracking**

```typescript
emitProgress(searchId, {
  stage: "Scraping New Source",
  status: "in_progress",
  message: "Gathering data from new source...",
  percentage: 60,
  timestamp: new Date(),
});
```

### Scraping Best Practices

**1. Always Use Try-Catch**

```typescript
try {
  const data = await scrapeSomething();
} catch (error) {
  console.error("Scraping failed:", error);
  return null; // Graceful degradation
}
```

**2. Set Timeouts**

```typescript
await page.goto(url, { 
  waitUntil: 'networkidle2',
  timeout: 30000 
});
```

**3. Close Browser Resources**

```typescript
const browser = await puppeteer.launch();
try {
  // Scraping code
} finally {
  await browser.close();
}
```

**4. Respect Robots.txt**

Check robots.txt before scraping new sources.

---

## Pull Request Process

### Before Submitting

**Checklist:**

- [ ] Code passes TypeScript type checking (`pnpm typecheck`)
- [ ] All tests pass (`pnpm test`)
- [ ] New features have tests
- [ ] Code is formatted (`pnpm format`)
- [ ] Documentation is updated
- [ ] todo.md is updated
- [ ] Commit messages follow conventions
- [ ] No console.log or debug code remains

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe testing performed

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] todo.md updated
```

### Review Process

1. Submit PR with descriptive title and description
2. Automated checks run (tests, type checking)
3. Code review by maintainer
4. Address feedback
5. Approval and merge

---

## Questions and Support

### Getting Help

- **Documentation**: Check README.md and ARCHITECTURE.md first
- **Issues**: Search existing GitHub issues
- **Discussions**: Use GitHub Discussions for questions
- **Code Examples**: Review test files for usage patterns

### For AI Assistants

When uncertain about implementation:

1. Reference the architecture documentation
2. Check existing similar implementations
3. Ask the user for clarification
4. Propose multiple approaches with trade-offs
5. Implement the confirmed approach

---

## License

This project is proprietary software. All contributions are subject to the project license.

---

**Thank you for contributing to Super Scrubber!**

*Making real estate prospecting intelligent, efficient, and effective.*
