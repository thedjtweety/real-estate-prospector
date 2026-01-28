# NAR Directory Integration Notes

## Directory URL
https://directories.apps.realtor/?type=office

## Search Capabilities

### Office Search Parameters:
- **Country**: Dropdown (United States, etc.)
- **State**: Dropdown (Any State, Alabama, Alaska, etc.)
- **Office Name**: Text input
- **Designated Realtor First Name**: Text input
- **Designated Realtor Last Name**: Text input
- **Office City**: Text input

### Search Limitations:
- Results limited to first 1000 records
- Requires specific search criteria

## Available Directory Types:
1. **Find a Member** - Individual REALTOR® search
2. **Find an Office** - Brokerage/office search (✓ Primary target)
3. **Find an Association** - State & local associations with MLS info
4. **Commercial Member** - Commercial brokers

## Data Points Available:
- Office/Brokerage name
- Designated Realtor (broker/owner) name
- Office location (city, state)
- Contact information (likely phone, email, address in results)

## Integration Strategy:
1. Use office search to find brokerages by name, city, or state
2. Extract designated realtor information (broker/owner)
3. Cross-reference with "Find an Association" for MLS memberships
4. Parse results page for contact details

## Implementation Approach:
- Build search query constructor
- Parse HTML results page
- Extract structured data from search results
- Handle pagination if needed
- Implement rate limiting to respect NAR servers
