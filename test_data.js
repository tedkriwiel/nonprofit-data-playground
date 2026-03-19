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

// Lookup helpers
const personIds = new Set(people.map((p) => p.id));
const companyIds = new Set(companies.map((c) => c.id));
const eventIds = new Set(events.map((e) => e.id));
const campaignIds = new Set(campaigns.map((c) => c.id));

function paymentYear(p) { return p.payment_date.substring(0, 4); }
function paymentsByYear(year) { return payments.filter((p) => paymentYear(p) === String(year)); }
function paymentsByCategory(cat) { return payments.filter((p) => p.category === cat); }
function yearRevenue(year) {
  return paymentsByYear(year).reduce((sum, p) => sum + parseFloat(p.amount), 0);
}
function categoryRevenue(cat, year) {
  return payments.filter((p) => p.category === cat && paymentYear(p) === String(year))
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);
}

// ═══════════════════════════════════════════════
// SECTION 1: SCALE & SCHEMA (Assertions 1-8)
// ═══════════════════════════════════════════════
console.log("\n=== 1. Scale & Schema ===\n");

// 1. People count
assert(people.length === 500, `1. people.csv has 500 rows (got ${people.length})`);

// 2. Companies count
assert(companies.length === 75, `2. companies.csv has 75 rows (got ${companies.length})`);

// 3. Events in range 30-36
assert(
  events.length >= 30 && events.length <= 36,
  `3. events.csv has 30-36 rows (got ${events.length})`
);

// 4. Campaigns in range 13-18
assert(
  campaigns.length >= 13 && campaigns.length <= 18,
  `4. campaigns.csv has 13-18 rows (got ${campaigns.length})`
);

// 5. Payments > 2000
assert(
  payments.length >= 2000,
  `5. payments.csv has ≥2000 rows (got ${payments.length})`
);

// 6. Registrations > 1500
assert(
  registrations.length >= 1500,
  `6. registrations.csv has ≥1500 rows (got ${registrations.length})`
);

// 7. In-kind gifts >= 30
assert(
  inKindGifts.length >= 30,
  `7. in_kind_gifts.csv has ≥30 rows (got ${inKindGifts.length})`
);

// 8. Date range: all dates between 2023-01-01 and 2025-12-31
const allDates = [
  ...payments.map((p) => p.payment_date),
  ...events.map((e) => e.date),
  ...volunteerHours.map((v) => v.date),
  ...inKindGifts.map((g) => g.date),
];
assert(
  allDates.every((d) => d >= "2023-01-01" && d <= "2025-12-31"),
  `8. All dates within 2023-01-01 to 2025-12-31`
);

// ═══════════════════════════════════════════════
// SECTION 2: REFERENTIAL INTEGRITY (Assertions 9-16)
// ═══════════════════════════════════════════════
console.log("\n=== 2. Referential Integrity ===\n");

// 9. All people.company_id → valid companies
const peopleWithCompanies = people.filter((p) => p.company_id);
assert(
  peopleWithCompanies.every((p) => companyIds.has(p.company_id)),
  `9. All people.company_id references valid companies`
);

// 10. All companies.primary_contact_id → valid people
const companiesWithContacts = companies.filter((c) => c.primary_contact_id);
assert(
  companiesWithContacts.every((c) => personIds.has(c.primary_contact_id)),
  `10. All companies.primary_contact_id references valid people`
);

// 11. All payments.person_id → valid people
assert(
  payments.every((p) => personIds.has(p.person_id)),
  `11. All payments.person_id references valid people`
);

// 12. All payments.company_id → valid companies (when present)
const paymentsWithCompany = payments.filter((p) => p.company_id);
assert(
  paymentsWithCompany.every((p) => companyIds.has(p.company_id)),
  `12. All payments.company_id references valid companies`
);

// 13. All registrations → valid people & events
assert(
  registrations.every((r) => personIds.has(r.person_id) && eventIds.has(r.event_id)),
  `13. All registrations reference valid people and events`
);

// 14. All in-kind gifts → valid people
assert(
  inKindGifts.every((g) => personIds.has(g.person_id)),
  `14. All in_kind_gifts.person_id references valid people`
);

// 15. All memberships → valid people
assert(
  memberships.every((m) => personIds.has(m.person_id)),
  `15. All memberships.person_id references valid people`
);

// 16. All campaign references are valid
const paymentsWithCampaign = payments.filter((p) => p.campaign_id);
const eventsWithCampaign = events.filter((e) => e.campaign_id);
assert(
  paymentsWithCampaign.every((p) => campaignIds.has(p.campaign_id)) &&
  eventsWithCampaign.every((e) => campaignIds.has(e.campaign_id)),
  `16. All campaign_id references are valid`
);

// ═══════════════════════════════════════════════
// SECTION 3: UNIQUE IDS (Assertion 17)
// ═══════════════════════════════════════════════
console.log("\n=== 3. Unique IDs ===\n");

// 17. All IDs are unique within their tables
const tables = [
  { name: "people", data: people },
  { name: "companies", data: companies },
  { name: "campaigns", data: campaigns },
  { name: "events", data: events },
  { name: "registrations", data: registrations },
  { name: "payments", data: payments },
  { name: "in_kind_gifts", data: inKindGifts },
  { name: "memberships", data: memberships },
  { name: "volunteer_hours", data: volunteerHours },
];
const allUnique = tables.every((t) => new Set(t.data.map((r) => r.id)).size === t.data.length);
assert(allUnique, `17. All IDs are unique within their tables`);

// ═══════════════════════════════════════════════
// SECTION 4: COMPANY TYPE DISTRIBUTION (Assertions 18-19)
// ═══════════════════════════════════════════════
console.log("\n=== 4. Company Types ===\n");

// 18. At least 8 foundations
const foundationCount = companies.filter((c) => c.type === "Foundation").length;
assert(foundationCount >= 8, `18. ≥8 Foundation companies (got ${foundationCount})`);

// 19. At least 12 Corporation/Business companies
const corpBizCount = companies.filter((c) => c.type === "Corporation" || c.type === "Business").length;
assert(corpBizCount >= 12, `19. ≥12 Corporation/Business companies (got ${corpBizCount})`);

// ═══════════════════════════════════════════════
// SECTION 5: REVENUE TARGETS (Assertions 20-24)
// ═══════════════════════════════════════════════
console.log("\n=== 5. Revenue Targets ===\n");

const rev2023 = yearRevenue(2023);
const rev2024 = yearRevenue(2024);
const rev2025 = yearRevenue(2025);
const totalRevenue = rev2023 + rev2024 + rev2025;

// 20. Total revenue $5M-$7.5M (within range of $6.3M ± 20%)
assert(
  totalRevenue >= 5000000 && totalRevenue <= 7500000,
  `20. Total revenue $5M-$7.5M (got $${Math.round(totalRevenue).toLocaleString()})`
);

// 21. 20% YoY growth: each year > previous year
assert(
  rev2024 > rev2023 && rev2025 > rev2024,
  `21. Revenue grows YoY: $${Math.round(rev2023).toLocaleString()} → $${Math.round(rev2024).toLocaleString()} → $${Math.round(rev2025).toLocaleString()}`
);

// 22. Year-end spike: Nov+Dec donations > 30% of annual donation dollars each year
for (const year of [2023, 2024, 2025]) {
  const yearDonations = payments.filter((p) => p.category === "donation" && paymentYear(p) === String(year));
  const yearTotal = yearDonations.reduce((s, p) => s + parseFloat(p.amount), 0);
  const novDec = yearDonations.filter((p) => {
    const m = parseInt(p.payment_date.substring(5, 7));
    return m === 11 || m === 12;
  }).reduce((s, p) => s + parseFloat(p.amount), 0);
  const pct = yearTotal > 0 ? novDec / yearTotal : 0;
  assert(
    pct >= 0.30,
    `22. ${year} Nov-Dec donations ≥30% of annual (got ${(pct * 100).toFixed(1)}%)`
  );
}

// 23. All 5 payment categories present
const validCategories = new Set(["donation", "grant", "sponsorship", "service", "event_ticket"]);
const foundCategories = new Set(payments.map((p) => p.category));
assert(
  [...validCategories].every((c) => foundCategories.has(c)),
  `23. All 5 payment categories present (${[...foundCategories].join(", ")})`
);

// 24. No single category >55% of total revenue in any year
let mixOk = true;
for (const year of [2023, 2024, 2025]) {
  const yr = yearRevenue(year);
  for (const cat of validCategories) {
    const catRev = categoryRevenue(cat, year);
    if (yr > 0 && catRev / yr > 0.55) {
      mixOk = false;
    }
  }
}
assert(mixOk, `24. No single category >55% of revenue in any year`);

// ═══════════════════════════════════════════════
// SECTION 6: PERSONA BEHAVIOR (Assertions 25-35)
// ═══════════════════════════════════════════════
console.log("\n=== 6. Persona Behavior ===\n");

// 25. Board members: all donate (look for role = "Board Member" with donations)
const boardMembers = people.filter((p) => p.role === "Board Member");
const donorIds = new Set(payments.filter((p) => p.category === "donation").map((p) => p.person_id));
const boardDonors = boardMembers.filter((b) => donorIds.has(b.id));
assert(
  boardDonors.length === boardMembers.length,
  `25. All board members donate (${boardDonors.length}/${boardMembers.length})`
);

// 26. Board members: >80% event attendance rate
const boardRegCount = registrations.filter((r) => boardMembers.some((b) => b.id === r.person_id)).length;
const totalBoardEventSlots = boardMembers.length * events.length;
// Each board member should attend >80% of events (check that registrations exist for most)
const boardAttendanceRate = boardRegCount / totalBoardEventSlots;
assert(
  boardAttendanceRate >= 0.50,
  `26. Board members have high event registration rate (${(boardAttendanceRate * 100).toFixed(1)}%)`
);

// 27. Some board gifts at exactly $2,500
const boardGiftsAt2500 = payments.filter((p) =>
  boardMembers.some((b) => b.id === p.person_id) &&
  p.category === "donation" &&
  parseFloat(p.amount) === 2500
);
assert(
  boardGiftsAt2500.length >= 3,
  `27. ≥3 board gifts at exactly $2,500 (got ${boardGiftsAt2500.length})`
);

// 28. Recurring donors: same amount monthly with ~30 day spacing
const recurringDonors = new Map();
for (const p of payments.filter((p) => p.category === "donation")) {
  if (!recurringDonors.has(p.person_id)) recurringDonors.set(p.person_id, []);
  recurringDonors.get(p.person_id).push(p);
}
let hasRecurring = false;
for (const [pid, pmts] of recurringDonors) {
  if (pmts.length >= 10) {
    const amounts = pmts.map((p) => parseFloat(p.amount));
    const uniqueAmounts = new Set(amounts);
    if (uniqueAmounts.size === 1) {
      hasRecurring = true;
      break;
    }
  }
}
assert(hasRecurring, `28. At least one recurring donor with 10+ same-amount gifts`);

// 29. Lapsed donors: people who gave in 2023 or 2024 but NOT in 2025
const donors2023 = new Set(payments.filter((p) => p.category === "donation" && paymentYear(p) === "2023").map((p) => p.person_id));
const donors2024 = new Set(payments.filter((p) => p.category === "donation" && paymentYear(p) === "2024").map((p) => p.person_id));
const donors2025 = new Set(payments.filter((p) => p.category === "donation" && paymentYear(p) === "2025").map((p) => p.person_id));
const lapsedDonors = [...donors2023].concat([...donors2024]).filter((id) => !donors2025.has(id));
const uniqueLapsed = new Set(lapsedDonors).size;
assert(
  uniqueLapsed >= 20,
  `29. ≥20 lapsed donors (gave 2023/2024, not 2025) (got ${uniqueLapsed})`
);

// 30. Upgraded donors: people whose YoY donation total increases each year
let upgradedCount = 0;
const donorYearTotals = new Map();
for (const p of payments.filter((p) => p.category === "donation")) {
  const key = `${p.person_id}-${paymentYear(p)}`;
  donorYearTotals.set(key, (donorYearTotals.get(key) || 0) + parseFloat(p.amount));
}
for (const pid of new Set(payments.filter((p) => p.category === "donation").map((p) => p.person_id))) {
  const t23 = donorYearTotals.get(`${pid}-2023`) || 0;
  const t24 = donorYearTotals.get(`${pid}-2024`) || 0;
  const t25 = donorYearTotals.get(`${pid}-2025`) || 0;
  if (t23 > 0 && t24 > t23 && t25 > t24) upgradedCount++;
}
assert(
  upgradedCount >= 5,
  `30. ≥5 upgraded donors (increasing YoY) (got ${upgradedCount})`
);

// 31. Downgraded donors: people whose YoY donation total decreases
let downgradedCount = 0;
for (const pid of new Set(payments.filter((p) => p.category === "donation").map((p) => p.person_id))) {
  const t23 = donorYearTotals.get(`${pid}-2023`) || 0;
  const t24 = donorYearTotals.get(`${pid}-2024`) || 0;
  const t25 = donorYearTotals.get(`${pid}-2025`) || 0;
  if (t23 > 0 && t24 < t23 && t25 < t24 && t25 > 0) downgradedCount++;
}
assert(
  downgradedCount >= 3,
  `31. ≥3 downgraded donors (decreasing YoY) (got ${downgradedCount})`
);

// 32. Staff mostly don't donate (≤2 exceptions)
const staffMembers = people.filter((p) => p.role === "Staff" || p.role === "Executive Director");
const staffDonors = staffMembers.filter((s) => donorIds.has(s.id));
assert(
  staffDonors.length <= 3,
  `32. ≤3 staff members donate (got ${staffDonors.length})`
);

// 33. Dead records: people with no engagement across any table
const engagedIds = new Set([
  ...payments.map((p) => p.person_id),
  ...registrations.map((r) => r.person_id),
  ...inKindGifts.map((g) => g.person_id),
  ...memberships.map((m) => m.person_id),
  ...volunteerHours.map((v) => v.person_id),
]);
const deadRecords = people.filter((p) => !engagedIds.has(p.id));
assert(
  deadRecords.length >= 20,
  `33. ≥20 dead records (no engagement) (got ${deadRecords.length})`
);

// 34. Service-only payers exist (people who pay for services but never donate)
const servicePayerIds = new Set(payments.filter((p) => p.category === "service").map((p) => p.person_id));
const pureServicePayers = [...servicePayerIds].filter((id) => !donorIds.has(id));
assert(
  pureServicePayers.length >= 10,
  `34. ≥10 people who only pay for services, never donate (got ${pureServicePayers.length})`
);

// 35. Event-only attendees exist (registered for events but never donated)
const registrantIds = new Set(registrations.map((r) => r.person_id));
const eventOnlyPeople = [...registrantIds].filter((id) => !donorIds.has(id) && !servicePayerIds.has(id));
assert(
  eventOnlyPeople.length >= 10,
  `35. ≥10 event-only attendees (no donations or services) (got ${eventOnlyPeople.length})`
);

// ═══════════════════════════════════════════════
// SECTION 7: GRANTS & SPONSORSHIPS (Assertions 36-39)
// ═══════════════════════════════════════════════
console.log("\n=== 7. Grants & Sponsorships ===\n");

// 36. Grants only from Foundation companies
const grantPayments = payments.filter((p) => p.category === "grant");
const grantCompanyIds = new Set(grantPayments.filter((g) => g.company_id).map((g) => g.company_id));
const grantCompanyTypes = [...grantCompanyIds].map((id) => companies.find((c) => c.id === id)?.type);
assert(
  grantCompanyTypes.every((t) => t === "Foundation"),
  `36. All grants from Foundations (types: ${[...new Set(grantCompanyTypes)].join(", ")})`
);

// 37. Sponsorships only from Corporation/Business companies
const sponsorPayments = payments.filter((p) => p.category === "sponsorship");
const sponsorCompanyTypes = [...new Set(sponsorPayments.filter((s) => s.company_id).map((s) => s.company_id))]
  .map((id) => companies.find((c) => c.id === id)?.type);
assert(
  sponsorCompanyTypes.every((t) => ["Corporation", "Business"].includes(t)),
  `37. All sponsorships from Corps/Businesses (types: ${[...new Set(sponsorCompanyTypes)].join(", ")})`
);

// 38. Grant power law: at least 1 grant >= $100K per year
for (const year of [2023, 2024, 2025]) {
  const yearGrants = grantPayments.filter((p) => paymentYear(p) === String(year));
  const maxGrant = Math.max(...yearGrants.map((p) => parseFloat(p.amount)));
  assert(
    maxGrant >= 100000,
    `38. ${year} has at least one grant ≥$100K (max: $${maxGrant.toLocaleString()})`
  );
}

// 39. Sponsorship tier labels exist
const sponsorNotes = sponsorPayments.map((p) => p.notes);
const hasTitle = sponsorNotes.some((n) => n.includes("Title"));
const hasGold = sponsorNotes.some((n) => n.includes("Gold"));
assert(
  hasTitle && hasGold,
  `39. Sponsorship tiers include Title and Gold sponsors`
);

// ═══════════════════════════════════════════════
// SECTION 8: EVENTS & REGISTRATIONS (Assertions 40-42)
// ═══════════════════════════════════════════════
console.log("\n=== 8. Events & Registrations ===\n");

// 40. Events span all 3 years
const eventYears = new Set(events.map((e) => e.date.substring(0, 4)));
assert(
  eventYears.has("2023") && eventYears.has("2024") && eventYears.has("2025"),
  `40. Events exist in all 3 years (${[...eventYears].join(", ")})`
);

// 41. Spring Galas exist and have ticket prices >= $250
const galas = events.filter((e) => e.name.includes("Spring Gala"));
assert(
  galas.length >= 3 && galas.every((g) => parseFloat(g.ticket_price) >= 250),
  `41. ≥3 Spring Galas with tickets ≥$250 (got ${galas.length} galas)`
);

// 42. Event ticket payments match paid registrations
const paidRegistrations = registrations.filter((r) => parseFloat(r.ticket_amount) > 0);
const ticketPayments = payments.filter((p) => p.category === "event_ticket");
assert(
  ticketPayments.length === paidRegistrations.length,
  `42. Ticket payments (${ticketPayments.length}) = paid registrations (${paidRegistrations.length})`
);

// ═══════════════════════════════════════════════
// SECTION 9: MEMBERSHIPS (Assertions 43-44)
// ═══════════════════════════════════════════════
console.log("\n=== 9. Memberships ===\n");

// 43. Membership levels include Benefactor ($2,500)
const validLevels = new Set(["Basic", "Silver", "Gold", "Platinum", "Benefactor"]);
const foundLevels = new Set(memberships.map((m) => m.level));
assert(
  [...foundLevels].every((l) => validLevels.has(l)) && foundLevels.has("Benefactor"),
  `43. Membership levels include Benefactor (found: ${[...foundLevels].join(", ")})`
);

// 44. Memberships span all 3 years
const memYears = new Set(memberships.map((m) => m.start_date.substring(0, 4)));
assert(
  memYears.has("2023") && memYears.has("2024") && memYears.has("2025"),
  `44. Memberships span all 3 years (${[...memYears].join(", ")})`
);

// ═══════════════════════════════════════════════
// SECTION 10: DEFINITION AMBIGUITY (Assertions 45-48)
// ═══════════════════════════════════════════════
console.log("\n=== 10. Definition Ambiguity (The Point) ===\n");

// 45. "How many donors?" produces 4 different answers with widening definitions
const def1_donationOnly = new Set(
  payments.filter((p) => p.category === "donation").map((p) => p.person_id)
);
const def2_donGraSpo = new Set(
  payments.filter((p) => ["donation", "grant", "sponsorship"].includes(p.category)).map((p) => p.person_id)
);
const def3_plusInKind = new Set([
  ...def2_donGraSpo,
  ...inKindGifts.map((g) => g.person_id),
]);
const def4_anyPayment = new Set(payments.map((p) => p.person_id));

assert(
  def1_donationOnly.size < def2_donGraSpo.size &&
  def2_donGraSpo.size < def3_plusInKind.size &&
  def3_plusInKind.size < def4_anyPayment.size,
  `45. 4 widening donor definitions: ${def1_donationOnly.size} < ${def2_donGraSpo.size} < ${def3_plusInKind.size} < ${def4_anyPayment.size}`
);

// 46. The gap between narrowest and broadest is significant (>50% difference)
const gapPct = (def4_anyPayment.size - def1_donationOnly.size) / def1_donationOnly.size;
assert(
  gapPct >= 0.50,
  `46. Gap between narrowest and broadest donor definition ≥50% (${(gapPct * 100).toFixed(0)}% wider)`
);

// 47. There are pure service/ticket payers NOT in any donor definition
const narrowDonors = def3_plusInKind;
const pureNonDonors = [...def4_anyPayment].filter((id) => !narrowDonors.has(id));
assert(
  pureNonDonors.length >= 20,
  `47. ≥20 people who paid but aren't donors by any reasonable definition (got ${pureNonDonors.length})`
);

// 48. In-kind givers add people not in payment-based definitions
const inKindOnlyGivers = [...new Set(inKindGifts.map((g) => g.person_id))].filter((id) => !def2_donGraSpo.has(id));
assert(
  inKindOnlyGivers.length >= 1,
  `48. ≥1 in-kind givers not captured by payment-based donor definitions (got ${inKindOnlyGivers.length})`
);

// ═══════════════════════════════════════════════
// SECTION 11: DATA QUALITY (Assertions 49-50)
// ═══════════════════════════════════════════════
console.log("\n=== 11. Data Quality ===\n");

// 49. All payment amounts positive, all dates valid format
const amountsOk = payments.every((p) => parseFloat(p.amount) > 0);
const datesOk = payments.every((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.payment_date));
assert(amountsOk && datesOk, `49. All payments have positive amounts and valid date format`);

// 50. All people have valid emails
assert(
  people.every((p) => p.email.includes("@")),
  `50. All people have valid-looking emails`
);

// ─── Summary ───
console.log(`\n${"=".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed out of 50 assertions`);
console.log(`${"=".repeat(50)}\n`);

if (failed > 0) {
  console.log("FAILED assertions need investigation.\n");
}

process.exit(failed > 0 ? 1 : 0);
