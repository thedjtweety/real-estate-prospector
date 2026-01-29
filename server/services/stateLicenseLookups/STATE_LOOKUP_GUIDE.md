# Top 10 State Real Estate License Lookup Systems

This document contains research on how to lookup real estate broker licenses in the top 10 US states by real estate market size.

## Coverage
These 10 states represent approximately **60% of the US real estate market**.

---

## 1. Florida (FL)
**Market Share:** ~10%  
**Lookup URL:** https://www.myfloridalicense.com/wl11.asp?mode=0&SID=&brd=&typ=&id=  
**Method:** HTML form scraping  
**Search By:** Name, License Number, Business Name  
**Data Returned:** Name, License #, Status, Expiration, Business Name, Address  
**Difficulty:** Easy - Simple HTML form  

---

## 2. California (CA)
**Market Share:** ~12%  
**Lookup URL:** https://www2.dre.ca.gov/PublicASP/pplinfo.asp  
**Method:** HTML form scraping  
**Search By:** Name, License Number  
**Data Returned:** Name, License #, Status, Expiration Date, Address  
**Difficulty:** Easy - Simple HTML form  

---

## 3. Texas (TX)
**Market Share:** ~9%  
**Lookup URL:** https://www.trec.texas.gov/apps/license-holder-search/  
**Method:** JavaScript-heavy (may need Puppeteer)  
**Search By:** Name, License Number, Business Name  
**Data Returned:** Name, License #, Status, Company, Address  
**Difficulty:** Medium - JavaScript rendering required  

---

## 4. New York (NY)
**Market Share:** ~7%  
**Lookup URL:** https://appext20.dos.ny.gov/nydos/selSearchType.do  
**Method:** HTML form scraping  
**Search By:** Name, License Number  
**Data Returned:** Name, License #, Status, Business Name, Address  
**Difficulty:** Easy - Simple HTML form  

---

## 5. Pennsylvania (PA)
**Market Share:** ~4%  
**Lookup URL:** https://www.pals.pa.gov/#/page/search  
**Method:** JavaScript-heavy (may need Puppeteer)  
**Search By:** Name, License Number  
**Data Returned:** Name, License #, Status, Expiration  
**Difficulty:** Medium - JavaScript rendering required  

---

## 6. Illinois (IL)
**Market Share:** ~4%  
**Lookup URL:** https://www.idfpr.com/LicenseLookup/LicenseLookup.asp  
**Method:** HTML form scraping  
**Search By:** Name, License Number  
**Data Returned:** Name, License #, Status, Expiration, Business Name  
**Difficulty:** Easy - Simple HTML form  

---

## 7. Ohio (OH)
**Market Share:** ~4%  
**Lookup URL:** https://elicense.ohio.gov/oh_verifylicense  
**Method:** HTML form scraping  
**Search By:** Name, License Number  
**Data Returned:** Name, License #, Status, Expiration  
**Difficulty:** Easy - Simple HTML form  

---

## 8. Georgia (GA)
**Market Share:** ~4%  
**Lookup URL:** https://verify.sos.ga.gov/verification/  
**Method:** HTML form scraping  
**Search By:** Name, License Number  
**Data Returned:** Name, License #, Status, Business Name  
**Difficulty:** Easy - Simple HTML form  

---

## 9. North Carolina (NC)
**Market Share:** ~3%  
**Lookup URL:** https://www.ncrec.gov/Licensing/LicenseeSearch  
**Method:** HTML form scraping  
**Search By:** Name, License Number, Company  
**Data Returned:** Name, License #, Status, Company, Address  
**Difficulty:** Easy - Simple HTML form  

---

## 10. Michigan (MI)
**Market Share:** ~3%  
**Lookup URL:** https://aca-prod.accela.com/MILARA/Cap/CapHome.aspx?module=Licenses  
**Method:** JavaScript-heavy (may need Puppeteer)  
**Search By:** Name, License Number  
**Data Returned:** Name, License #, Status, Expiration  
**Difficulty:** Medium - JavaScript rendering required  

---

## Implementation Strategy

### Phase 1: Easy States (HTML Forms) - 6 states
1. Florida
2. California  
3. New York
4. Illinois
5. Ohio
6. Georgia

**Total Coverage:** ~44% of US market  
**Implementation Time:** ~4 hours (40 min each)

### Phase 2: Medium States (JavaScript) - 4 states
1. Texas
2. Pennsylvania
3. Michigan
4. (North Carolina - actually easy, move to Phase 1)

**Total Coverage:** +16% = 60% of US market  
**Implementation Time:** ~4 hours (1 hour each)

---

## Common Data Fields

All states provide:
- **Name** - Broker/agent full name
- **License Number** - Unique state license ID
- **Status** - Active, Inactive, Expired, Suspended
- **Expiration Date** - When license expires

Most states also provide:
- **Business Name** - Brokerage company name
- **Address** - Business or personal address
- **License Type** - Broker, Salesperson, etc.

---

## Error Handling

Common issues:
1. **Rate limiting** - Add delays between requests (2-5 seconds)
2. **CAPTCHA** - Some states may add CAPTCHA (requires manual intervention or CAPTCHA solving service)
3. **Timeouts** - Government sites can be slow (30-60 second timeouts)
4. **Format changes** - Sites may change HTML structure (need monitoring)

---

## Testing Strategy

For each state:
1. Test with known broker name
2. Test with known license number
3. Test with invalid input (should return no results)
4. Test with partial name match
5. Verify data accuracy against public records
