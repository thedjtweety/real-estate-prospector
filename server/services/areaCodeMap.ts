/**
 * Comprehensive US/Canada area code to location mapping
 * Data source: North American Numbering Plan Administration (NANPA)
 */

export interface AreaCodeLocation {
  code: string;
  city?: string;
  state: string;
  country: string;
}

export const areaCodeMap: Record<string, AreaCodeLocation> = {
  // Alabama
  '205': { code: '205', city: 'Birmingham', state: 'AL', country: 'US' },
  '251': { code: '251', city: 'Mobile', state: 'AL', country: 'US' },
  '256': { code: '256', city: 'Huntsville', state: 'AL', country: 'US' },
  '334': { code: '334', city: 'Montgomery', state: 'AL', country: 'US' },
  
  // Alaska
  '907': { code: '907', city: 'Anchorage', state: 'AK', country: 'US' },
  
  // Arizona
  '480': { code: '480', city: 'Scottsdale', state: 'AZ', country: 'US' },
  '520': { code: '520', city: 'Tucson', state: 'AZ', country: 'US' },
  '602': { code: '602', city: 'Phoenix', state: 'AZ', country: 'US' },
  '623': { code: '623', city: 'Glendale', state: 'AZ', country: 'US' },
  '928': { code: '928', city: 'Flagstaff', state: 'AZ', country: 'US' },
  
  // Arkansas
  '479': { code: '479', city: 'Fayetteville', state: 'AR', country: 'US' },
  '501': { code: '501', city: 'Little Rock', state: 'AR', country: 'US' },
  '870': { code: '870', city: 'Jonesboro', state: 'AR', country: 'US' },
  
  // California
  '209': { code: '209', city: 'Stockton', state: 'CA', country: 'US' },
  '213': { code: '213', city: 'Los Angeles', state: 'CA', country: 'US' },
  '310': { code: '310', city: 'Los Angeles', state: 'CA', country: 'US' },
  '323': { code: '323', city: 'Los Angeles', state: 'CA', country: 'US' },
  '408': { code: '408', city: 'San Jose', state: 'CA', country: 'US' },
  '415': { code: '415', city: 'San Francisco', state: 'CA', country: 'US' },
  '510': { code: '510', city: 'Oakland', state: 'CA', country: 'US' },
  '562': { code: '562', city: 'Long Beach', state: 'CA', country: 'US' },
  '619': { code: '619', city: 'San Diego', state: 'CA', country: 'US' },
  '626': { code: '626', city: 'Pasadena', state: 'CA', country: 'US' },
  '650': { code: '650', city: 'San Mateo', state: 'CA', country: 'US' },
  '657': { code: '657', city: 'Anaheim', state: 'CA', country: 'US' },
  '661': { code: '661', city: 'Bakersfield', state: 'CA', country: 'US' },
  '707': { code: '707', city: 'Santa Rosa', state: 'CA', country: 'US' },
  '714': { code: '714', city: 'Anaheim', state: 'CA', country: 'US' },
  '760': { code: '760', city: 'Oceanside', state: 'CA', country: 'US' },
  '805': { code: '805', city: 'Oxnard', state: 'CA', country: 'US' },
  '818': { code: '818', city: 'Burbank', state: 'CA', country: 'US' },
  '831': { code: '831', city: 'Salinas', state: 'CA', country: 'US' },
  '858': { code: '858', city: 'San Diego', state: 'CA', country: 'US' },
  '909': { code: '909', city: 'San Bernardino', state: 'CA', country: 'US' },
  '916': { code: '916', city: 'Sacramento', state: 'CA', country: 'US' },
  '925': { code: '925', city: 'Concord', state: 'CA', country: 'US' },
  '949': { code: '949', city: 'Irvine', state: 'CA', country: 'US' },
  '951': { code: '951', city: 'Riverside', state: 'CA', country: 'US' },
  
  // Colorado
  '303': { code: '303', city: 'Denver', state: 'CO', country: 'US' },
  '719': { code: '719', city: 'Colorado Springs', state: 'CO', country: 'US' },
  '720': { code: '720', city: 'Denver', state: 'CO', country: 'US' },
  '970': { code: '970', city: 'Fort Collins', state: 'CO', country: 'US' },
  
  // Connecticut
  '203': { code: '203', city: 'New Haven', state: 'CT', country: 'US' },
  '475': { code: '475', city: 'Bridgeport', state: 'CT', country: 'US' },
  '860': { code: '860', city: 'Hartford', state: 'CT', country: 'US' },
  
  // Delaware
  '302': { code: '302', city: 'Wilmington', state: 'DE', country: 'US' },
  
  // Florida
  '239': { code: '239', city: 'Fort Myers', state: 'FL', country: 'US' },
  '305': { code: '305', city: 'Miami', state: 'FL', country: 'US' },
  '321': { code: '321', city: 'Orlando', state: 'FL', country: 'US' },
  '352': { code: '352', city: 'Gainesville', state: 'FL', country: 'US' },
  '386': { code: '386', city: 'Daytona Beach', state: 'FL', country: 'US' },
  '407': { code: '407', city: 'Orlando', state: 'FL', country: 'US' },
  '561': { code: '561', city: 'West Palm Beach', state: 'FL', country: 'US' },
  '727': { code: '727', city: 'St. Petersburg', state: 'FL', country: 'US' },
  '754': { code: '754', city: 'Fort Lauderdale', state: 'FL', country: 'US' },
  '772': { code: '772', city: 'Port St. Lucie', state: 'FL', country: 'US' },
  '786': { code: '786', city: 'Miami', state: 'FL', country: 'US' },
  '813': { code: '813', city: 'Tampa', state: 'FL', country: 'US' },
  '850': { code: '850', city: 'Tallahassee', state: 'FL', country: 'US' },
  '863': { code: '863', city: 'Lakeland', state: 'FL', country: 'US' },
  '904': { code: '904', city: 'Jacksonville', state: 'FL', country: 'US' },
  '941': { code: '941', city: 'Sarasota', state: 'FL', country: 'US' },
  '954': { code: '954', city: 'Fort Lauderdale', state: 'FL', country: 'US' },
  
  // Georgia
  '229': { code: '229', city: 'Albany', state: 'GA', country: 'US' },
  '404': { code: '404', city: 'Atlanta', state: 'GA', country: 'US' },
  '470': { code: '470', city: 'Atlanta', state: 'GA', country: 'US' },
  '478': { code: '478', city: 'Macon', state: 'GA', country: 'US' },
  '678': { code: '678', city: 'Atlanta', state: 'GA', country: 'US' },
  '706': { code: '706', city: 'Augusta', state: 'GA', country: 'US' },
  '762': { code: '762', city: 'Augusta', state: 'GA', country: 'US' },
  '770': { code: '770', city: 'Atlanta', state: 'GA', country: 'US' },
  '912': { code: '912', city: 'Savannah', state: 'GA', country: 'US' },
  
  // Hawaii
  '808': { code: '808', city: 'Honolulu', state: 'HI', country: 'US' },
  
  // Idaho
  '208': { code: '208', city: 'Boise', state: 'ID', country: 'US' },
  
  // Illinois
  '217': { code: '217', city: 'Springfield', state: 'IL', country: 'US' },
  '224': { code: '224', city: 'Evanston', state: 'IL', country: 'US' },
  '309': { code: '309', city: 'Peoria', state: 'IL', country: 'US' },
  '312': { code: '312', city: 'Chicago', state: 'IL', country: 'US' },
  '618': { code: '618', city: 'Belleville', state: 'IL', country: 'US' },
  '630': { code: '630', city: 'Aurora', state: 'IL', country: 'US' },
  '708': { code: '708', city: 'Cicero', state: 'IL', country: 'US' },
  '773': { code: '773', city: 'Chicago', state: 'IL', country: 'US' },
  '815': { code: '815', city: 'Rockford', state: 'IL', country: 'US' },
  '847': { code: '847', city: 'Evanston', state: 'IL', country: 'US' },
  
  // Indiana
  '219': { code: '219', city: 'Gary', state: 'IN', country: 'US' },
  '260': { code: '260', city: 'Fort Wayne', state: 'IN', country: 'US' },
  '317': { code: '317', city: 'Indianapolis', state: 'IN', country: 'US' },
  '574': { code: '574', city: 'South Bend', state: 'IN', country: 'US' },
  '765': { code: '765', city: 'Muncie', state: 'IN', country: 'US' },
  '812': { code: '812', city: 'Evansville', state: 'IN', country: 'US' },
  
  // Iowa
  '319': { code: '319', city: 'Cedar Rapids', state: 'IA', country: 'US' },
  '515': { code: '515', city: 'Des Moines', state: 'IA', country: 'US' },
  '563': { code: '563', city: 'Davenport', state: 'IA', country: 'US' },
  '712': { code: '712', city: 'Sioux City', state: 'IA', country: 'US' },
  
  // Kansas
  '316': { code: '316', city: 'Wichita', state: 'KS', country: 'US' },
  '620': { code: '620', city: 'Hutchinson', state: 'KS', country: 'US' },
  '785': { code: '785', city: 'Topeka', state: 'KS', country: 'US' },
  '913': { code: '913', city: 'Kansas City', state: 'KS', country: 'US' },
  
  // Kentucky
  '270': { code: '270', city: 'Bowling Green', state: 'KY', country: 'US' },
  '502': { code: '502', city: 'Louisville', state: 'KY', country: 'US' },
  '606': { code: '606', city: 'Ashland', state: 'KY', country: 'US' },
  '859': { code: '859', city: 'Lexington', state: 'KY', country: 'US' },
  
  // Louisiana
  '225': { code: '225', city: 'Baton Rouge', state: 'LA', country: 'US' },
  '318': { code: '318', city: 'Shreveport', state: 'LA', country: 'US' },
  '337': { code: '337', city: 'Lafayette', state: 'LA', country: 'US' },
  '504': { code: '504', city: 'New Orleans', state: 'LA', country: 'US' },
  
  // Maine
  '207': { code: '207', city: 'Portland', state: 'ME', country: 'US' },
  
  // Maryland
  '240': { code: '240', city: 'Rockville', state: 'MD', country: 'US' },
  '301': { code: '301', city: 'Rockville', state: 'MD', country: 'US' },
  '410': { code: '410', city: 'Baltimore', state: 'MD', country: 'US' },
  '443': { code: '443', city: 'Baltimore', state: 'MD', country: 'US' },
  
  // Massachusetts
  '339': { code: '339', city: 'Boston', state: 'MA', country: 'US' },
  '351': { code: '351', city: 'Lowell', state: 'MA', country: 'US' },
  '413': { code: '413', city: 'Springfield', state: 'MA', country: 'US' },
  '508': { code: '508', city: 'Worcester', state: 'MA', country: 'US' },
  '617': { code: '617', city: 'Boston', state: 'MA', country: 'US' },
  '774': { code: '774', city: 'Worcester', state: 'MA', country: 'US' },
  '781': { code: '781', city: 'Lynn', state: 'MA', country: 'US' },
  '857': { code: '857', city: 'Boston', state: 'MA', country: 'US' },
  '978': { code: '978', city: 'Lowell', state: 'MA', country: 'US' },
  
  // Michigan
  '231': { code: '231', city: 'Muskegon', state: 'MI', country: 'US' },
  '248': { code: '248', city: 'Troy', state: 'MI', country: 'US' },
  '269': { code: '269', city: 'Kalamazoo', state: 'MI', country: 'US' },
  '313': { code: '313', city: 'Detroit', state: 'MI', country: 'US' },
  '517': { code: '517', city: 'Lansing', state: 'MI', country: 'US' },
  '586': { code: '586', city: 'Warren', state: 'MI', country: 'US' },
  '616': { code: '616', city: 'Grand Rapids', state: 'MI', country: 'US' },
  '734': { code: '734', city: 'Ann Arbor', state: 'MI', country: 'US' },
  '810': { code: '810', city: 'Flint', state: 'MI', country: 'US' },
  '906': { code: '906', city: 'Marquette', state: 'MI', country: 'US' },
  '947': { code: '947', city: 'Troy', state: 'MI', country: 'US' },
  '989': { code: '989', city: 'Saginaw', state: 'MI', country: 'US' },
  
  // Minnesota
  '218': { code: '218', city: 'Duluth', state: 'MN', country: 'US' },
  '320': { code: '320', city: 'St. Cloud', state: 'MN', country: 'US' },
  '507': { code: '507', city: 'Rochester', state: 'MN', country: 'US' },
  '612': { code: '612', city: 'Minneapolis', state: 'MN', country: 'US' },
  '651': { code: '651', city: 'St. Paul', state: 'MN', country: 'US' },
  '763': { code: '763', city: 'Brooklyn Park', state: 'MN', country: 'US' },
  '952': { code: '952', city: 'Bloomington', state: 'MN', country: 'US' },
  
  // Mississippi
  '228': { code: '228', city: 'Gulfport', state: 'MS', country: 'US' },
  '601': { code: '601', city: 'Jackson', state: 'MS', country: 'US' },
  '662': { code: '662', city: 'Southaven', state: 'MS', country: 'US' },
  
  // Missouri
  '314': { code: '314', city: 'St. Louis', state: 'MO', country: 'US' },
  '417': { code: '417', city: 'Springfield', state: 'MO', country: 'US' },
  '573': { code: '573', city: 'Columbia', state: 'MO', country: 'US' },
  '636': { code: '636', city: 'O\'Fallon', state: 'MO', country: 'US' },
  '660': { code: '660', city: 'Sedalia', state: 'MO', country: 'US' },
  '816': { code: '816', city: 'Kansas City', state: 'MO', country: 'US' },
  
  // Montana
  '406': { code: '406', city: 'Billings', state: 'MT', country: 'US' },
  
  // Nebraska
  '308': { code: '308', city: 'Grand Island', state: 'NE', country: 'US' },
  '402': { code: '402', city: 'Omaha', state: 'NE', country: 'US' },
  
  // Nevada
  '702': { code: '702', city: 'Las Vegas', state: 'NV', country: 'US' },
  '725': { code: '725', city: 'Las Vegas', state: 'NV', country: 'US' },
  '775': { code: '775', city: 'Reno', state: 'NV', country: 'US' },
  
  // New Hampshire
  '603': { code: '603', city: 'Manchester', state: 'NH', country: 'US' },
  
  // New Jersey
  '201': { code: '201', city: 'Jersey City', state: 'NJ', country: 'US' },
  '551': { code: '551', city: 'Jersey City', state: 'NJ', country: 'US' },
  '609': { code: '609', city: 'Trenton', state: 'NJ', country: 'US' },
  '732': { code: '732', city: 'Edison', state: 'NJ', country: 'US' },
  '848': { code: '848', city: 'New Brunswick', state: 'NJ', country: 'US' },
  '856': { code: '856', city: 'Camden', state: 'NJ', country: 'US' },
  '862': { code: '862', city: 'Newark', state: 'NJ', country: 'US' },
  '908': { code: '908', city: 'Elizabeth', state: 'NJ', country: 'US' },
  '973': { code: '973', city: 'Newark', state: 'NJ', country: 'US' },
  
  // New Mexico
  '505': { code: '505', city: 'Albuquerque', state: 'NM', country: 'US' },
  '575': { code: '575', city: 'Las Cruces', state: 'NM', country: 'US' },
  
  // New York
  '212': { code: '212', city: 'New York', state: 'NY', country: 'US' },
  '315': { code: '315', city: 'Syracuse', state: 'NY', country: 'US' },
  '347': { code: '347', city: 'New York', state: 'NY', country: 'US' },
  '516': { code: '516', city: 'Hempstead', state: 'NY', country: 'US' },
  '518': { code: '518', city: 'Albany', state: 'NY', country: 'US' },
  '585': { code: '585', city: 'Rochester', state: 'NY', country: 'US' },
  '607': { code: '607', city: 'Binghamton', state: 'NY', country: 'US' },
  '631': { code: '631', city: 'Islip', state: 'NY', country: 'US' },
  '646': { code: '646', city: 'New York', state: 'NY', country: 'US' },
  '716': { code: '716', city: 'Buffalo', state: 'NY', country: 'US' },
  '718': { code: '718', city: 'New York', state: 'NY', country: 'US' },
  '845': { code: '845', city: 'Yonkers', state: 'NY', country: 'US' },
  '914': { code: '914', city: 'Yonkers', state: 'NY', country: 'US' },
  '917': { code: '917', city: 'New York', state: 'NY', country: 'US' },
  
  // North Carolina
  '252': { code: '252', city: 'Greenville', state: 'NC', country: 'US' },
  '336': { code: '336', city: 'Greensboro', state: 'NC', country: 'US' },
  '704': { code: '704', city: 'Charlotte', state: 'NC', country: 'US' },
  '828': { code: '828', city: 'Asheville', state: 'NC', country: 'US' },
  '910': { code: '910', city: 'Fayetteville', state: 'NC', country: 'US' },
  '919': { code: '919', city: 'Raleigh', state: 'NC', country: 'US' },
  '980': { code: '980', city: 'Charlotte', state: 'NC', country: 'US' },
  
  // North Dakota
  '701': { code: '701', city: 'Fargo', state: 'ND', country: 'US' },
  
  // Ohio
  '216': { code: '216', city: 'Cleveland', state: 'OH', country: 'US' },
  '220': { code: '220', city: 'Newark', state: 'OH', country: 'US' },
  '234': { code: '234', city: 'Akron', state: 'OH', country: 'US' },
  '330': { code: '330', city: 'Akron', state: 'OH', country: 'US' },
  '380': { code: '380', city: 'Columbus', state: 'OH', country: 'US' },
  '419': { code: '419', city: 'Toledo', state: 'OH', country: 'US' },
  '440': { code: '440', city: 'Lorain', state: 'OH', country: 'US' },
  '513': { code: '513', city: 'Cincinnati', state: 'OH', country: 'US' },
  '567': { code: '567', city: 'Toledo', state: 'OH', country: 'US' },
  '614': { code: '614', city: 'Columbus', state: 'OH', country: 'US' },
  '740': { code: '740', city: 'Newark', state: 'OH', country: 'US' },
  '937': { code: '937', city: 'Dayton', state: 'OH', country: 'US' },
  
  // Oklahoma
  '405': { code: '405', city: 'Oklahoma City', state: 'OK', country: 'US' },
  '539': { code: '539', city: 'Tulsa', state: 'OK', country: 'US' },
  '580': { code: '580', city: 'Lawton', state: 'OK', country: 'US' },
  '918': { code: '918', city: 'Tulsa', state: 'OK', country: 'US' },
  
  // Oregon
  '458': { code: '458', city: 'Eugene', state: 'OR', country: 'US' },
  '503': { code: '503', city: 'Portland', state: 'OR', country: 'US' },
  '541': { code: '541', city: 'Eugene', state: 'OR', country: 'US' },
  '971': { code: '971', city: 'Portland', state: 'OR', country: 'US' },
  
  // Pennsylvania
  '215': { code: '215', city: 'Philadelphia', state: 'PA', country: 'US' },
  '267': { code: '267', city: 'Philadelphia', state: 'PA', country: 'US' },
  '272': { code: '272', city: 'Scranton', state: 'PA', country: 'US' },
  '412': { code: '412', city: 'Pittsburgh', state: 'PA', country: 'US' },
  '484': { code: '484', city: 'Allentown', state: 'PA', country: 'US' },
  '570': { code: '570', city: 'Scranton', state: 'PA', country: 'US' },
  '610': { code: '610', city: 'Allentown', state: 'PA', country: 'US' },
  '717': { code: '717', city: 'Harrisburg', state: 'PA', country: 'US' },
  '724': { code: '724', city: 'New Castle', state: 'PA', country: 'US' },
  '814': { code: '814', city: 'Erie', state: 'PA', country: 'US' },
  '878': { code: '878', city: 'Pittsburgh', state: 'PA', country: 'US' },
  
  // Rhode Island
  '401': { code: '401', city: 'Providence', state: 'RI', country: 'US' },
  
  // South Carolina
  '803': { code: '803', city: 'Columbia', state: 'SC', country: 'US' },
  '843': { code: '843', city: 'Charleston', state: 'SC', country: 'US' },
  '854': { code: '854', city: 'Charleston', state: 'SC', country: 'US' },
  '864': { code: '864', city: 'Greenville', state: 'SC', country: 'US' },
  
  // South Dakota
  '605': { code: '605', city: 'Sioux Falls', state: 'SD', country: 'US' },
  
  // Tennessee
  '423': { code: '423', city: 'Chattanooga', state: 'TN', country: 'US' },
  '615': { code: '615', city: 'Nashville', state: 'TN', country: 'US' },
  '629': { code: '629', city: 'Nashville', state: 'TN', country: 'US' },
  '731': { code: '731', city: 'Jackson', state: 'TN', country: 'US' },
  '865': { code: '865', city: 'Knoxville', state: 'TN', country: 'US' },
  '901': { code: '901', city: 'Memphis', state: 'TN', country: 'US' },
  '931': { code: '931', city: 'Clarksville', state: 'TN', country: 'US' },
  
  // Texas
  '210': { code: '210', city: 'San Antonio', state: 'TX', country: 'US' },
  '214': { code: '214', city: 'Dallas', state: 'TX', country: 'US' },
  '254': { code: '254', city: 'Waco', state: 'TX', country: 'US' },
  '281': { code: '281', city: 'Houston', state: 'TX', country: 'US' },
  '325': { code: '325', city: 'Abilene', state: 'TX', country: 'US' },
  '346': { code: '346', city: 'Houston', state: 'TX', country: 'US' },
  '361': { code: '361', city: 'Corpus Christi', state: 'TX', country: 'US' },
  '409': { code: '409', city: 'Beaumont', state: 'TX', country: 'US' },
  '430': { code: '430', city: 'Tyler', state: 'TX', country: 'US' },
  '432': { code: '432', city: 'Midland', state: 'TX', country: 'US' },
  '469': { code: '469', city: 'Dallas', state: 'TX', country: 'US' },
  '512': { code: '512', city: 'Austin', state: 'TX', country: 'US' },
  '682': { code: '682', city: 'Fort Worth', state: 'TX', country: 'US' },
  '713': { code: '713', city: 'Houston', state: 'TX', country: 'US' },
  '737': { code: '737', city: 'Austin', state: 'TX', country: 'US' },
  '806': { code: '806', city: 'Lubbock', state: 'TX', country: 'US' },
  '817': { code: '817', city: 'Fort Worth', state: 'TX', country: 'US' },
  '830': { code: '830', city: 'New Braunfels', state: 'TX', country: 'US' },
  '832': { code: '832', city: 'Houston', state: 'TX', country: 'US' },
  '903': { code: '903', city: 'Tyler', state: 'TX', country: 'US' },
  '915': { code: '915', city: 'El Paso', state: 'TX', country: 'US' },
  '936': { code: '936', city: 'Conroe', state: 'TX', country: 'US' },
  '940': { code: '940', city: 'Wichita Falls', state: 'TX', country: 'US' },
  '956': { code: '956', city: 'Laredo', state: 'TX', country: 'US' },
  '972': { code: '972', city: 'Dallas', state: 'TX', country: 'US' },
  '979': { code: '979', city: 'Bryan', state: 'TX', country: 'US' },
  
  // Utah
  '385': { code: '385', city: 'Salt Lake City', state: 'UT', country: 'US' },
  '435': { code: '435', city: 'St. George', state: 'UT', country: 'US' },
  '801': { code: '801', city: 'Salt Lake City', state: 'UT', country: 'US' },
  
  // Vermont
  '802': { code: '802', city: 'Burlington', state: 'VT', country: 'US' },
  
  // Virginia
  '276': { code: '276', city: 'Bristol', state: 'VA', country: 'US' },
  '434': { code: '434', city: 'Lynchburg', state: 'VA', country: 'US' },
  '540': { code: '540', city: 'Roanoke', state: 'VA', country: 'US' },
  '571': { code: '571', city: 'Arlington', state: 'VA', country: 'US' },
  '703': { code: '703', city: 'Arlington', state: 'VA', country: 'US' },
  '757': { code: '757', city: 'Virginia Beach', state: 'VA', country: 'US' },
  '804': { code: '804', city: 'Richmond', state: 'VA', country: 'US' },
  
  // Washington
  '206': { code: '206', city: 'Seattle', state: 'WA', country: 'US' },
  '253': { code: '253', city: 'Tacoma', state: 'WA', country: 'US' },
  '360': { code: '360', city: 'Vancouver', state: 'WA', country: 'US' },
  '425': { code: '425', city: 'Bellevue', state: 'WA', country: 'US' },
  '509': { code: '509', city: 'Spokane', state: 'WA', country: 'US' },
  
  // West Virginia
  '304': { code: '304', city: 'Charleston', state: 'WV', country: 'US' },
  '681': { code: '681', city: 'Charleston', state: 'WV', country: 'US' },
  
  // Wisconsin
  '262': { code: '262', city: 'Kenosha', state: 'WI', country: 'US' },
  '414': { code: '414', city: 'Milwaukee', state: 'WI', country: 'US' },
  '608': { code: '608', city: 'Madison', state: 'WI', country: 'US' },
  '715': { code: '715', city: 'Eau Claire', state: 'WI', country: 'US' },
  '920': { code: '920', city: 'Green Bay', state: 'WI', country: 'US' },
  
  // Wyoming
  '307': { code: '307', city: 'Cheyenne', state: 'WY', country: 'US' },
  
  // Canada - Major codes
  '204': { code: '204', city: 'Winnipeg', state: 'MB', country: 'CA' },
  '226': { code: '226', city: 'London', state: 'ON', country: 'CA' },
  '236': { code: '236', city: 'Vancouver', state: 'BC', country: 'CA' },
  '249': { code: '249', city: 'Sudbury', state: 'ON', country: 'CA' },
  '250': { code: '250', city: 'Victoria', state: 'BC', country: 'CA' },
  '289': { code: '289', city: 'Hamilton', state: 'ON', country: 'CA' },
  '306': { code: '306', city: 'Regina', state: 'SK', country: 'CA' },
  '343': { code: '343', city: 'Ottawa', state: 'ON', country: 'CA' },
  '365': { code: '365', city: 'Hamilton', state: 'ON', country: 'CA' },
  '403': { code: '403', city: 'Calgary', state: 'AB', country: 'CA' },
  '416': { code: '416', city: 'Toronto', state: 'ON', country: 'CA' },
  '418': { code: '418', city: 'Quebec City', state: 'QC', country: 'CA' },
  '431': { code: '431', city: 'Winnipeg', state: 'MB', country: 'CA' },
  '437': { code: '437', city: 'Toronto', state: 'ON', country: 'CA' },
  '438': { code: '438', city: 'Montreal', state: 'QC', country: 'CA' },
  '450': { code: '450', city: 'Laval', state: 'QC', country: 'CA' },
  '506': { code: '506', city: 'Moncton', state: 'NB', country: 'CA' },
  '514': { code: '514', city: 'Montreal', state: 'QC', country: 'CA' },
  '519': { code: '519', city: 'London', state: 'ON', country: 'CA' },
  '579': { code: '579', city: 'Laval', state: 'QC', country: 'CA' },
  '581': { code: '581', city: 'Quebec City', state: 'QC', country: 'CA' },
  '587': { code: '587', city: 'Calgary', state: 'AB', country: 'CA' },
  '604': { code: '604', city: 'Vancouver', state: 'BC', country: 'CA' },
  '613': { code: '613', city: 'Ottawa', state: 'ON', country: 'CA' },
  '639': { code: '639', city: 'Regina', state: 'SK', country: 'CA' },
  '647': { code: '647', city: 'Toronto', state: 'ON', country: 'CA' },
  '672': { code: '672', city: 'Vancouver', state: 'BC', country: 'CA' },
  '705': { code: '705', city: 'Sudbury', state: 'ON', country: 'CA' },
  '709': { code: '709', city: 'St. John\'s', state: 'NL', country: 'CA' },
  '778': { code: '778', city: 'Vancouver', state: 'BC', country: 'CA' },
  '780': { code: '780', city: 'Edmonton', state: 'AB', country: 'CA' },
  '782': { code: '782', city: 'Halifax', state: 'NS', country: 'CA' },
  '807': { code: '807', city: 'Thunder Bay', state: 'ON', country: 'CA' },
  '819': { code: '819', city: 'Gatineau', state: 'QC', country: 'CA' },
  '825': { code: '825', city: 'Edmonton', state: 'AB', country: 'CA' },
  '867': { code: '867', city: 'Yellowknife', state: 'NT', country: 'CA' },
  '873': { code: '873', city: 'Quebec City', state: 'QC', country: 'CA' },
  '902': { code: '902', city: 'Halifax', state: 'NS', country: 'CA' },
  '905': { code: '905', city: 'Hamilton', state: 'ON', country: 'CA' },
};

export function getLocationFromAreaCode(areaCode: string): AreaCodeLocation | null {
  return areaCodeMap[areaCode] || null;
}
