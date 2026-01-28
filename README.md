# Super Scrubber 🧹✨

**Intelligent Real Estate Prospecting Intelligence Platform**

*We clean up your leads... literally!*

Super Scrubber is a comprehensive real estate prospecting tool designed for dotloop/Zillow business consultants to identify key decision-makers (brokers, owners, technology POCs) and discover MLS/association memberships with minimal input. The platform combines multi-source web scraping, AI-powered intelligence, and decision-maker scoring to transform sparse business information into actionable prospecting insights.

---

## 🎯 Purpose

Real estate business consultants need to quickly identify the right contacts at brokerages to sell platforms like dotloop and Zillow. Traditional prospecting methods require extensive manual research across multiple sources. Super Scrubber automates this process by accepting minimal information (just an email, phone number, or state) and performing deep intelligence gathering to identify:

- **Decision-makers**: Brokers, owners, and executives who sign contracts
- **Technology POCs**: Office managers, admins, and transaction coordinators who influence technology decisions
- **MLS Associations**: Both state and local MLS memberships for targeted outreach
- **Foot-in-the-door intelligence**: Warm intro paths, pain points, conversation starters, and recent achievements

---

## ✨ Key Features

### Multi-Source Data Aggregation

Super Scrubber aggregates data from multiple sources to build comprehensive business profiles:

- **Google Search Results**: Scrapes top search results for business information
- **Website Deep Scraping**: Uses Puppeteer to navigate About Us, Team, and Contact pages
- **NAR Directory**: Verifies brokerage information from the National Association of REALTORS
- **LinkedIn**: Extracts company pages and professional profiles
- **Social Media**: Gathers data from Facebook business pages and Twitter
- **RESO MLS Database**: Matches businesses to 500+ MLS organizations by geography

### Intelligent Reverse Lookups

The platform handles sparse inputs through intelligent reverse lookup strategies:

- **Email → Domain → Website**: Extracts domain from email addresses to find business websites
- **Phone → Area Code → Location**: Maps phone numbers to geographic regions for targeted searches
- **State-Only Searches**: Discovers major brokerages and NAR directory listings by state

### Decision-Maker Intelligence System

Advanced contact analysis identifies who to approach and in what order:

| Feature | Description |
|---------|-------------|
| **Decision-Maker Scoring** | 0-100 score indicating authority level and influence |
| **Approach Order** | Ranked priority (1st, 2nd, 3rd) for contact sequence |
| **Role Detection** | Identifies brokers, owners, office managers, TCs, agents, assistants |
| **Gatekeeper Detection** | Flags assistants vs. decision-makers |
| **Influence Scoring** | Measures association involvement and industry presence |
| **Best Contact Method** | Recommends email, phone, or LinkedIn based on availability |

### MLS & Association Intelligence

Comprehensive MLS identification using real RESO database with 500+ organizations:

- **Geographic Mapping**: ZIP code → Local MLS, City → Primary MLS, County-based identification
- **Multi-MLS Support**: Handles brokerages with multiple memberships
- **Confidence Scoring**: Verified (NAR/website), High (geographic match), Medium (state-level), Inferred (fallback)
- **Association Leadership**: Identifies board positions and committee memberships

### Foot-in-the-Door Intelligence

Provides conversation starters and relationship-building insights:

- **Warm Intro Paths**: LinkedIn connection paths to decision-makers
- **Recent Achievements**: Awards, certifications, and milestones for congratulatory outreach
- **Pain Points**: Identified challenges from reviews and complaints
- **Technology Stack**: Current CRM and tools in use for competitive positioning
- **Conversation Starters**: AI-generated opening lines based on business context

### Real-Time Progress Tracking

Live updates during multi-stage scraping process:

1. Searching Google for business information
2. Scraping website content
3. Identifying MLS associations
4. Cross-referencing data sources
5. Calculating confidence scores
6. Analyzing decision-makers
7. Generating intelligence insights
8. Finalizing results

### Team Collaboration

Built for team-based prospecting workflows:

- **Search History**: Shared access to all team searches
- **Saved Prospects**: Bookmark high-value contacts for follow-up
- **Automated Notifications**: Alerts for high-confidence prospects
- **Role-Based Access**: Admin and user roles for team management

---

## 🏗️ Architecture

### Technology Stack

**Frontend**
- React 19 with TypeScript for type-safe UI development
- Tailwind CSS 4 for responsive, utility-first styling
- tRPC for end-to-end type safety between client and server
- Wouter for lightweight client-side routing
- shadcn/ui component library for consistent design

**Backend**
- Node.js with Express 4 for API server
- tRPC 11 for type-safe API procedures
- Puppeteer for headless browser automation
- LLM integration for intelligent data processing
- Manus search API for Google results

**Database**
- PostgreSQL with Drizzle ORM
- Tables: businesses, contacts, mlsAssociations, searches, notifications, users

**Authentication**
- Manus OAuth for secure user authentication
- Session-based authentication with JWT tokens

### System Design

Super Scrubber follows a multi-stage enrichment pipeline:

```
User Input (sparse) → Reverse Lookup → Multi-Source Search → Deep Scraping → 
AI Processing → Confidence Scoring → Decision-Maker Analysis → Results Display
```

Each stage adds layers of intelligence, transforming minimal input into comprehensive prospecting profiles.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 22.13.0 or higher
- PostgreSQL database
- Manus platform account (for OAuth and search API)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd real-estate-prospector

# Install dependencies
pnpm install

# Set up database
pnpm db:push

# Start development server
pnpm dev
```

### Environment Variables

The following environment variables are automatically provided by the Manus platform:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Session cookie signing secret
- `VITE_APP_ID`: Manus OAuth application ID
- `OAUTH_SERVER_URL`: Manus OAuth backend URL
- `VITE_OAUTH_PORTAL_URL`: Manus login portal URL
- `BUILT_IN_FORGE_API_URL`: Manus API endpoint
- `BUILT_IN_FORGE_API_KEY`: API authentication token

### Development Workflow

```bash
# Run tests
pnpm test

# Type checking
pnpm typecheck

# Database migrations
pnpm db:push

# View database
pnpm db:studio
```

---

## 📊 Data Models

### Business

Represents a real estate brokerage or business entity.

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Primary key |
| `name` | string | Business name |
| `phone` | string | Primary phone number |
| `email` | string | Primary email address |
| `website` | string | Business website URL |
| `address` | string | Street address |
| `city` | string | City |
| `state` | string | State abbreviation |
| `zipCode` | string | ZIP code |
| `verified` | boolean | Verification status |
| `verificationScore` | decimal | Confidence score (0-1) |
| `dataSource` | string | Comma-separated data sources |
| `technologyStack` | json | Array of detected tools/CRMs |
| `conversationStarters` | json | Array of conversation openers |

### Contact

Represents an individual at a business (broker, owner, staff).

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Primary key |
| `businessId` | integer | Foreign key to business |
| `name` | string | Contact name |
| `title` | string | Job title |
| `email` | string | Email address |
| `phone` | string | Phone number |
| `role` | enum | broker, owner, office_manager, transaction_coordinator, agent, assistant |
| `isPrimary` | boolean | Primary contact flag |
| `roleConfidence` | decimal | Role detection confidence (0-1) |
| `decisionMakerScore` | integer | Decision-maker score (0-100) |
| `approachOrder` | integer | Contact priority (1, 2, 3...) |
| `isGatekeeper` | boolean | Gatekeeper flag |
| `seniorityLevel` | enum | executive, management, staff, unknown |
| `bestContactMethod` | enum | email, phone, linkedin, unknown |
| `linkedInUrl` | string | LinkedIn profile URL |
| `narDesignations` | json | Array of NAR certifications |
| `warmIntroPath` | string | LinkedIn connection path |
| `recentAchievements` | json | Array of achievements |
| `painPoints` | json | Array of identified pain points |
| `influenceScore` | integer | Industry influence score (0-100) |

### MLSAssociation

Represents MLS or association membership.

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Primary key |
| `businessId` | integer | Foreign key to business |
| `name` | string | MLS/association name |
| `type` | enum | state, local |
| `state` | string | State abbreviation |
| `confidence` | enum | verified, high, medium, inferred |

---

## 🔍 Usage Examples

### Minimal Input Search

**Scenario**: You only have an email address.

```
Input: admin@kwrealty.com
```

Super Scrubber will:
1. Extract domain: `kwrealty.com`
2. Search Google for "kwrealty.com real estate"
3. Scrape the business website
4. Identify it as "Keller Williams Realty"
5. Find broker, owner, and office manager contacts
6. Map to local MLS associations
7. Generate decision-maker scores and conversation starters

### Phone-Only Search

**Scenario**: You only have a phone number.

```
Input: (904) 719-2702
```

Super Scrubber will:
1. Extract area code: 904 (Jacksonville, FL)
2. Search Google for "904 719 2702 real estate"
3. Identify the business and location
4. Perform full intelligence gathering

### State-Only Search

**Scenario**: You want to prospect in a specific state.

```
Input: State = Florida
```

Super Scrubber will:
1. Search NAR directory for Florida brokerages
2. Search Google for "major real estate brokerages Florida"
3. Aggregate results from multiple sources
4. Provide comprehensive listings

---

## 🎨 UI Features

### Color-Coded Priority System

Contacts are displayed with visual priority indicators:

- **Green Border (Score 80+)**: High-priority decision-makers (brokers, owners)
- **Gold Border (Score 60-79)**: Medium-priority influencers (office managers)
- **Blue Border (Score 40-59)**: Lower-priority contacts (staff, assistants)

### Approach Order Badges

Each contact displays a priority badge:

- **⭐ Contact First**: Primary decision-maker
- **2nd Priority**: Secondary contact
- **3rd Priority**: Tertiary contact

### Decision-Maker Score Circle

Large circular badge showing 0-100 score with color-coded background matching the border priority system.

### Intelligence Sections

- **Warm Intro Paths**: Highlighted in green boxes
- **Recent Achievements**: Bulleted list for congratulatory messaging
- **Pain Points**: Bulleted list for problem-solving positioning
- **Technology Stack**: Badge display of current tools
- **Conversation Starters**: Highlighted cards with AI-generated openers

---

## 🧪 Testing

Super Scrubber includes comprehensive test coverage:

```bash
# Run all tests
pnpm test

# Test files
server/auth.logout.test.ts          # Authentication tests
server/prospect.search.test.ts      # Search functionality tests
server/results.test.ts              # Results retrieval tests
server/notifications.test.ts        # Notification system tests
```

**Current Status**: 18 tests passing

---

## 🤝 Contributing

We welcome contributions from developers and AI assistants! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

### For AI Assistants (Claude, GPT, etc.)

This project is designed to be AI-assistant-friendly. Key information for effective collaboration:

1. **Read ARCHITECTURE.md** for system design and data flow understanding
2. **Check todo.md** for current tasks and priorities
3. **Review test files** to understand expected behavior
4. **Follow tRPC patterns** for type-safe API development
5. **Use Drizzle ORM** for all database operations
6. **Write tests first** for new features (TDD approach)

---

## 📝 Project Status

**Current Version**: v3.1 (Enhanced Results Display with Decision-Maker Intelligence)

**Recent Updates**:
- ✅ Fixed tRPC subscription error (replaced with polling)
- ✅ Enhanced results UI with color-coded priority system
- ✅ Added decision-maker scores and approach order badges
- ✅ Implemented foot-in-the-door intelligence
- ✅ Added technology stack detection
- ✅ Created conversation starters system

**Known Limitations**:
- Real NAR directory API integration pending (currently uses web scraping)
- LinkedIn data extraction limited to public profiles
- MLS database requires periodic updates for new organizations

---

## 🔒 Security & Privacy

- All user data is stored securely in PostgreSQL with encrypted connections
- OAuth authentication via Manus platform ensures secure access
- No third-party data sharing without explicit consent
- Session-based authentication with JWT tokens
- API keys and secrets managed via environment variables

---

## 📄 License

This project is proprietary software developed for dotloop/Zillow business consultants.

---

## 🙏 Acknowledgments

- **Manus Platform** for OAuth, search API, and hosting infrastructure
- **RESO** for MLS database standards
- **National Association of REALTORS (NAR)** for directory data
- **shadcn/ui** for beautiful, accessible UI components

---

## 📞 Support

For questions, issues, or feature requests, please contact the development team or open an issue on GitHub.

---

**Built with ❤️ by the Super Scrubber team**

*Making real estate prospecting intelligent, efficient, and effective.*
