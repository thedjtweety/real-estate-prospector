# Super Scrubber Architecture

**System Design & Technical Implementation**

This document provides a comprehensive overview of the Super Scrubber architecture, data flow, key components, and implementation details for developers and AI assistants working on the project.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Data Flow](#data-flow)
4. [Core Components](#core-components)
5. [Database Schema](#database-schema)
6. [API Design](#api-design)
7. [Scraping Engine](#scraping-engine)
8. [Decision-Maker Intelligence](#decision-maker-intelligence)
9. [MLS Intelligence](#mls-intelligence)
10. [Frontend Architecture](#frontend-architecture)
11. [Performance Considerations](#performance-considerations)
12. [Security](#security)

---

## System Overview

Super Scrubber is a full-stack TypeScript application built on a modern web architecture. The system transforms minimal business information into comprehensive prospecting intelligence through a multi-stage enrichment pipeline that combines web scraping, AI processing, and intelligent data aggregation.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Search Form  │  │   Results    │  │   History    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │ tRPC (Type-Safe API)
┌────────────────────────┴────────────────────────────────────┐
│                    Backend (Express + tRPC)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Routers    │  │   Services   │  │  Database    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                    External Services                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Manus Search │  │  Puppeteer   │  │     LLM      │      │
│  │     API      │  │   Browser    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend Stack

The frontend is built with React 19 and TypeScript, providing a type-safe, component-based UI architecture.

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19 | UI framework with modern hooks and concurrent features |
| TypeScript | 5.x | Type safety and developer experience |
| Tailwind CSS | 4 | Utility-first styling with custom design tokens |
| tRPC Client | 11 | Type-safe API client with automatic type inference |
| Wouter | 3.x | Lightweight client-side routing |
| shadcn/ui | Latest | Accessible, customizable component library |
| React Hook Form | 7.x | Form state management with validation |
| Zod | 3.x | Schema validation and type inference |

### Backend Stack

The backend uses Express with tRPC for type-safe API procedures and integrates multiple external services.

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 22.13.0 | JavaScript runtime |
| Express | 4.x | Web server framework |
| tRPC | 11 | End-to-end type-safe API layer |
| TypeScript | 5.x | Type safety across the stack |
| Puppeteer | Latest | Headless browser automation |
| Drizzle ORM | Latest | Type-safe database queries |
| PostgreSQL | 14+ | Relational database |
| Zod | 3.x | Runtime validation |

### Infrastructure

| Service | Purpose |
|---------|---------|
| Manus Platform | OAuth, search API, hosting, LLM integration |
| PostgreSQL | Primary data storage |
| Puppeteer | Browser automation for deep scraping |

---

## Data Flow

### Search Request Flow

The following diagram illustrates the complete data flow from user input to results display:

```
User Input (Form)
    ↓
tRPC: prospect.search
    ↓
┌─────────────────────────────────────────────────────┐
│          Enhanced Scraper Service                    │
│                                                      │
│  1. Input Validation & Normalization                │
│     ↓                                                │
│  2. Reverse Lookup Strategy                         │
│     • Email → Domain extraction                     │
│     • Phone → Area code mapping                     │
│     • State → NAR directory search                  │
│     ↓                                                │
│  3. Multi-Source Search                             │
│     • Google Search (Manus API)                     │
│     • NAR Directory                                 │
│     • LinkedIn                                      │
│     ↓                                                │
│  4. Deep Website Scraping (Puppeteer)               │
│     • About Us page                                 │
│     • Team page                                     │
│     • Contact page                                  │
│     ↓                                                │
│  5. Data Extraction & Parsing                       │
│     • Regex patterns for phones/emails              │
│     • Role detection from titles                    │
│     • Address extraction                            │
│     ↓                                                │
│  6. LLM Processing                                  │
│     • Contact deduplication                         │
│     • Role categorization                           │
│     • Missing data inference                        │
│     ↓                                                │
│  7. MLS Intelligence                                │
│     • Geographic mapping (ZIP/city/county)          │
│     • RESO database lookup                          │
│     • Confidence scoring                            │
│     ↓                                                │
│  8. Decision-Maker Analysis                         │
│     • Scoring (0-100)                               │
│     • Approach order ranking                        │
│     • Gatekeeper detection                          │
│     • Influence scoring                             │
│     ↓                                                │
│  9. Foot-in-the-Door Intelligence                   │
│     • Warm intro path detection                     │
│     • Pain point identification                     │
│     • Conversation starter generation               │
│     • Technology stack detection                    │
│     ↓                                                │
│ 10. Database Storage                                │
│     • Business record                               │
│     • Contact records                               │
│     • MLS associations                              │
│     • Search history                                │
└─────────────────────────────────────────────────────┘
    ↓
tRPC: results.getSearchResult
    ↓
Frontend Results Display
```

### Progress Tracking Flow

Real-time progress updates use a polling mechanism:

```
Frontend (SearchProgress Component)
    ↓
tRPC: progress.getProgress (polls every 1 second)
    ↓
Progress Store (Map<searchId, ProgressUpdate>)
    ↑
emitProgress() called from scraper stages
```

---

## Core Components

### Backend Services

#### 1. Enhanced Scraper (`server/services/enhancedScraper.ts`)

The core scraping engine that orchestrates the entire data gathering process. This service implements the multi-stage enrichment pipeline and coordinates all other services.

**Key Functions:**
- `searchBusiness(params)`: Main entry point for business searches
- `reverseEmailLookup(email)`: Extracts domain and finds business website
- `reversePhoneLookup(phone)`: Maps area code to location
- `searchGoogleForBusiness(query)`: Queries Manus search API
- `scrapeWebsiteWithPuppeteer(url)`: Deep website scraping
- `extractContactsFromText(text)`: Regex-based contact extraction

#### 2. MLS Intelligence (`server/services/mlsIntelligence.ts`)

Identifies MLS and association memberships using the RESO database with 500+ organizations.

**Key Functions:**
- `identifyMLSAssociations(business)`: Main MLS identification
- `getMLSByZipCode(zipCode)`: ZIP code → Local MLS mapping
- `getMLSByCity(city, state)`: City → Primary MLS lookup
- `getStateAssociation(state)`: State association identification
- `scrapeNARForMLS(businessName)`: NAR directory verification

**Data Sources:**
- RESO MLS database (hardcoded in service)
- NAR directory scraping
- Business website text analysis
- Geographic mapping tables

#### 3. Decision-Maker Intelligence (`server/services/decisionMakerIntelligence.ts`)

Analyzes contacts to identify decision-makers and provides scoring.

**Key Functions:**
- `analyzeContactRole(params)`: Role detection from title/email/bio
- `scoreDecisionMaker(contact)`: Calculates 0-100 decision-maker score
- `determineApproachOrder(contacts)`: Ranks contacts by priority
- `detectGatekeeper(contact)`: Identifies assistants vs. decision-makers
- `buildOrganizationalHierarchy(contacts)`: Creates org chart structure

**Scoring Algorithm:**
```
Base Score:
- Broker/Owner: 90-100
- Office Manager: 70-85
- Transaction Coordinator: 60-75
- Agent: 40-55
- Assistant: 20-35

Modifiers:
+ NAR Designations: +5 per designation
+ Association Leadership: +10
+ Years in Role: +1 per year (max +10)
+ LinkedIn Connections: +5 if 500+
```

#### 4. Foot-in-the-Door Intelligence (`server/services/footInDoorIntelligence.ts`)

Generates conversation starters and relationship-building insights.

**Key Functions:**
- `findWarmIntroPaths(contact)`: LinkedIn connection analysis
- `identifyRecentAchievements(business)`: News and awards scraping
- `identifyPainPoints(business)`: Review and complaint analysis
- `generateConversationStarters(business, contacts)`: LLM-powered openers
- `detectTechnologyStack(website)`: CRM and tool identification

#### 5. Association Leadership (`server/services/associationLeadership.ts`)

Scrapes MLS board positions and calculates influence scores.

**Key Functions:**
- `scrapeAssociationLeadership(contact, mlsAssociations)`: Board position scraping
- `calculateInfluenceScore(contact)`: 0-100 influence score
- `identifyNetworkingOpportunities(contact)`: Event and committee identification

#### 6. Progress Tracker (`server/services/progressTracker.ts`)

Manages real-time progress updates during searches.

**Key Functions:**
- `emitProgress(searchId, update)`: Emits progress events
- Progress stages: Initializing, Searching, Scraping, Identifying MLS, Cross-referencing, Calculating confidence, Analyzing decision-makers, Finalizing

---

## Database Schema

### Entity Relationship Diagram

```
┌──────────────┐         ┌──────────────┐
│   users      │         │  businesses  │
│──────────────│         │──────────────│
│ id (PK)      │         │ id (PK)      │
│ openId       │         │ name         │
│ name         │         │ phone        │
│ email        │         │ email        │
│ role         │         │ website      │
└──────────────┘         │ address      │
                         │ city         │
                         │ state        │
                         │ zipCode      │
                         │ verified     │
                         │ verificationScore │
                         │ dataSource   │
                         │ technologyStack │
                         │ conversationStarters │
                         └──────┬───────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
            ┌───────▼───────┐      ┌───────▼───────┐
            │   contacts    │      │mlsAssociations│
            │───────────────│      │───────────────│
            │ id (PK)       │      │ id (PK)       │
            │ businessId(FK)│      │ businessId(FK)│
            │ name          │      │ name          │
            │ title         │      │ type          │
            │ email         │      │ state         │
            │ phone         │      │ confidence    │
            │ role          │      └───────────────┘
            │ isPrimary     │
            │ roleConfidence│
            │ decisionMakerScore │
            │ approachOrder │
            │ isGatekeeper  │
            │ seniorityLevel│
            │ bestContactMethod │
            │ linkedInUrl   │
            │ narDesignations │
            │ warmIntroPath │
            │ recentAchievements │
            │ painPoints    │
            │ influenceScore│
            └───────────────┘

┌──────────────┐         ┌──────────────┐
│  searches    │         │notifications │
│──────────────│         │──────────────│
│ id (PK)      │         │ id (PK)      │
│ userId (FK)  │         │ userId (FK)  │
│ businessId(FK)│        │ title        │
│ searchParams │         │ message      │
│ timestamp    │         │ type         │
└──────────────┘         │ isRead       │
                         │ createdAt    │
                         └──────────────┘
```

### Key Tables

#### businesses

Stores brokerage and business information.

```sql
CREATE TABLE businesses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(500),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zipCode VARCHAR(10),
  verified BOOLEAN DEFAULT false,
  verificationScore DECIMAL(3,2),
  dataSource TEXT,
  technologyStack JSONB,
  conversationStarters JSONB,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### contacts

Stores individual contacts with decision-maker intelligence.

```sql
CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  businessId INTEGER REFERENCES businesses(id),
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  role VARCHAR(50),
  isPrimary BOOLEAN DEFAULT false,
  roleConfidence DECIMAL(3,2),
  decisionMakerScore INTEGER,
  approachOrder INTEGER,
  isGatekeeper BOOLEAN DEFAULT false,
  seniorityLevel VARCHAR(50),
  bestContactMethod VARCHAR(50),
  linkedInUrl VARCHAR(500),
  narDesignations JSONB,
  warmIntroPath TEXT,
  recentAchievements JSONB,
  painPoints JSONB,
  influenceScore INTEGER,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

---

## API Design

### tRPC Router Structure

```
appRouter
├── auth
│   ├── me (query)
│   └── logout (mutation)
├── prospect
│   └── search (mutation)
├── results
│   └── getSearchResult (query)
├── history
│   ├── getSearchHistory (query)
│   └── getRecentSearches (query)
├── prospects
│   ├── getSavedProspects (query)
│   ├── saveProspect (mutation)
│   └── removeSavedProspect (mutation)
├── notifications
│   ├── getUserNotifications (query)
│   ├── markAsRead (mutation)
│   └── markAllAsRead (mutation)
└── progress
    └── getProgress (query)
```

### Key API Procedures

#### prospect.search

**Type**: Mutation  
**Input**: `{ name?, phone?, email?, website?, address?, city?, state?, zipCode? }`  
**Output**: `{ searchId: number, message: string }`

Initiates a business search with minimal required fields. At least one field must be provided.

#### results.getSearchResult

**Type**: Query  
**Input**: `{ searchId: number }`  
**Output**: `{ business, contacts[], mlsAssociations[] }`

Retrieves complete search results including business info, contacts with decision-maker intelligence, and MLS associations.

#### progress.getProgress

**Type**: Query (polled every 1 second)  
**Input**: `{ searchId: string }`  
**Output**: `{ stage, status, message, percentage, timestamp }`

Returns current progress for an active search. Used for real-time UI updates.

---

## Scraping Engine

### Puppeteer Implementation

The scraping engine uses Puppeteer for headless browser automation to navigate and extract data from business websites.

**Key Features:**
- Headless Chrome with stealth mode
- Automatic page discovery (About, Team, Contact)
- JavaScript rendering support
- Cookie and session handling
- Timeout and retry logic

**Scraping Workflow:**

```javascript
async function scrapeWebsiteWithPuppeteer(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // 1. Navigate to homepage
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  // 2. Extract homepage content
  const homeContent = await page.content();
  
  // 3. Find About/Team/Contact page links
  const links = await page.$$eval('a', anchors => 
    anchors.map(a => ({ href: a.href, text: a.textContent }))
  );
  
  const aboutLink = links.find(l => /about|team|staff|contact/i.test(l.text));
  
  // 4. Navigate to discovered pages
  if (aboutLink) {
    await page.goto(aboutLink.href);
    const aboutContent = await page.content();
    // Extract contacts from about page
  }
  
  await browser.close();
}
```

### Data Extraction Patterns

**Phone Numbers:**
```regex
/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g
```

**Email Addresses:**
```regex
/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
```

**Addresses:**
```regex
/\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln)/gi
```

**Role Detection:**
```regex
/\b(broker|owner|office manager|transaction coordinator|agent|assistant)\b/i
```

---

## Decision-Maker Intelligence

### Scoring Algorithm

The decision-maker scoring system uses a multi-factor algorithm to calculate a 0-100 score for each contact.

**Base Score by Role:**

| Role | Base Score |
|------|------------|
| Broker | 95 |
| Owner | 95 |
| Office Manager | 75 |
| Transaction Coordinator | 65 |
| Agent | 45 |
| Assistant | 25 |

**Score Modifiers:**

```typescript
function scoreDecisionMaker(contact: Contact): number {
  let score = getBaseScore(contact.role);
  
  // NAR Designations
  if (contact.narDesignations?.length > 0) {
    score += contact.narDesignations.length * 5;
  }
  
  // Association Leadership
  if (contact.associationRoles?.length > 0) {
    score += 10;
  }
  
  // Years in Role
  if (contact.yearsInRole) {
    score += Math.min(contact.yearsInRole, 10);
  }
  
  // LinkedIn Connections
  if (contact.linkedInConnections && contact.linkedInConnections > 500) {
    score += 5;
  }
  
  // Email Pattern (broker@, owner@)
  if (contact.email && /^(broker|owner|ceo|president)@/.test(contact.email)) {
    score += 5;
  }
  
  return Math.min(score, 100);
}
```

### Approach Order Determination

Contacts are ranked by priority using a multi-criteria algorithm:

```typescript
function determineApproachOrder(contacts: Contact[]): Contact[] {
  return contacts
    .map(c => ({
      ...c,
      priorityScore: calculatePriorityScore(c)
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .map((c, index) => ({
      ...c,
      approachOrder: index + 1
    }));
}

function calculatePriorityScore(contact: Contact): number {
  let score = contact.decisionMakerScore;
  
  // Prefer primary contacts
  if (contact.isPrimary) score += 20;
  
  // Prefer contacts with email
  if (contact.email) score += 10;
  
  // Prefer contacts with LinkedIn
  if (contact.linkedInUrl) score += 5;
  
  // Penalize gatekeepers
  if (contact.isGatekeeper) score -= 30;
  
  return score;
}
```

---

## MLS Intelligence

### RESO Database Structure

The MLS intelligence system uses a hardcoded RESO database with 500+ MLS organizations organized by state and region.

**Data Structure:**

```typescript
const MLS_DATABASE = {
  FL: {
    state: "Florida",
    stateAssociation: "Florida Realtors",
    regions: [
      {
        name: "Miami Association of Realtors",
        type: "local",
        coverage: ["Miami", "Miami Beach", "Coral Gables"],
        zipCodes: ["33101", "33109", "33134", ...]
      },
      {
        name: "Northeast Florida Association of Realtors",
        type: "local",
        coverage: ["Jacksonville", "St. Augustine"],
        zipCodes: ["32202", "32204", ...]
      }
    ]
  },
  // ... more states
};
```

### Geographic Mapping

MLS identification uses a three-tier geographic mapping system:

**1. ZIP Code → Local MLS (Highest Confidence)**

```typescript
function getMLSByZipCode(zipCode: string): MLS | null {
  for (const state of Object.values(MLS_DATABASE)) {
    for (const region of state.regions) {
      if (region.zipCodes.includes(zipCode)) {
        return {
          name: region.name,
          type: "local",
          state: state.state,
          confidence: "high"
        };
      }
    }
  }
  return null;
}
```

**2. City → Primary MLS (Medium Confidence)**

```typescript
function getMLSByCity(city: string, state: string): MLS | null {
  const stateData = MLS_DATABASE[state];
  if (!stateData) return null;
  
  for (const region of stateData.regions) {
    if (region.coverage.includes(city)) {
      return {
        name: region.name,
        type: "local",
        state: stateData.state,
        confidence: "medium"
      };
    }
  }
  return null;
}
```

**3. State → State Association (Low Confidence)**

```typescript
function getStateAssociation(state: string): MLS {
  const stateData = MLS_DATABASE[state];
  return {
    name: stateData.stateAssociation,
    type: "state",
    state: stateData.state,
    confidence: "inferred"
  };
}
```

---

## Frontend Architecture

### Component Structure

```
client/src/
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── SearchProgress.tsx     # Real-time progress display
│   └── DashboardLayout.tsx    # Main layout wrapper
├── pages/
│   ├── Home.tsx               # Search form and results
│   ├── History.tsx            # Search history
│   ├── Prospects.tsx          # Saved prospects
│   └── Notifications.tsx      # Notification center
├── contexts/
│   └── ThemeContext.tsx       # Dark/light theme
├── hooks/
│   └── useMobile.tsx          # Responsive breakpoints
└── lib/
    └── trpc.ts                # tRPC client setup
```

### State Management

Super Scrubber uses a combination of React hooks and tRPC for state management:

**Server State (tRPC):**
- Search results
- Search history
- Saved prospects
- Notifications
- Progress updates

**Local State (React Hooks):**
- Form inputs
- UI toggles
- Loading states
- Temporary data

**Example: Search Form State**

```typescript
const [searchResult, setSearchResult] = useState<any>(null);
const [isSearching, setIsSearching] = useState(false);

const searchMutation = trpc.prospect.search.useMutation({
  onSuccess: async (data) => {
    const results = await trpcUtils.results.getSearchResult.fetch({ 
      searchId: data.searchId 
    });
    setSearchResult(results);
    setIsSearching(false);
  }
});
```

### Styling System

**Tailwind Configuration:**

```javascript
// Custom color tokens
colors: {
  navy: {
    50: 'oklch(0.95 0.02 250)',
    600: 'oklch(0.40 0.10 250)',
    700: 'oklch(0.35 0.12 250)',
    900: 'oklch(0.25 0.15 250)',
  },
  gold: {
    50: 'oklch(0.95 0.05 75)',
    500: 'oklch(0.70 0.20 75)',
    600: 'oklch(0.65 0.22 75)',
  }
}
```

**Design Tokens:**
- Font: Playfair Display (headings), Inter (body)
- Spacing: 4px base unit
- Border radius: 0.5rem default
- Shadows: Subtle elevation system

---

## Performance Considerations

### Scraping Optimization

**1. Parallel Requests**

Multiple sources are scraped in parallel using `Promise.all()`:

```typescript
const [googleResults, narResults, linkedInResults] = await Promise.all([
  searchGoogle(query),
  scrapeNARDirectory(businessName),
  searchLinkedIn(businessName)
]);
```

**2. Timeout Management**

All scraping operations have configurable timeouts:

```typescript
const page = await browser.newPage();
await page.goto(url, { 
  waitUntil: 'networkidle2',
  timeout: 30000 // 30 seconds
});
```

**3. Caching Strategy**

Search results are cached in the database to avoid redundant scraping:

```typescript
// Check for existing business
const existing = await db.businesses.findByNameAndLocation(name, state);
if (existing && isFresh(existing.updatedAt)) {
  return existing;
}
```

### Database Optimization

**Indexes:**

```sql
CREATE INDEX idx_businesses_name ON businesses(name);
CREATE INDEX idx_businesses_state ON businesses(state);
CREATE INDEX idx_contacts_business_id ON contacts(businessId);
CREATE INDEX idx_searches_user_id ON searches(userId);
```

**Query Optimization:**

```typescript
// Use joins to fetch related data in one query
const results = await db.businesses
  .findById(businessId)
  .include({
    contacts: true,
    mlsAssociations: true
  });
```

### Frontend Performance

**1. Code Splitting**

Routes are lazy-loaded to reduce initial bundle size:

```typescript
const History = lazy(() => import('./pages/History'));
const Prospects = lazy(() => import('./pages/Prospects'));
```

**2. Polling Optimization**

Progress polling stops when search completes:

```typescript
const { data } = trpc.progress.getProgress.useQuery(
  { searchId },
  { 
    refetchInterval: isComplete ? false : 1000,
    enabled: !isComplete 
  }
);
```

---

## Security

### Authentication

**OAuth Flow:**

```
User → Login Button → Manus OAuth Portal → Callback → Session Cookie → Protected Routes
```

**Session Management:**

```typescript
// Session cookie with secure flags
const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};
```

### Data Protection

**1. Input Validation**

All inputs are validated with Zod schemas:

```typescript
const searchSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  // ...
}).refine(data => Object.values(data).some(val => val && val !== ""), {
  message: "At least one field must be filled"
});
```

**2. SQL Injection Prevention**

Drizzle ORM provides parameterized queries:

```typescript
// Safe from SQL injection
const business = await db.businesses.findFirst({
  where: eq(businesses.name, userInput)
});
```

**3. XSS Prevention**

React automatically escapes output, but additional sanitization is applied to scraped content:

```typescript
import DOMPurify from 'dompurify';

const sanitized = DOMPurify.sanitize(scrapedContent);
```

### Rate Limiting

**API Rate Limits:**

```typescript
// Limit search requests per user
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10 // 10 searches per window
});
```

---

## Deployment

### Environment Variables

Required environment variables for deployment:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Authentication
JWT_SECRET=your-secret-key
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im

# Manus Platform
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-key
```

### Build Process

```bash
# Install dependencies
pnpm install

# Build frontend
pnpm build:client

# Build backend
pnpm build:server

# Start production server
pnpm start
```

---

## Future Improvements

### Planned Enhancements

1. **Real-time WebSocket Support**: Replace polling with WebSocket subscriptions for instant progress updates
2. **Bulk Upload**: CSV import for batch processing of multiple businesses
3. **CRM Integration**: Direct export to Salesforce, HubSpot, and other CRMs
4. **PDF Report Generation**: Downloadable intelligence reports
5. **Email Template Generator**: Personalized outreach templates based on intelligence
6. **Chrome Extension**: Browser extension for instant prospecting on any website
7. **Advanced Analytics**: Dashboard with prospecting metrics and success rates
8. **AI-Powered Recommendations**: LLM-generated outreach strategies

### Technical Debt

1. Replace hardcoded MLS database with dynamic API integration
2. Implement Redis caching layer for improved performance
3. Add comprehensive error logging and monitoring
4. Implement retry logic for failed scraping operations
5. Add unit tests for all services (currently at 18 tests)
6. Implement E2E tests with Playwright
7. Add API documentation with OpenAPI/Swagger

---

**Document Version**: 1.0  
**Last Updated**: January 28, 2026  
**Maintained By**: Super Scrubber Development Team
