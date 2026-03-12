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

// ─── Config ───
const NUM_PEOPLE = 200;
const NUM_COMPANIES = 30;
const NUM_EVENTS = 12;
const NUM_CAMPAIGNS = 8;

// ─── Companies ───
const companyTypes = ["Corporation", "Foundation", "Business", "Law Firm", "Nonprofit", "University", "Government"];
const companies = [];
for (let i = 1; i <= NUM_COMPANIES; i++) {
  companies.push({
    id: i,
    name: faker.company.name(),
    type: faker.helpers.arrayElement(companyTypes),
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    zip: faker.location.zipCode(),
    website: faker.internet.url(),
    primary_contact_id: "", // filled after people are created
    created_at: faker.date.between({ from: "2020-01-01", to: "2025-06-01" }).toISOString().split("T")[0],
  });
}

// ─── People ───
const personRoles = [
  "Individual Donor",
  "Board Member",
  "Volunteer",
  "Program Participant",
  "Event Attendee",
  "Staff",
  "Corporate Contact",
  "Foundation Contact",
];
const people = [];
for (let i = 1; i <= NUM_PEOPLE; i++) {
  const hasCompany = i <= NUM_COMPANIES || faker.datatype.boolean(0.3);
  const companyId = hasCompany
    ? i <= NUM_COMPANIES
      ? i
      : faker.helpers.arrayElement(companies).id
    : "";
  const role = companyId
    ? faker.helpers.arrayElement(["Corporate Contact", "Foundation Contact", "Accounts Payable", "VP of Giving", "CSR Manager", "Executive Director", "Program Officer"])
    : faker.helpers.arrayElement(personRoles);

  people.push({
    id: i,
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    email: faker.internet.email(),
    phone: faker.phone.number({ style: "national" }),
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    zip: faker.location.zipCode(),
    company_id: companyId,
    role: role,
    created_at: faker.date.between({ from: "2020-01-01", to: "2026-01-01" }).toISOString().split("T")[0],
  });
}

// Assign primary contacts to companies
for (const co of companies) {
  const contacts = people.filter((p) => p.company_id === co.id);
  if (contacts.length > 0) {
    co.primary_contact_id = contacts[0].id;
  }
}

// ─── Campaigns ───
const campaignNames = [
  "Annual Fund 2025",
  "Annual Fund 2024",
  "Capital Campaign - New Building",
  "Year-End Appeal 2025",
  "Year-End Appeal 2024",
  "Spring Gala 2025",
  "Emergency Relief Fund",
  "Scholarship Fund",
];
const campaigns = [];
for (let i = 1; i <= NUM_CAMPAIGNS; i++) {
  const start = faker.date.between({ from: "2024-01-01", to: "2025-12-01" });
  const end = new Date(start);
  end.setMonth(end.getMonth() + faker.number.int({ min: 1, max: 6 }));
  campaigns.push({
    id: i,
    name: campaignNames[i - 1] || faker.commerce.productName() + " Campaign",
    goal_amount: faker.number.int({ min: 10000, max: 500000 }),
    start_date: start.toISOString().split("T")[0],
    end_date: end.toISOString().split("T")[0],
    status: faker.helpers.arrayElement(["active", "active", "completed", "completed"]),
  });
}

// ─── Events ───
const eventNames = [
  "Spring Gala 2025",
  "Fall Fundraiser 2025",
  "Community Health Fair",
  "Volunteer Appreciation Dinner",
  "5K Fun Run for Education",
  "Annual Board Retreat",
  "Holiday Giving Luncheon",
  "Youth Mentorship Kickoff",
  "Donor Appreciation Night",
  "Summer Picnic",
  "Leadership Conference",
  "Year-End Celebration",
];
const events = [];
for (let i = 1; i <= NUM_EVENTS; i++) {
  const eventDate = faker.date.between({ from: "2024-06-01", to: "2026-03-01" });
  events.push({
    id: i,
    name: eventNames[i - 1],
    date: eventDate.toISOString().split("T")[0],
    location: faker.location.streetAddress() + ", " + faker.location.city(),
    capacity: faker.number.int({ min: 50, max: 500 }),
    ticket_price: faker.helpers.arrayElement([0, 0, 25, 50, 75, 100, 150, 250]),
    campaign_id: faker.helpers.arrayElement([...campaigns.map((c) => c.id), "", ""]),
  });
}

// ─── Registrations ───
const registrations = [];
let regId = 1;
for (const event of events) {
  const numAttendees = faker.number.int({ min: 15, max: Math.min(80, event.capacity) });
  const attendees = faker.helpers.arrayElements(people, numAttendees);
  for (const person of attendees) {
    registrations.push({
      id: regId++,
      person_id: person.id,
      event_id: event.id,
      registered_at: faker.date
        .between({
          from: new Date(new Date(event.date).getTime() - 60 * 86400000),
          to: event.date,
        })
        .toISOString()
        .split("T")[0],
      attended: faker.helpers.arrayElement(["yes", "yes", "yes", "no"]),
      ticket_amount: event.ticket_price,
    });
  }
}

// ─── Payments ───
// Categories: donation, grant, sponsorship, service, event_ticket, membership
const payments = [];
let payId = 1;

// Individual donations
const donors = faker.helpers.arrayElements(people.filter((p) => !p.company_id), 60);
for (const person of donors) {
  const numGifts = faker.number.int({ min: 1, max: 5 });
  for (let g = 0; g < numGifts; g++) {
    payments.push({
      id: payId++,
      person_id: person.id,
      company_id: "",
      amount: faker.helpers.arrayElement([25, 50, 100, 100, 250, 250, 500, 1000, 2500, 5000]),
      category: "donation",
      payment_method: faker.helpers.arrayElement(["credit_card", "check", "ach", "cash", "online"]),
      payment_date: faker.date.between({ from: "2024-01-01", to: "2026-02-28" }).toISOString().split("T")[0],
      campaign_id: faker.helpers.arrayElement([...campaigns.map((c) => c.id), ""]),
      notes: "",
    });
  }
}

// Grants from foundations
const foundations = companies.filter((c) => c.type === "Foundation");
for (const fdn of foundations) {
  const contact = people.find((p) => p.company_id === fdn.id);
  if (!contact) continue;
  const numGrants = faker.number.int({ min: 1, max: 3 });
  for (let g = 0; g < numGrants; g++) {
    payments.push({
      id: payId++,
      person_id: contact.id,
      company_id: fdn.id,
      amount: faker.helpers.arrayElement([10000, 25000, 50000, 75000, 100000]),
      category: "grant",
      payment_method: faker.helpers.arrayElement(["check", "ach", "wire"]),
      payment_date: faker.date.between({ from: "2024-01-01", to: "2026-02-28" }).toISOString().split("T")[0],
      campaign_id: faker.helpers.arrayElement(campaigns.map((c) => c.id)),
      notes: faker.lorem.sentence(),
    });
  }
}

// Corporate sponsorships
const corps = companies.filter((c) => c.type === "Corporation" || c.type === "Business");
for (const corp of corps) {
  const contact = people.find((p) => p.company_id === corp.id);
  if (!contact) continue;
  if (!faker.datatype.boolean(0.6)) continue;
  payments.push({
    id: payId++,
    person_id: contact.id,
    company_id: corp.id,
    amount: faker.helpers.arrayElement([5000, 10000, 15000, 25000, 50000]),
    category: "sponsorship",
    payment_method: faker.helpers.arrayElement(["check", "ach", "wire"]),
    payment_date: faker.date.between({ from: "2024-01-01", to: "2026-02-28" }).toISOString().split("T")[0],
    campaign_id: faker.helpers.arrayElement(campaigns.map((c) => c.id)),
    notes: faker.helpers.arrayElement(["Event sponsor", "Program sponsor", "Title sponsor", "Gold sponsor"]),
  });
}

// Service payments (people paying FOR services — these are NOT donations)
const participants = people.filter((p) => p.role === "Program Participant" || p.role === "Event Attendee");
for (const person of faker.helpers.arrayElements(participants, Math.min(20, participants.length))) {
  payments.push({
    id: payId++,
    person_id: person.id,
    company_id: "",
    amount: faker.helpers.arrayElement([50, 75, 100, 150, 200, 350, 500]),
    category: "service",
    payment_method: faker.helpers.arrayElement(["credit_card", "online", "cash"]),
    payment_date: faker.date.between({ from: "2024-06-01", to: "2026-02-28" }).toISOString().split("T")[0],
    campaign_id: "",
    notes: faker.helpers.arrayElement(["Workshop fee", "Program tuition", "Counseling session", "Training fee"]),
  });
}

// Event ticket payments
for (const reg of registrations) {
  if (reg.ticket_amount > 0) {
    payments.push({
      id: payId++,
      person_id: reg.person_id,
      company_id: "",
      amount: reg.ticket_amount,
      category: "event_ticket",
      payment_method: faker.helpers.arrayElement(["credit_card", "online"]),
      payment_date: reg.registered_at,
      campaign_id: events.find((e) => e.id === reg.event_id)?.campaign_id || "",
      notes: `Ticket for ${events.find((e) => e.id === reg.event_id)?.name}`,
    });
  }
}

// ─── In-Kind Gifts ───
const inKindGifts = [];
let inkId = 1;

// Catering company donating food
const caterers = companies.filter((c) => c.name.toLowerCase().includes("cater") || c.type === "Business");
for (const co of faker.helpers.arrayElements(corps, Math.min(5, corps.length))) {
  const contact = people.find((p) => p.company_id === co.id);
  if (!contact) continue;
  inKindGifts.push({
    id: inkId++,
    person_id: contact.id,
    company_id: co.id,
    description: faker.helpers.arrayElement([
      "Catering for Spring Gala",
      "Office supplies donation",
      "Printed marketing materials",
      "Audio/visual equipment for event",
      "Food and beverages for volunteer appreciation",
    ]),
    estimated_value: faker.helpers.arrayElement([2500, 5000, 10000, 15000, 25000]),
    date: faker.date.between({ from: "2024-01-01", to: "2026-02-28" }).toISOString().split("T")[0],
    category: "goods",
  });
}

// Law firm donating pro bono services
const lawFirms = companies.filter((c) => c.type === "Law Firm");
for (const firm of lawFirms) {
  const contact = people.find((p) => p.company_id === firm.id);
  if (!contact) continue;
  inKindGifts.push({
    id: inkId++,
    person_id: contact.id,
    company_id: firm.id,
    description: faker.helpers.arrayElement([
      "Pro bono legal services - contract review",
      "Pro bono legal services - employment law",
      "Pro bono legal services - nonprofit compliance",
    ]),
    estimated_value: faker.helpers.arrayElement([5000, 10000, 15000, 20000]),
    date: faker.date.between({ from: "2024-01-01", to: "2026-02-28" }).toISOString().split("T")[0],
    category: "services",
  });
}

// Individual in-kind gifts
for (const person of faker.helpers.arrayElements(people.filter((p) => !p.company_id), 8)) {
  inKindGifts.push({
    id: inkId++,
    person_id: person.id,
    company_id: "",
    description: faker.helpers.arrayElement([
      "Donated auction items",
      "Photography services for event",
      "Graphic design for annual report",
      "Website hosting for one year",
      "Used computers (5 units)",
      "Books and educational materials",
    ]),
    estimated_value: faker.helpers.arrayElement([500, 1000, 2000, 3000, 5000]),
    date: faker.date.between({ from: "2024-01-01", to: "2026-02-28" }).toISOString().split("T")[0],
    category: faker.helpers.arrayElement(["goods", "services"]),
  });
}


// ─── Memberships ───
const memberships = [];
let memId = 1;
const membershipLevels = [
  { name: "Basic", fee: 50 },
  { name: "Silver", fee: 150 },
  { name: "Gold", fee: 500 },
  { name: "Platinum", fee: 1000 },
];
for (const person of faker.helpers.arrayElements(people, 40)) {
  const level = faker.helpers.arrayElement(membershipLevels);
  const startDate = faker.date.between({ from: "2024-01-01", to: "2025-12-01" });
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 1);
  memberships.push({
    id: memId++,
    person_id: person.id,
    level: level.name,
    fee: level.fee,
    start_date: startDate.toISOString().split("T")[0],
    end_date: endDate.toISOString().split("T")[0],
    status: faker.helpers.arrayElement(["active", "active", "active", "expired", "cancelled"]),
  });
}

// ─── Volunteer Hours ───
const volunteerHours = [];
let volId = 1;
const volunteers = people.filter((p) => p.role === "Volunteer" || p.role === "Board Member");
for (const person of [...volunteers, ...faker.helpers.arrayElements(people, 15)]) {
  const numEntries = faker.number.int({ min: 1, max: 6 });
  for (let e = 0; e < numEntries; e++) {
    volunteerHours.push({
      id: volId++,
      person_id: person.id,
      date: faker.date.between({ from: "2024-01-01", to: "2026-02-28" }).toISOString().split("T")[0],
      hours: faker.number.float({ min: 1, max: 8, fractionDigits: 1 }),
      activity: faker.helpers.arrayElement([
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
      ]),
      event_id: faker.helpers.arrayElement([...events.map((e) => e.id), "", "", ""]),
    });
  }
}

// ─── Write all CSVs ───
console.log("Generating CSVs...\n");

writeCsv("people.csv", ["id", "first_name", "last_name", "email", "phone", "address", "city", "state", "zip", "company_id", "role", "created_at"], people);
writeCsv("companies.csv", ["id", "name", "type", "address", "city", "state", "zip", "website", "primary_contact_id", "created_at"], companies);
writeCsv("campaigns.csv", ["id", "name", "goal_amount", "start_date", "end_date", "status"], campaigns);
writeCsv("events.csv", ["id", "name", "date", "location", "capacity", "ticket_price", "campaign_id"], events);
writeCsv("registrations.csv", ["id", "person_id", "event_id", "registered_at", "attended", "ticket_amount"], registrations);
writeCsv("payments.csv", ["id", "person_id", "company_id", "amount", "category", "payment_method", "payment_date", "campaign_id", "notes"], payments);
writeCsv("in_kind_gifts.csv", ["id", "person_id", "company_id", "description", "estimated_value", "date", "category"], inKindGifts);
writeCsv("memberships.csv", ["id", "person_id", "level", "fee", "start_date", "end_date", "status"], memberships);
writeCsv("volunteer_hours.csv", ["id", "person_id", "date", "hours", "activity", "event_id"], volunteerHours);

console.log("\nDone!");
