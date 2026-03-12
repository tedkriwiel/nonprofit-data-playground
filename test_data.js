const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");

function loadCsv(filename) {
  const raw = fs.readFileSync(path.join(DATA_DIR, filename), "utf-8");
  const lines = raw.trim().split("\n");
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const obj = {};
    headers.forEach((h, i) => (obj[h] = values[i] || ""));
    return obj;
  });
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

// Load all tables
const people = loadCsv("people.csv");
const companies = loadCsv("companies.csv");
const campaigns = loadCsv("campaigns.csv");
const events = loadCsv("events.csv");
const registrations = loadCsv("registrations.csv");
const payments = loadCsv("payments.csv");
const inKindGifts = loadCsv("in_kind_gifts.csv");
const memberships = loadCsv("memberships.csv");
const volunteerHours = loadCsv("volunteer_hours.csv");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}`);
  }
}

// ─── Schema tests ───
console.log("\n=== Schema Integrity ===\n");

assert(people.length === 200, `people.csv has 200 rows (got ${people.length})`);
assert(companies.length === 30, `companies.csv has 30 rows (got ${companies.length})`);
assert(campaigns.length === 8, `campaigns.csv has 8 rows (got ${campaigns.length})`);
assert(events.length === 12, `events.csv has 12 rows (got ${events.length})`);

assert(
  people.every((p) => p.id && p.first_name && p.last_name && p.email),
  "All people have id, first_name, last_name, email"
);
assert(
  companies.every((c) => c.id && c.name && c.type),
  "All companies have id, name, type"
);
assert(
  payments.every((p) => p.id && p.person_id && p.amount && p.category),
  "All payments have id, person_id, amount, category"
);

// ─── Referential integrity ───
console.log("\n=== Referential Integrity ===\n");

const personIds = new Set(people.map((p) => p.id));
const companyIds = new Set(companies.map((c) => c.id));
const eventIds = new Set(events.map((e) => e.id));
const campaignIds = new Set(campaigns.map((c) => c.id));

// People → Companies
const peopleWithCompanies = people.filter((p) => p.company_id);
assert(
  peopleWithCompanies.every((p) => companyIds.has(p.company_id)),
  "All people.company_id references valid companies"
);

// Company primary_contact → People
const companiesWithContacts = companies.filter((c) => c.primary_contact_id);
assert(
  companiesWithContacts.every((c) => personIds.has(c.primary_contact_id)),
  "All companies.primary_contact_id references valid people"
);

// Payments → People
assert(
  payments.every((p) => personIds.has(p.person_id)),
  "All payments.person_id references valid people"
);

// Payments → Companies (when present)
const paymentsWithCompany = payments.filter((p) => p.company_id);
assert(
  paymentsWithCompany.every((p) => companyIds.has(p.company_id)),
  "All payments.company_id references valid companies"
);

// Registrations → People & Events
assert(
  registrations.every((r) => personIds.has(r.person_id)),
  "All registrations.person_id references valid people"
);
assert(
  registrations.every((r) => eventIds.has(r.event_id)),
  "All registrations.event_id references valid events"
);

// In-kind gifts → People
assert(
  inKindGifts.every((g) => personIds.has(g.person_id)),
  "All in_kind_gifts.person_id references valid people"
);

// Memberships → People
assert(
  memberships.every((m) => personIds.has(m.person_id)),
  "All memberships.person_id references valid people"
);

// Volunteer hours → People
assert(
  volunteerHours.every((v) => personIds.has(v.person_id)),
  "All volunteer_hours.person_id references valid people"
);

// Events campaigns
const eventsWithCampaign = events.filter((e) => e.campaign_id);
assert(
  eventsWithCampaign.every((e) => campaignIds.has(e.campaign_id)),
  "All events.campaign_id references valid campaigns"
);

// Payments campaigns
const paymentsWithCampaign = payments.filter((p) => p.campaign_id);
assert(
  paymentsWithCampaign.every((p) => campaignIds.has(p.campaign_id)),
  "All payments.campaign_id references valid campaigns"
);

// ─── Unique IDs ───
console.log("\n=== Unique IDs ===\n");

assert(new Set(people.map((p) => p.id)).size === people.length, "All people IDs are unique");
assert(new Set(companies.map((c) => c.id)).size === companies.length, "All company IDs are unique");
assert(new Set(payments.map((p) => p.id)).size === payments.length, "All payment IDs are unique");
assert(new Set(events.map((e) => e.id)).size === events.length, "All event IDs are unique");
assert(new Set(registrations.map((r) => r.id)).size === registrations.length, "All registration IDs are unique");
assert(new Set(inKindGifts.map((g) => g.id)).size === inKindGifts.length, "All in_kind_gift IDs are unique");
assert(new Set(memberships.map((m) => m.id)).size === memberships.length, "All membership IDs are unique");
assert(new Set(volunteerHours.map((v) => v.id)).size === volunteerHours.length, "All volunteer_hour IDs are unique");

// ─── Payment categories ───
console.log("\n=== Payment Categories ===\n");

const validCategories = new Set(["donation", "grant", "sponsorship", "service", "event_ticket"]);
const categories = new Set(payments.map((p) => p.category));
assert(
  [...categories].every((c) => validCategories.has(c)),
  `All payment categories are valid (found: ${[...categories].join(", ")})`
);

const donations = payments.filter((p) => p.category === "donation");
const grants = payments.filter((p) => p.category === "grant");
const sponsorships = payments.filter((p) => p.category === "sponsorship");
const services = payments.filter((p) => p.category === "service");
const eventTickets = payments.filter((p) => p.category === "event_ticket");

assert(donations.length > 0, `Has donations (${donations.length})`);
assert(grants.length > 0, `Has grants (${grants.length})`);
assert(sponsorships.length > 0, `Has sponsorships (${sponsorships.length})`);
assert(services.length > 0, `Has service payments (${services.length})`);
assert(eventTickets.length > 0, `Has event ticket payments (${eventTickets.length})`);
assert(inKindGifts.length > 0, `Has in-kind gifts (${inKindGifts.length})`);

// ─── Newsletter query tests ───
console.log("\n=== Newsletter Query Validation ===\n");

// Query 1: SELECT * FROM people WHERE payment_amount > 0
// (anyone who made any payment)
const peopleWithAnyPayment = new Set(payments.map((p) => p.person_id));
const query1Results = people.filter((p) => peopleWithAnyPayment.has(p.id));
assert(query1Results.length > 0, `Query 1 (all payers): ${query1Results.length} people`);

// Query 2: SELECT * FROM people JOIN payments WHERE category = 'donation'
const donorPersonIds = new Set(donations.map((d) => d.person_id));
const query2Results = people.filter((p) => donorPersonIds.has(p.id));
assert(query2Results.length > 0, `Query 2 (donation only): ${query2Results.length} people`);
assert(
  query2Results.length < query1Results.length,
  `Query 2 returns fewer people than Query 1 (${query2Results.length} < ${query1Results.length}) — service/ticket payers excluded`
);

// Query 3: SELECT * FROM people JOIN payments WHERE category IN ('donation', 'grant', 'sponsorship')
const q3Categories = new Set(["donation", "grant", "sponsorship"]);
const q3PersonIds = new Set(payments.filter((p) => q3Categories.has(p.category)).map((p) => p.person_id));
const query3Results = people.filter((p) => q3PersonIds.has(p.id));
assert(query3Results.length > 0, `Query 3 (donation+grant+sponsorship): ${query3Results.length} people`);
assert(
  query3Results.length >= query2Results.length,
  `Query 3 returns >= Query 2 results (${query3Results.length} >= ${query2Results.length})`
);

// Query 4: payments (donation/grant/sponsorship) UNION in_kind_gifts
const q4PersonIds = new Set([
  ...payments.filter((p) => q3Categories.has(p.category)).map((p) => p.person_id),
  ...inKindGifts.map((g) => g.person_id),
]);
const query4Results = people.filter((p) => q4PersonIds.has(p.id));
assert(query4Results.length > 0, `Query 4 (donation+grant+sponsorship+in_kind): ${query4Results.length} people`);
assert(
  query4Results.length >= query3Results.length,
  `Query 4 returns >= Query 3 results (${query4Results.length} >= ${query3Results.length})`
);

// Verify progressive broadening: Q1 > Q4 (Q1 includes service + ticket payers)
assert(
  query1Results.length > query4Results.length,
  `Query 1 (all payers) > Query 4 (donors broadly) — proves service/ticket payers exist outside donor definition (${query1Results.length} > ${query4Results.length})`
);

// Verify service payers are NOT in donor queries
const servicePersonIds = new Set(services.map((s) => s.person_id));
const servicePeopleAlsoDonors = [...servicePersonIds].filter((id) => donorPersonIds.has(id));
const pureServicePayers = [...servicePersonIds].filter((id) => !q4PersonIds.has(id));
assert(
  pureServicePayers.length > 0,
  `There are people who ONLY paid for services and are NOT donors (${pureServicePayers.length} people) — the key point of the newsletter`
);

// ─── Data quality checks ───
console.log("\n=== Data Quality ===\n");

assert(
  payments.every((p) => parseFloat(p.amount) > 0),
  "All payment amounts are positive"
);

assert(
  payments.every((p) => p.payment_date.match(/^\d{4}-\d{2}-\d{2}$/)),
  "All payment dates are valid YYYY-MM-DD format"
);

assert(
  people.every((p) => p.email.includes("@")),
  "All people have valid-looking emails"
);

// Grants come from foundations
const grantCompanyIds = new Set(grants.filter((g) => g.company_id).map((g) => g.company_id));
const grantCompanyTypes = [...grantCompanyIds].map((id) => companies.find((c) => c.id === id)?.type);
assert(
  grantCompanyTypes.every((t) => t === "Foundation"),
  `All grants come from Foundations (types: ${[...new Set(grantCompanyTypes)].join(", ")})`
);

// Sponsorships come from corporations/businesses
const sponsorCompanyIds = new Set(sponsorships.filter((s) => s.company_id).map((s) => s.company_id));
const sponsorCompanyTypes = [...sponsorCompanyIds].map((id) => companies.find((c) => c.id === id)?.type);
assert(
  sponsorCompanyTypes.every((t) => ["Corporation", "Business"].includes(t)),
  `All sponsorships come from Corps/Businesses (types: ${[...new Set(sponsorCompanyTypes)].join(", ")})`
);

// In-kind gifts exist
assert(
  inKindGifts.length > 0,
  `in_kind_gifts table has rows (${inKindGifts.length})`
);

// Event ticket payments match paid registrations
const paidRegistrations = registrations.filter((r) => parseFloat(r.ticket_amount) > 0);
assert(
  eventTickets.length === paidRegistrations.length,
  `Event ticket payments (${eventTickets.length}) match paid registrations (${paidRegistrations.length})`
);

// Membership levels are valid
const validLevels = new Set(["Basic", "Silver", "Gold", "Platinum"]);
assert(
  memberships.every((m) => validLevels.has(m.level)),
  "All membership levels are valid"
);

// ─── Summary ───
console.log(`\n${"=".repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${"=".repeat(40)}\n`);

process.exit(failed > 0 ? 1 : 0);
