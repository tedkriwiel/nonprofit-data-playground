const { faker } = require("@faker-js/faker");
const fs = require("fs");
const path = require("path");

faker.seed(42); // deterministic output

const DATA_DIR = path.join(__dirname, "data");
fs.mkdirSync(DATA_DIR, { recursive: true });

function writeCsv(filename, headers, rows) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(
      headers
        .map((h) => {
          const val = row[h] ?? "";
          const str = String(val);
          return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(",")
    );
  }
  fs.writeFileSync(path.join(DATA_DIR, filename), lines.join("\n") + "\n");
  console.log(`  ${filename}: ${rows.length} rows`);
}

// ─── Helpers ───
function isoDate(d) {
  return d.toISOString().split("T")[0];
}
function dateBetween(from, to) {
  return faker.date.between({ from, to });
}
function pick(arr) {
  return faker.helpers.arrayElement(arr);
}
function pickN(arr, n) {
  return faker.helpers.arrayElements(arr, n);
}
function weightedPick(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = faker.number.float({ min: 0, max: total, fractionDigits: 6 });
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}
function randomDateInYear(year) {
  return dateBetween(`${year}-01-01`, `${year}-12-31`);
}
function randomDateInMonth(year, month) {
  const m = String(month).padStart(2, "0");
  const lastDay = new Date(year, month, 0).getDate();
  return dateBetween(`${year}-${m}-01`, `${year}-${m}-${lastDay}`);
}
function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// ─── Scale Config ───
const YEARS = [2023, 2024, 2025];
const DATE_START = "2023-01-01";
const DATE_END = "2025-12-31";

// Revenue targets per year (20% YoY growth)
const YEARLY_REVENUE = { 2023: 1740000, 2024: 2080000, 2025: 2500000 };

// Revenue mix targets (fractions)
const REVENUE_MIX = {
  donation: 0.325,
  grant: 0.275,
  sponsorship: 0.135,
  event_ticket: 0.10,
  service: 0.065,
  // membership is tracked separately
};

// ════════════════════════════════════════════
// 1. COMPANIES
// ════════════════════════════════════════════
const NUM_COMPANIES = 75;
const companyTypeQuotas = {
  Foundation: 10,
  Corporation: 15,
  Business: 15,
  "Law Firm": 4,
  Nonprofit: 10,
  University: 5,
  Government: 5,
};
const companyTypes = [];
for (const [type, count] of Object.entries(companyTypeQuotas)) {
  for (let i = 0; i < count; i++) companyTypes.push(type);
}
// Fill remaining
while (companyTypes.length < NUM_COMPANIES) {
  companyTypes.push(pick(["Corporation", "Business", "Nonprofit"]));
}
// Shuffle
for (let i = companyTypes.length - 1; i > 0; i--) {
  const j = faker.number.int({ min: 0, max: i });
  [companyTypes[i], companyTypes[j]] = [companyTypes[j], companyTypes[i]];
}

const companies = [];
for (let i = 1; i <= NUM_COMPANIES; i++) {
  companies.push({
    id: i,
    name: faker.company.name(),
    type: companyTypes[i - 1],
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    zip: faker.location.zipCode(),
    website: faker.internet.url(),
    primary_contact_id: "",
    created_at: isoDate(dateBetween("2018-01-01", "2025-06-01")),
  });
}

const foundations = companies.filter((c) => c.type === "Foundation");
const corporations = companies.filter((c) => c.type === "Corporation" || c.type === "Business");
const lawFirms = companies.filter((c) => c.type === "Law Firm");

// ════════════════════════════════════════════
// 2. PEOPLE (Persona-First)
// ════════════════════════════════════════════
const NUM_PEOPLE = 500;

// Persona assignments
const personaQuotas = [
  { persona: "board_member", count: 14 },
  { persona: "major_donor", count: 10 },
  { persona: "mid_level_donor", count: 18 },
  { persona: "recurring_donor", count: 28 },
  { persona: "lapsed_donor", count: 35 },
  { persona: "upgraded_donor", count: 9 },
  { persona: "downgraded_donor", count: 6 },
  { persona: "volunteer_to_donor", count: 9 },
  { persona: "event_to_donor", count: 9 },
  { persona: "staff", count: 14 },
  { persona: "foundation_contact", count: 20 },
  { persona: "corporate_contact", count: 25 },
  { persona: "dead_record", count: 45 },
  { persona: "near_duplicate", count: 6 },
  { persona: "event_only", count: 40 },
  { persona: "service_only", count: 40 },
  { persona: "regular_donor", count: 100 },
];

let personaList = [];
for (const { persona, count } of personaQuotas) {
  for (let i = 0; i < count; i++) personaList.push(persona);
}
// Fill remaining with a mix
while (personaList.length < NUM_PEOPLE) {
  personaList.push(pick(["regular_donor", "event_only", "service_only", "dead_record"]));
}
// Shuffle
for (let i = personaList.length - 1; i > 0; i--) {
  const j = faker.number.int({ min: 0, max: i });
  [personaList[i], personaList[j]] = [personaList[j], personaList[i]];
}

// Assign foundation contacts to actual foundations
let foundationIdx = 0;
let corpIdx = 0;

const people = [];
const nearDupPairs = []; // track for near-duplicate generation

function roleForPersona(persona) {
  switch (persona) {
    case "board_member": return "Board Member";
    case "staff": return pick(["Staff", "Staff", "Staff", "Executive Director"]);
    case "foundation_contact": return pick(["Program Officer", "Foundation Contact", "VP of Giving"]);
    case "corporate_contact": return pick(["Corporate Contact", "CSR Manager", "Accounts Payable"]);
    default: return pick(["Individual Donor", "Volunteer", "Program Participant", "Event Attendee"]);
  }
}

let nearDupCount = 0;
for (let i = 1; i <= NUM_PEOPLE; i++) {
  const persona = personaList[i - 1];
  let companyId = "";
  let role = roleForPersona(persona);

  if (persona === "foundation_contact") {
    companyId = foundations[foundationIdx % foundations.length].id;
    foundationIdx++;
  } else if (persona === "corporate_contact") {
    companyId = corporations[corpIdx % corporations.length].id;
    corpIdx++;
  } else if (persona === "board_member" && faker.datatype.boolean(0.3)) {
    companyId = pick(corporations).id;
  }

  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const address = faker.location.streetAddress();
  const city = faker.location.city();
  const state = faker.location.state({ abbreviated: true });
  const zip = faker.location.zipCode();

  let createdAt;
  if (persona === "dead_record") {
    createdAt = isoDate(dateBetween("2018-01-01", "2022-12-31"));
  } else if (persona === "lapsed_donor") {
    createdAt = isoDate(dateBetween("2020-01-01", "2023-06-30"));
  } else {
    createdAt = isoDate(dateBetween("2020-01-01", "2025-06-01"));
  }

  people.push({
    id: i,
    first_name: firstName,
    last_name: lastName,
    email: faker.internet.email({ firstName, lastName }),
    phone: faker.phone.number({ style: "national" }),
    address,
    city,
    state,
    zip,
    company_id: companyId,
    role,
    created_at: createdAt,
    _persona: persona, // internal, stripped before CSV
  });

  // Near-duplicate: create a variation of the previous person
  if (persona === "near_duplicate" && nearDupCount < 3) {
    // The previous person is one of the pair, this one is the duplicate
    const prev = people[people.length - 2];
    if (prev) {
      // Make this person share same last name and address
      people[people.length - 1].last_name = prev.last_name;
      people[people.length - 1].address = prev.address;
      people[people.length - 1].city = prev.city;
      people[people.length - 1].state = prev.state;
      people[people.length - 1].zip = prev.zip;
      // Slightly different first name
      people[people.length - 1].first_name = prev.first_name.substring(0, 3) + faker.person.firstName().substring(0, 2);
      nearDupPairs.push([prev.id, i]);
      nearDupCount++;
    }
  }
}

// Assign primary contacts to companies
for (const co of companies) {
  const contacts = people.filter((p) => p.company_id === co.id);
  if (contacts.length > 0) {
    co.primary_contact_id = contacts[0].id;
  }
}

// Helper lookups
const personById = new Map(people.map((p) => [p.id, p]));
const peopleByPersona = {};
for (const p of people) {
  if (!peopleByPersona[p._persona]) peopleByPersona[p._persona] = [];
  peopleByPersona[p._persona].push(p);
}

// ════════════════════════════════════════════
// 3. CAMPAIGNS
// ════════════════════════════════════════════
const campaignTemplates = [
  // Annual Fund - every year
  { name: "Annual Fund {year}", years: [2023, 2024, 2025], startMonth: 1, endMonth: 12 },
  // Year-End Appeal - every year
  { name: "Year-End Appeal {year}", years: [2023, 2024, 2025], startMonth: 10, endMonth: 12 },
  // Spring Gala - every year
  { name: "Spring Gala {year}", years: [2023, 2024, 2025], startMonth: 3, endMonth: 5 },
  // Capital Campaign - multi-year
  { name: "Capital Campaign - New Building", years: [2024, 2025], startMonth: 1, endMonth: 12, single: true },
  // Emergency Relief - one time
  { name: "Emergency Relief Fund", years: [2024], startMonth: 3, endMonth: 9, single: true },
  // Scholarship Fund - ongoing
  { name: "Scholarship Fund", years: [2023, 2024, 2025], startMonth: 1, endMonth: 12, single: true },
  // Major Gifts
  { name: "Major Gifts Initiative", years: [2024, 2025], startMonth: 1, endMonth: 12, single: true },
];

const campaigns = [];
let campId = 1;

for (const tmpl of campaignTemplates) {
  if (tmpl.single) {
    const startYear = tmpl.years[0];
    const endYear = tmpl.years[tmpl.years.length - 1];
    campaigns.push({
      id: campId++,
      name: tmpl.name,
      goal_amount: 0, // set in post-processing
      start_date: `${startYear}-${String(tmpl.startMonth).padStart(2, "0")}-01`,
      end_date: `${endYear}-${String(tmpl.endMonth).padStart(2, "0")}-28`,
      status: endYear < 2025 ? "completed" : "active",
    });
  } else {
    for (const year of tmpl.years) {
      campaigns.push({
        id: campId++,
        name: tmpl.name.replace("{year}", year),
        goal_amount: 0,
        start_date: `${year}-${String(tmpl.startMonth).padStart(2, "0")}-01`,
        end_date: `${year}-${String(tmpl.endMonth).padStart(2, "0")}-28`,
        status: year < 2025 ? "completed" : "active",
      });
    }
  }
}

// Campaign lookup helpers
function annualFundForYear(year) {
  return campaigns.find((c) => c.name === `Annual Fund ${year}`);
}
function yearEndAppealForYear(year) {
  return campaigns.find((c) => c.name === `Year-End Appeal ${year}`);
}
function springGalaForYear(year) {
  return campaigns.find((c) => c.name === `Spring Gala ${year}`);
}
const capitalCampaign = campaigns.find((c) => c.name === "Capital Campaign - New Building");
const scholarshipFund = campaigns.find((c) => c.name === "Scholarship Fund");
const majorGiftsInitiative = campaigns.find((c) => c.name === "Major Gifts Initiative");

// ════════════════════════════════════════════
// 4. EVENTS (Season-Matched, Recurring)
// ════════════════════════════════════════════
const eventTemplates = [
  { name: "Spring Gala {year}", monthRange: [4, 5], ticketPrice: [250, 300, 350, 400, 500], capacity: [250, 300, 350], getCampaign: (y) => springGalaForYear(y)?.id || "" },
  { name: "Summer Picnic {year}", monthRange: [6, 7], ticketPrice: [0], capacity: [300, 350, 400] },
  { name: "5K Fun Run {year}", monthRange: [9, 9], ticketPrice: [35], capacity: [200, 250, 300] },
  { name: "Fall Fundraiser {year}", monthRange: [10, 11], ticketPrice: [150], capacity: [150, 175, 200] },
  { name: "Donor Appreciation Night {year}", monthRange: [10, 10], ticketPrice: [0], capacity: [100, 125, 150] },
  { name: "Holiday Luncheon {year}", monthRange: [11, 12], ticketPrice: [75], capacity: [150, 175, 200] },
  { name: "Volunteer Appreciation {year}", monthRange: [3, 3], ticketPrice: [0], capacity: [80, 100, 120] },
  { name: "Youth Mentorship Kickoff {year}", monthRange: [1, 2], ticketPrice: [0], capacity: [60, 80, 100] },
  { name: "Annual Board Retreat {year}", monthRange: [1, 2], ticketPrice: [0], capacity: [20, 25, 30] },
  { name: "Year-End Celebration {year}", monthRange: [12, 12], ticketPrice: [0], capacity: [100, 150, 200] },
];
// Leadership Conference - alternating years
const leadershipConf = { name: "Leadership Conference {year}", monthRange: [5, 6], ticketPrice: [100], capacity: [100, 150] };

const events = [];
let evtId = 1;

for (const year of YEARS) {
  for (const tmpl of eventTemplates) {
    const month = faker.number.int({ min: tmpl.monthRange[0], max: tmpl.monthRange[1] });
    const day = faker.number.int({ min: 5, max: 25 });
    const m = String(month).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    const campId = tmpl.getCampaign ? tmpl.getCampaign(year) : "";
    // Ticket prices can increase modestly YoY
    const yearIdx = year - 2023;
    let price = pick(tmpl.ticketPrice);
    if (price > 0 && yearIdx > 0) {
      price = Math.round(price * (1 + 0.05 * yearIdx)); // 5% increase per year
    }
    events.push({
      id: evtId++,
      name: tmpl.name.replace("{year}", year),
      date: `${year}-${m}-${d}`,
      location: faker.location.streetAddress() + ", " + faker.location.city(),
      capacity: pick(tmpl.capacity),
      ticket_price: price,
      campaign_id: campId,
    });
  }
  // Leadership Conference in 2023 and 2025
  if (year === 2023 || year === 2025) {
    const month = faker.number.int({ min: leadershipConf.monthRange[0], max: leadershipConf.monthRange[1] });
    events.push({
      id: evtId++,
      name: leadershipConf.name.replace("{year}", year),
      date: `${year}-${String(month).padStart(2, "0")}-${String(faker.number.int({ min: 5, max: 25 })).padStart(2, "0")}`,
      location: faker.location.streetAddress() + ", " + faker.location.city(),
      capacity: pick(leadershipConf.capacity),
      ticket_price: pick(leadershipConf.ticketPrice),
      campaign_id: "",
    });
  }
}

// Event helpers
function eventsInYear(year) {
  return events.filter((e) => e.date.startsWith(`${year}-`));
}
function galaForYear(year) {
  return events.find((e) => e.name === `Spring Gala ${year}`);
}

// ════════════════════════════════════════════
// 5. REGISTRATIONS (Persona-Aware)
// ════════════════════════════════════════════
const registrations = [];
let regId = 1;

// Board members attend >80% of events
const boardMembers = peopleByPersona["board_member"] || [];
const staffMembers = peopleByPersona["staff"] || [];

for (const event of events) {
  const year = parseInt(event.date.substring(0, 4));
  const attendees = new Set();

  // Board members: >80% attendance
  if (!event.name.includes("Youth")) {
    for (const bm of boardMembers) {
      if (faker.datatype.boolean(0.85)) attendees.add(bm.id);
    }
  }

  // Staff attend most events
  for (const s of staffMembers) {
    if (faker.datatype.boolean(0.7)) attendees.add(s.id);
  }

  // Major donors attend galas and donor appreciation
  if (event.name.includes("Gala") || event.name.includes("Donor Appreciation") || event.name.includes("Fall Fundraiser")) {
    for (const md of (peopleByPersona["major_donor"] || [])) {
      if (faker.datatype.boolean(0.7)) attendees.add(md.id);
    }
    for (const md of (peopleByPersona["mid_level_donor"] || [])) {
      if (faker.datatype.boolean(0.5)) attendees.add(md.id);
    }
  }

  // Event-only people attend events
  const eventOnly = peopleByPersona["event_only"] || [];
  for (const p of eventOnly) {
    if (faker.datatype.boolean(0.25)) attendees.add(p.id);
  }

  // Regular donors attend some events
  const regularDonors = peopleByPersona["regular_donor"] || [];
  for (const p of regularDonors) {
    if (faker.datatype.boolean(0.15)) attendees.add(p.id);
  }

  // Recurring donors attend some events
  for (const p of (peopleByPersona["recurring_donor"] || [])) {
    if (faker.datatype.boolean(0.2)) attendees.add(p.id);
  }

  // Volunteer-to-donor and event-to-donor
  for (const p of (peopleByPersona["volunteer_to_donor"] || [])) {
    if (faker.datatype.boolean(0.3)) attendees.add(p.id);
  }
  for (const p of (peopleByPersona["event_to_donor"] || [])) {
    if (faker.datatype.boolean(0.5)) attendees.add(p.id);
  }

  // Fill up to a reasonable attendance (paid events fill more - 75-85%)
  const targetAttendance = event.ticket_price > 0
    ? Math.min(event.capacity, Math.round(event.capacity * faker.number.float({ min: 0.70, max: 0.90 })))
    : Math.min(event.capacity, Math.round(event.capacity * faker.number.float({ min: 0.45, max: 0.65 })));

  // Add random people to reach target
  const eligiblePeople = people.filter((p) =>
    !attendees.has(p.id) &&
    p._persona !== "dead_record" &&
    p._persona !== "foundation_contact"
  );
  const remaining = Math.max(0, targetAttendance - attendees.size);
  if (remaining > 0 && eligiblePeople.length > 0) {
    const extras = pickN(eligiblePeople, Math.min(remaining, eligiblePeople.length));
    for (const p of extras) attendees.add(p.id);
  }

  // Cap at capacity
  const attendeeList = [...attendees].slice(0, event.capacity);

  for (const personId of attendeeList) {
    const attended = faker.datatype.boolean(0.78) ? "yes" : "no";
    const regDate = isoDate(dateBetween(
      new Date(new Date(event.date).getTime() - 45 * 86400000),
      event.date
    ));
    registrations.push({
      id: regId++,
      person_id: personId,
      event_id: event.id,
      registered_at: regDate,
      attended,
      ticket_amount: event.ticket_price,
    });
  }
}

// ════════════════════════════════════════════
// 6. PAYMENTS (Persona-Driven, Revenue-Calibrated)
// ════════════════════════════════════════════
const payments = [];
let payId = 1;

// Month weights for individual donations (year-end heavy)
const monthWeights = [0.8, 0.8, 0.8, 1, 1, 0.6, 0.6, 0.6, 0.8, 1.2, 3, 5];

function weightedMonth(year) {
  const month = weightedPick(
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    monthWeights
  );
  return month;
}

function donationDate(year, month) {
  if (month === undefined) month = weightedMonth(year);
  return isoDate(randomDateInMonth(year, month));
}

// Gift amount distribution for regular one-time donors
function regularGiftAmount() {
  return weightedPick(
    [25, 50, 100, 150, 250, 500, 1000, 2500, 5000],
    [15, 25, 25, 12, 10, 6, 4, 2, 1]
  );
}

function addPayment(opts) {
  payments.push({
    id: payId++,
    person_id: opts.person_id,
    company_id: opts.company_id || "",
    amount: opts.amount,
    category: opts.category,
    payment_method: opts.payment_method || pick(["credit_card", "check", "ach", "online"]),
    payment_date: opts.payment_date,
    campaign_id: opts.campaign_id || "",
    notes: opts.notes || "",
  });
}

// --- Board Members: must donate, some at exactly $2,500 ---
for (const person of boardMembers) {
  for (const year of YEARS) {
    const isMinGive = faker.datatype.boolean(0.4);
    const amount = isMinGive ? 2500 : pick([2500, 5000, 10000, 15000, 25000]);
    const campaign = annualFundForYear(year);
    addPayment({
      person_id: person.id,
      amount,
      category: "donation",
      payment_date: donationDate(year),
      campaign_id: campaign?.id,
    });
    // Some board members give an additional year-end gift
    if (faker.datatype.boolean(0.4)) {
      const yeaCampaign = yearEndAppealForYear(year);
      addPayment({
        person_id: person.id,
        amount: pick([1000, 2500, 5000]),
        category: "donation",
        payment_date: donationDate(year, pick([11, 12])),
        campaign_id: yeaCampaign?.id,
      });
    }
  }
}

// --- Major Donors: $10K-$100K/year, increasing YoY ---
for (const person of (peopleByPersona["major_donor"] || [])) {
  const baseTarget = faker.number.int({ min: 15000, max: 80000 });
  for (const year of YEARS) {
    // 15-25% increase each year
    const yearMultiplier = 1 + (year - 2023) * 0.20;
    const annualTarget = Math.round(baseTarget * yearMultiplier);
    const numGifts = faker.number.int({ min: 1, max: 4 });
    let remaining = annualTarget;
    for (let g = 0; g < numGifts; g++) {
      const isLast = g === numGifts - 1;
      const amount = isLast ? remaining : Math.round(remaining * faker.number.float({ min: 0.2, max: 0.6 }));
      remaining -= amount;
      const campaign = pick([annualFundForYear(year), capitalCampaign, majorGiftsInitiative].filter(Boolean));
      addPayment({
        person_id: person.id,
        amount,
        category: "donation",
        payment_date: donationDate(year),
        campaign_id: campaign?.id,
        payment_method: pick(["check", "ach", "wire"]),
      });
    }
  }
}

// --- Mid-Level Donors: $1K-$5K/year ---
for (const person of (peopleByPersona["mid_level_donor"] || [])) {
  for (const year of YEARS) {
    const amount = pick([1000, 1500, 2000, 2500, 3000, 5000]);
    const numGifts = faker.number.int({ min: 1, max: 2 });
    for (let g = 0; g < numGifts; g++) {
      const giftAmt = numGifts === 1 ? amount : Math.round(amount / numGifts);
      addPayment({
        person_id: person.id,
        amount: giftAmt,
        category: "donation",
        payment_date: donationDate(year),
        campaign_id: pick([annualFundForYear(year)?.id, yearEndAppealForYear(year)?.id, ""].filter((x) => x !== undefined)),
      });
    }
  }
}

// --- Recurring Donors: monthly, same amount ---
for (const person of (peopleByPersona["recurring_donor"] || [])) {
  const monthlyAmount = pick([25, 50, 100, 250]);
  const startYear = pick([2023, 2023, 2024]);
  for (const year of YEARS) {
    if (year < startYear) continue;
    for (let month = 1; month <= 12; month++) {
      // ~30 day spacing, some variation
      const day = faker.number.int({ min: 1, max: 5 });
      const m = String(month).padStart(2, "0");
      const d = String(day).padStart(2, "0");
      addPayment({
        person_id: person.id,
        amount: monthlyAmount,
        category: "donation",
        payment_date: `${year}-${m}-${d}`,
        payment_method: pick(["credit_card", "ach"]),
        campaign_id: annualFundForYear(year)?.id || "",
      });
    }
  }
}

// --- Lapsed Donors: gave in 2023/2024, not 2025 ---
for (const person of (peopleByPersona["lapsed_donor"] || [])) {
  const gaveYears = faker.datatype.boolean(0.5) ? [2023, 2024] : [2023];
  for (const year of gaveYears) {
    const numGifts = faker.number.int({ min: 1, max: 3 });
    for (let g = 0; g < numGifts; g++) {
      addPayment({
        person_id: person.id,
        amount: regularGiftAmount(),
        category: "donation",
        payment_date: donationDate(year),
        campaign_id: pick([annualFundForYear(year)?.id, yearEndAppealForYear(year)?.id, ""]),
      });
    }
  }
}

// --- Upgraded Donors: increasing YoY ---
for (const person of (peopleByPersona["upgraded_donor"] || [])) {
  let baseAmount = pick([50, 100, 250]);
  for (const year of YEARS) {
    addPayment({
      person_id: person.id,
      amount: baseAmount,
      category: "donation",
      payment_date: donationDate(year),
      campaign_id: annualFundForYear(year)?.id || "",
    });
    baseAmount = Math.round(baseAmount * faker.number.float({ min: 1.3, max: 2.0 }));
  }
}

// --- Downgraded Donors: decreasing YoY ---
for (const person of (peopleByPersona["downgraded_donor"] || [])) {
  let baseAmount = pick([1000, 2500, 5000]);
  for (const year of YEARS) {
    addPayment({
      person_id: person.id,
      amount: baseAmount,
      category: "donation",
      payment_date: donationDate(year),
      campaign_id: annualFundForYear(year)?.id || "",
    });
    baseAmount = Math.max(25, Math.round(baseAmount * faker.number.float({ min: 0.3, max: 0.7 })));
  }
}

// --- Volunteer-to-Donor: volunteer in year N, donate in year N+1 ---
// (Volunteer hours generated later, donations here)
for (const person of (peopleByPersona["volunteer_to_donor"] || [])) {
  // Donate starting 2024 or 2025
  const donateStart = pick([2024, 2025]);
  for (const year of YEARS) {
    if (year < donateStart) continue;
    addPayment({
      person_id: person.id,
      amount: regularGiftAmount(),
      category: "donation",
      payment_date: donationDate(year),
      campaign_id: annualFundForYear(year)?.id || "",
    });
  }
}

// --- Event-to-Donor: attend event, donate within 30 days ---
for (const person of (peopleByPersona["event_to_donor"] || [])) {
  // Find an event they attended
  const theirRegs = registrations.filter((r) => r.person_id === person.id && r.attended === "yes");
  if (theirRegs.length > 0) {
    const reg = pick(theirRegs);
    const eventDate = new Date(events.find((e) => e.id === reg.event_id).date);
    const donateDate = addDays(eventDate, faker.number.int({ min: 1, max: 30 }));
    if (donateDate <= new Date("2025-12-31")) {
      addPayment({
        person_id: person.id,
        amount: regularGiftAmount(),
        category: "donation",
        payment_date: isoDate(donateDate),
      });
    }
  }
  // Also some additional regular giving
  if (faker.datatype.boolean(0.5)) {
    const year = pick([2024, 2025]);
    addPayment({
      person_id: person.id,
      amount: regularGiftAmount(),
      category: "donation",
      payment_date: donationDate(year),
    });
  }
}

// --- Staff: don't donate (1-2 exceptions) ---
const staffExceptions = pickN(staffMembers, Math.min(2, staffMembers.length));
for (const person of staffExceptions) {
  const year = pick(YEARS);
  addPayment({
    person_id: person.id,
    amount: pick([50, 100]),
    category: "donation",
    payment_date: donationDate(year),
    notes: "Staff gift",
  });
}

// --- Regular Donors: standard giving (grows with more donors giving in later years) ---
for (const person of (peopleByPersona["regular_donor"] || [])) {
  for (const year of YEARS) {
    // More likely to give in later years (acquisition growth)
    const giveProb = 0.55 + (year - 2023) * 0.08;
    if (faker.datatype.boolean(giveProb)) {
      const numGifts = faker.number.int({ min: 1, max: 3 });
      for (let g = 0; g < numGifts; g++) {
        addPayment({
          person_id: person.id,
          amount: regularGiftAmount(),
          category: "donation",
          payment_date: donationDate(year),
          campaign_id: pick([annualFundForYear(year)?.id, yearEndAppealForYear(year)?.id, "", ""]),
        });
      }
    }
  }
}

// --- GivingTuesday cluster (8-12 donations around Nov 28-Dec 3 each year) ---
for (const year of YEARS) {
  const gtDonors = pickN(
    people.filter((p) => ["regular_donor", "mid_level_donor", "recurring_donor", "board_member"].includes(p._persona)),
    faker.number.int({ min: 8, max: 12 })
  );
  for (const person of gtDonors) {
    const day = faker.number.int({ min: 28, max: 30 });
    const isNov = day <= 30;
    const date = isNov ? `${year}-11-${day}` : `${year}-12-0${day - 30}`;
    addPayment({
      person_id: person.id,
      amount: regularGiftAmount(),
      category: "donation",
      payment_date: date,
      campaign_id: yearEndAppealForYear(year)?.id || "",
      notes: "GivingTuesday",
    });
  }
}

// --- Grants from foundations ---
// Sort foundations deterministically so large/medium/small assignments are stable
const sortedFoundations = [...foundations].sort((a, b) => a.id - b.id);

for (const year of YEARS) {
  // Some foundations are new in later years (growth)
  const activeCount = year === 2023 ? 7 : year === 2024 ? 9 : 10;
  const active = sortedFoundations.slice(0, Math.min(activeCount, sortedFoundations.length));

  // Large grants (1-2 at $100K-$200K each)
  const largeGrantFdns = active.slice(0, 2);
  for (const fdn of largeGrantFdns) {
    const contact = people.find((p) => p.company_id === fdn.id);
    if (!contact) continue;
    const baseAmount = faker.number.int({ min: 125000, max: 200000 });
    const yearMultiplier = 1 + (year - 2023) * 0.12;
    addPayment({
      person_id: contact.id,
      company_id: fdn.id,
      amount: Math.round(baseAmount * yearMultiplier),
      category: "grant",
      payment_method: pick(["check", "ach", "wire"]),
      payment_date: isoDate(randomDateInYear(year)),
      campaign_id: pick([annualFundForYear(year)?.id, scholarshipFund?.id, ""]),
      notes: pick(["General operating", "Program support", "Capacity building"]),
    });
  }

  // Medium grants (3-4 at $25K-$75K each)
  const medGrantFdns = active.slice(2, 6);
  for (const fdn of medGrantFdns) {
    const contact = people.find((p) => p.company_id === fdn.id);
    if (!contact) continue;
    const baseAmount = pick([35000, 50000, 65000, 75000]);
    const yearMultiplier = 1 + (year - 2023) * 0.10;
    addPayment({
      person_id: contact.id,
      company_id: fdn.id,
      amount: Math.round(baseAmount * yearMultiplier),
      category: "grant",
      payment_method: pick(["check", "ach", "wire"]),
      payment_date: isoDate(randomDateInYear(year)),
      campaign_id: pick([annualFundForYear(year)?.id, scholarshipFund?.id, ""]),
      notes: pick(["Youth programs", "Education initiative", "Community outreach"]),
    });
  }

  // Small grants (3-4 at $5K-$25K each)
  const smallGrantFdns = active.slice(6);
  for (const fdn of smallGrantFdns) {
    const contact = people.find((p) => p.company_id === fdn.id);
    if (!contact) continue;
    addPayment({
      person_id: contact.id,
      company_id: fdn.id,
      amount: pick([5000, 10000, 15000, 20000, 25000]),
      category: "grant",
      payment_method: pick(["check", "ach"]),
      payment_date: isoDate(randomDateInYear(year)),
      campaign_id: "",
      notes: pick(["Restricted - programs", "Unrestricted", "Special project"]),
    });
  }
}

// --- Sponsorships from corporations (~$210K-$300K/year) ---
for (const year of YEARS) {
  // Tier structure grows over time
  const yearGrowth = year - 2023;
  const sponsorTiers = [
    { amount: 50000, label: "Title Sponsor", count: 1 + (yearGrowth >= 2 ? 1 : 0) },
    { amount: 25000, label: "Presenting Sponsor", count: 2 + yearGrowth },
    { amount: 10000, label: "Gold Sponsor", count: 4 + yearGrowth },
    { amount: 5000, label: "Silver Sponsor", count: 6 + yearGrowth },
  ];

  let corpIdx = 0;
  for (const tier of sponsorTiers) {
    for (let i = 0; i < tier.count && corpIdx < corporations.length; i++) {
      const corp = corporations[corpIdx++];
      const contact = people.find((p) => p.company_id === corp.id);
      if (!contact) continue;

      addPayment({
        person_id: contact.id,
        company_id: corp.id,
        amount: tier.amount,
        category: "sponsorship",
        payment_method: pick(["check", "ach", "wire"]),
        payment_date: isoDate(randomDateInYear(year)),
        campaign_id: springGalaForYear(year)?.id || "",
        notes: tier.label,
      });
    }
  }
}

// --- Event Ticket Payments ---
for (const reg of registrations) {
  if (reg.ticket_amount > 0) {
    addPayment({
      person_id: reg.person_id,
      amount: reg.ticket_amount,
      category: "event_ticket",
      payment_method: pick(["credit_card", "online"]),
      payment_date: reg.registered_at,
      campaign_id: events.find((e) => e.id === reg.event_id)?.campaign_id || "",
      notes: `Ticket for ${events.find((e) => e.id === reg.event_id)?.name}`,
    });
  }
}

// --- Service Payments (~$87K-$125K/year) ---
const serviceTypes = [
  { name: "Workshop fee", price: 75 },
  { name: "Program enrollment", price: 150 },
  { name: "Counseling session", price: 50 },
  { name: "Training fee", price: 100 },
  { name: "Youth program enrollment", price: 125 },
  { name: "After-school program", price: 200 },
  { name: "Summer camp registration", price: 350 },
  { name: "Professional development", price: 250 },
];

const servicePayerPersonas = ["service_only", "event_only", "regular_donor"];
const servicePayers = people.filter((p) => servicePayerPersonas.includes(p._persona));

for (const year of YEARS) {
  // Target: $87K (2023), $105K (2024), $125K (2025)
  const targetServiceRevenue = 87000 + (year - 2023) * 19000;
  let serviceTotal = 0;

  while (serviceTotal < targetServiceRevenue) {
    const person = pick(servicePayers);
    const svc = pick(serviceTypes);
    addPayment({
      person_id: person.id,
      amount: svc.price,
      category: "service",
      payment_method: pick(["credit_card", "online", "cash"]),
      payment_date: isoDate(randomDateInYear(year)),
      notes: svc.name,
    });
    serviceTotal += svc.price;
  }
}

// --- Unrestricted donations (30-50% have no campaign_id) ---
const donationPayments = payments.filter((p) => p.category === "donation");
const targetUnrestricted = Math.round(donationPayments.length * 0.4);
let unrestricted = 0;
for (const p of donationPayments) {
  if (p.campaign_id && unrestricted < targetUnrestricted && faker.datatype.boolean(0.45)) {
    p.campaign_id = "";
    unrestricted++;
  }
}

// ════════════════════════════════════════════
// 7. IN-KIND GIFTS
// ════════════════════════════════════════════
const inKindGifts = [];
let inkId = 1;

// Corporate in-kind gifts
for (const year of YEARS) {
  const numCorpGifts = faker.number.int({ min: 5, max: 8 });
  const giftCorps = pickN(corporations, Math.min(numCorpGifts, corporations.length));
  for (const corp of giftCorps) {
    const contact = people.find((p) => p.company_id === corp.id);
    if (!contact) continue;
    inKindGifts.push({
      id: inkId++,
      person_id: contact.id,
      company_id: corp.id,
      description: pick([
        "Catering for Spring Gala",
        "Office supplies donation",
        "Printed marketing materials",
        "Audio/visual equipment for event",
        "Food and beverages for volunteer appreciation",
        "Venue rental for fundraiser",
        "Technology equipment",
      ]),
      estimated_value: pick([2500, 5000, 7500, 10000, 15000, 25000]),
      date: isoDate(randomDateInYear(year)),
      category: "goods",
    });
  }
}

// Law firm pro bono
for (const year of YEARS) {
  for (const firm of lawFirms) {
    const contact = people.find((p) => p.company_id === firm.id);
    if (!contact) continue;
    if (faker.datatype.boolean(0.85)) {
      inKindGifts.push({
        id: inkId++,
        person_id: contact.id,
        company_id: firm.id,
        description: pick([
          "Pro bono legal services - contract review",
          "Pro bono legal services - employment law",
          "Pro bono legal services - nonprofit compliance",
          "Pro bono legal services - board governance",
        ]),
        estimated_value: pick([5000, 10000, 15000, 20000]),
        date: isoDate(randomDateInYear(year)),
        category: "services",
      });
    }
  }
}

// Individual in-kind gifts (ensure some are from people not in payments to widen donor definition)
for (const year of YEARS) {
  const individualGivers = pickN(
    people.filter((p) => !p.company_id && p._persona !== "dead_record"),
    faker.number.int({ min: 5, max: 8 })
  );
  for (const person of individualGivers) {
    inKindGifts.push({
      id: inkId++,
      person_id: person.id,
      company_id: "",
      description: pick([
        "Donated auction items",
        "Photography services for event",
        "Graphic design for annual report",
        "Website hosting for one year",
        "Used computers (5 units)",
        "Books and educational materials",
        "Floral arrangements for gala",
        "Musical performance at fundraiser",
        "Catering supplies",
      ]),
      estimated_value: pick([500, 1000, 2000, 3000, 5000]),
      date: isoDate(randomDateInYear(year)),
      category: pick(["goods", "services"]),
    });
  }
}

// ════════════════════════════════════════════
// 8. MEMBERSHIPS
// ════════════════════════════════════════════
const membershipLevels = [
  { name: "Basic", fee: 75 },
  { name: "Silver", fee: 250 },
  { name: "Gold", fee: 500 },
  { name: "Platinum", fee: 1000 },
  { name: "Benefactor", fee: 2500 },
];

const memberships = [];
let memId = 1;

// Select members - mix of personas
const memberCandidates = people.filter((p) =>
  !["dead_record", "staff", "foundation_contact"].includes(p._persona)
);
const memberPool = pickN(memberCandidates, Math.min(180, memberCandidates.length));

for (const person of memberPool) {
  // Assign level based on persona
  let level;
  if (person._persona === "board_member" || person._persona === "major_donor") {
    level = pick([membershipLevels[3], membershipLevels[4]]); // Platinum or Benefactor
  } else if (person._persona === "mid_level_donor") {
    level = pick([membershipLevels[2], membershipLevels[3]]); // Gold or Platinum
  } else {
    level = weightedPick(membershipLevels, [40, 25, 15, 10, 5]);
  }

  // Membership lifecycle - some start in 2023, some later
  const startYear = pick([2023, 2023, 2024, 2024, 2025]);
  for (let year = startYear; year <= 2025; year++) {
    // Renewal clustering around Jan-Mar
    const renewMonth = faker.number.int({ min: 1, max: 3 });
    const startDate = `${year}-${String(renewMonth).padStart(2, "0")}-${String(faker.number.int({ min: 1, max: 28 })).padStart(2, "0")}`;
    const endDate = `${year + 1}-${String(renewMonth).padStart(2, "0")}-${String(faker.number.int({ min: 1, max: 28 })).padStart(2, "0")}`;

    let status;
    if (year === 2025) {
      status = "active";
    } else if (faker.datatype.boolean(0.15)) {
      // Some don't renew
      status = "expired";
      memberships.push({ id: memId++, person_id: person.id, level: level.name, fee: level.fee, start_date: startDate, end_date: endDate, status });
      break; // Don't continue to next year
    } else {
      status = "expired"; // Past year memberships are expired
    }

    memberships.push({
      id: memId++,
      person_id: person.id,
      level: level.name,
      fee: level.fee,
      start_date: startDate,
      end_date: endDate,
      status,
    });
  }
}

// ════════════════════════════════════════════
// 9. VOLUNTEER HOURS
// ════════════════════════════════════════════
const volunteerHours = [];
let volId = 1;

const volunteerActivities = [
  "Event setup",
  "Mentoring",
  "Office admin",
  "Fundraising calls",
  "Data entry",
  "Teaching",
  "Transportation",
  "Board meeting",
  "Committee work",
  "Community outreach",
];

// Volunteer-to-donor people volunteer first (before they donate)
for (const person of (peopleByPersona["volunteer_to_donor"] || [])) {
  // Heavy volunteering in 2023, continues but also starts donating
  for (const year of YEARS) {
    const numEntries = year === 2023 ? faker.number.int({ min: 4, max: 8 }) : faker.number.int({ min: 1, max: 4 });
    for (let e = 0; e < numEntries; e++) {
      const nearEvent = faker.datatype.boolean(0.4) ? pick(eventsInYear(year)) : null;
      volunteerHours.push({
        id: volId++,
        person_id: person.id,
        date: nearEvent ? nearEvent.date : isoDate(randomDateInYear(year)),
        hours: faker.number.float({ min: 2, max: 8, fractionDigits: 1 }),
        activity: nearEvent ? "Event setup" : pick(volunteerActivities),
        event_id: nearEvent ? nearEvent.id : "",
      });
    }
  }
}

// Board members volunteer (board meetings, committee work)
for (const person of boardMembers) {
  for (const year of YEARS) {
    // Board meetings - roughly quarterly
    for (let q = 0; q < 4; q++) {
      const month = q * 3 + faker.number.int({ min: 1, max: 3 });
      volunteerHours.push({
        id: volId++,
        person_id: person.id,
        date: isoDate(randomDateInMonth(year, Math.min(month, 12))),
        hours: faker.number.float({ min: 2, max: 4, fractionDigits: 1 }),
        activity: "Board meeting",
        event_id: "",
      });
    }
    // Committee work
    if (faker.datatype.boolean(0.6)) {
      volunteerHours.push({
        id: volId++,
        person_id: person.id,
        date: isoDate(randomDateInYear(year)),
        hours: faker.number.float({ min: 2, max: 6, fractionDigits: 1 }),
        activity: "Committee work",
        event_id: "",
      });
    }
  }
}

// General volunteers
const generalVolunteers = people.filter((p) =>
  ["regular_donor", "event_only", "recurring_donor"].includes(p._persona)
);
const activeVolunteers = pickN(generalVolunteers, Math.min(60, generalVolunteers.length));

for (const person of activeVolunteers) {
  for (const year of YEARS) {
    if (faker.datatype.boolean(0.5)) continue;
    const numEntries = faker.number.int({ min: 1, max: 4 });
    for (let e = 0; e < numEntries; e++) {
      const nearEvent = faker.datatype.boolean(0.5) ? pick(eventsInYear(year)) : null;
      volunteerHours.push({
        id: volId++,
        person_id: person.id,
        date: nearEvent ? nearEvent.date : isoDate(randomDateInYear(year)),
        hours: faker.number.float({ min: 1, max: 6, fractionDigits: 1 }),
        activity: nearEvent ? pick(["Event setup", "Transportation"]) : pick(volunteerActivities),
        event_id: nearEvent ? nearEvent.id : "",
      });
    }
  }
}

// Staff volunteer hours (program delivery)
for (const person of staffMembers) {
  for (const year of YEARS) {
    const numEntries = faker.number.int({ min: 2, max: 5 });
    for (let e = 0; e < numEntries; e++) {
      volunteerHours.push({
        id: volId++,
        person_id: person.id,
        date: isoDate(randomDateInYear(year)),
        hours: faker.number.float({ min: 2, max: 8, fractionDigits: 1 }),
        activity: pick(["Community outreach", "Teaching", "Mentoring", "Event setup"]),
        event_id: faker.datatype.boolean(0.3) ? pick(eventsInYear(year))?.id || "" : "",
      });
    }
  }
}

// ════════════════════════════════════════════
// 10. POST-PROCESSING
// ════════════════════════════════════════════

// --- Reverse-calibrate campaign goals ---
for (const campaign of campaigns) {
  const campaignPayments = payments.filter((p) => String(p.campaign_id) === String(campaign.id));
  const totalRaised = campaignPayments.reduce((sum, p) => sum + p.amount, 0);
  // Goal is 90-110% of what was actually raised
  const goalMultiplier = faker.number.float({ min: 0.9, max: 1.1 });
  campaign.goal_amount = Math.round(totalRaised * goalMultiplier);
  if (campaign.goal_amount === 0) campaign.goal_amount = faker.number.int({ min: 10000, max: 50000 });
}

// --- Revenue summary ---
console.log("\n=== Revenue Summary ===\n");
for (const year of YEARS) {
  const yearPayments = payments.filter((p) => p.payment_date.startsWith(`${year}-`));
  const total = yearPayments.reduce((sum, p) => sum + p.amount, 0);
  const byCategory = {};
  for (const p of yearPayments) {
    byCategory[p.category] = (byCategory[p.category] || 0) + p.amount;
  }
  console.log(`  ${year}: $${total.toLocaleString()} total`);
  for (const [cat, amt] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${cat}: $${amt.toLocaleString()} (${((amt / total) * 100).toFixed(1)}%)`);
  }
}

// --- Strip internal fields before writing ---
const cleanPeople = people.map(({ _persona, ...rest }) => rest);

// ─── Write all CSVs ───
console.log("\nGenerating CSVs...\n");

writeCsv("people.csv", ["id", "first_name", "last_name", "email", "phone", "address", "city", "state", "zip", "company_id", "role", "created_at"], cleanPeople);
writeCsv("companies.csv", ["id", "name", "type", "address", "city", "state", "zip", "website", "primary_contact_id", "created_at"], companies);
writeCsv("campaigns.csv", ["id", "name", "goal_amount", "start_date", "end_date", "status"], campaigns);
writeCsv("events.csv", ["id", "name", "date", "location", "capacity", "ticket_price", "campaign_id"], events);
writeCsv("registrations.csv", ["id", "person_id", "event_id", "registered_at", "attended", "ticket_amount"], registrations);
writeCsv("payments.csv", ["id", "person_id", "company_id", "amount", "category", "payment_method", "payment_date", "campaign_id", "notes"], payments);
writeCsv("in_kind_gifts.csv", ["id", "person_id", "company_id", "description", "estimated_value", "date", "category"], inKindGifts);
writeCsv("memberships.csv", ["id", "person_id", "level", "fee", "start_date", "end_date", "status"], memberships);
writeCsv("volunteer_hours.csv", ["id", "person_id", "date", "hours", "activity", "event_id"], volunteerHours);

// ─── Write combined JSON ───
const dataset = {
  people: cleanPeople,
  companies,
  campaigns,
  events,
  registrations,
  payments,
  in_kind_gifts: inKindGifts,
  memberships,
  volunteer_hours: volunteerHours,
};
fs.writeFileSync(path.join(DATA_DIR, "dataset.json"), JSON.stringify(dataset, null, 2) + "\n");
console.log(`  dataset.json: ${Object.keys(dataset).length} tables`);

console.log("\nDone!");
