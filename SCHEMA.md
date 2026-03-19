# Nonprofit CRM Data Model

This is a synthetic dataset representing a mid-size nonprofit's CRM (constituent relationship management) system — a ~$2.5M/year organization with 20% YoY growth across 2023-2025 (~$6.1M total revenue, 500 constituents). Use it to practice querying, analyzing, and building reports — the kind of work that helps nonprofit leaders make better decisions.

## Why This Exists

This dataset accompanies a newsletter post called "What Is a Forest?" The core idea: **definitions matter**, and the nonprofit sector suffers from fuzzy ones.

Scientists examined ten datasets to see how forests were defined and found they only agreed on around 26% of the world's forest. The nonprofit sector has the same problem. A simple request like "give me a list of our donors" can produce five different answers depending on who you ask — because nobody agreed on what "donor" means.

This dataset is designed to make that problem tangible. The `payments` table includes donations, grants, sponsorships, service fees, and event tickets — all money flowing in, but only some of it is charitable giving. The `in_kind_gifts` table tracks non-cash contributions separately. Depending on how you define "donor," you get a different count:

1. Anyone who paid us anything → **too broad** (includes ticket buyers and service fees)
2. People with a payment categorized as "donation" → misses grants and corporate sponsors
3. Donations + grants + sponsorships → misses in-kind contributors
4. All of the above + in-kind gifts → the broadest reasonable definition

The goal is to help nonprofit leaders **feel like data analysts** — to see how definitions change outcomes and to explore the data through different lenses. Encourage exploration, not just reporting.

## How to Use This

There are two ways to explore this data with an LLM:

### Option 1: Ask Questions About the Data
Share this URL with ChatGPT, Claude, or another LLM and ask questions in plain English. The LLM can fetch the CSV files directly from GitHub.

**CSV files:**
- [people.csv](https://raw.githubusercontent.com/tedkriwiel/nonprofit-data-playground/main/data/people.csv)
- [companies.csv](https://raw.githubusercontent.com/tedkriwiel/nonprofit-data-playground/main/data/companies.csv)
- [payments.csv](https://raw.githubusercontent.com/tedkriwiel/nonprofit-data-playground/main/data/payments.csv)
- [in_kind_gifts.csv](https://raw.githubusercontent.com/tedkriwiel/nonprofit-data-playground/main/data/in_kind_gifts.csv)
- [events.csv](https://raw.githubusercontent.com/tedkriwiel/nonprofit-data-playground/main/data/events.csv)
- [registrations.csv](https://raw.githubusercontent.com/tedkriwiel/nonprofit-data-playground/main/data/registrations.csv)
- [campaigns.csv](https://raw.githubusercontent.com/tedkriwiel/nonprofit-data-playground/main/data/campaigns.csv)
- [memberships.csv](https://raw.githubusercontent.com/tedkriwiel/nonprofit-data-playground/main/data/memberships.csv)
- [volunteer_hours.csv](https://raw.githubusercontent.com/tedkriwiel/nonprofit-data-playground/main/data/volunteer_hours.csv)

**Example prompt:** "Fetch the CSV files above and tell me which donors gave last year but not this year."

### Option 2: Build a Dashboard
The file [`dashboard.html`](https://github.com/tedkriwiel/nonprofit-data-playground/blob/main/dashboard.html) is a self-contained HTML dashboard with all the data already embedded. No server required — just download and open in your browser.

To customize it, share the dashboard URL with an LLM and ask it to modify the file. The HTML includes instructions the LLM can read to understand the data model and generate a new version.

**Example prompts:**
- "Read this dashboard file and add a chart showing donor retention year over year."
- "Modify this dashboard to focus on volunteer engagement instead of fundraising."
- "Add a section showing which campaigns are on track to hit their goals."

The LLM will return a complete HTML file you can save and open locally.

## Tables

### people.csv
Every individual the organization has a relationship with — donors, volunteers, staff, board members, event attendees, and program participants.

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| first_name | string | |
| last_name | string | |
| email | string | |
| phone | string | |
| address | string | Street address |
| city | string | |
| state | string | Two-letter abbreviation |
| zip | string | |
| company_id | integer (nullable) | Foreign key → companies.id. Empty if the person has no organizational affiliation |
| role | string | One of: Individual Donor, Board Member, Volunteer, Program Participant, Event Attendee, Staff, Corporate Contact, Foundation Contact, Accounts Payable, VP of Giving, CSR Manager, Executive Director, Program Officer |
| created_at | date | YYYY-MM-DD |

### companies.csv
Organizations the nonprofit has relationships with — corporate sponsors, foundations that give grants, law firms providing pro bono services, etc.

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| name | string | |
| type | string | One of: Corporation, Foundation, Business, Law Firm, Nonprofit, University, Government |
| address | string | |
| city | string | |
| state | string | |
| zip | string | |
| website | string | |
| primary_contact_id | integer | Foreign key → people.id. The main point of contact at this organization |
| created_at | date | YYYY-MM-DD |

### payments.csv
All monetary transactions. This is the most important table for fundraising analysis. Note: **not all payments are donations**. This table also includes event ticket purchases and service fees, which are revenue but not charitable contributions.

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| person_id | integer | Foreign key → people.id. The individual who made or facilitated the payment |
| company_id | integer (nullable) | Foreign key → companies.id. Present for grants and sponsorships to identify the organization |
| amount | decimal | Dollar amount (always positive) |
| category | string | **One of: donation, grant, sponsorship, service, event_ticket** |
| payment_method | string | One of: credit_card, check, ach, cash, online, wire |
| payment_date | date | YYYY-MM-DD |
| campaign_id | integer (nullable) | Foreign key → campaigns.id. Which campaign this payment was attributed to |
| notes | string (nullable) | |

**Category definitions:**
- **donation** — A charitable gift from an individual (person_id only, no company_id)
- **grant** — Funding from a foundation (has both person_id for the contact and company_id for the foundation)
- **sponsorship** — Corporate sponsorship (has both person_id and company_id)
- **service** — Fee paid BY a participant for programs, workshops, counseling, etc. This is earned revenue, NOT a donation
- **event_ticket** — Ticket purchase for a fundraising event. This is event revenue, NOT a donation

### in_kind_gifts.csv
Non-cash contributions — donated goods or pro bono services. These are tracked separately from payments because no money changes hands.

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| person_id | integer | Foreign key → people.id |
| company_id | integer (nullable) | Foreign key → companies.id. Present when the gift comes from an organization |
| description | string | What was donated (e.g., "Pro bono legal services", "Catering for Spring Gala") |
| estimated_value | decimal | Fair market value in dollars |
| date | date | YYYY-MM-DD |
| category | string | One of: goods, services |

### events.csv
Fundraising events, community events, and internal gatherings.

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| name | string | |
| date | date | YYYY-MM-DD |
| location | string | |
| capacity | integer | Maximum attendees |
| ticket_price | decimal | 0 for free events |
| campaign_id | integer (nullable) | Foreign key → campaigns.id |

### registrations.csv
Event attendance records — who registered and whether they showed up.

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| person_id | integer | Foreign key → people.id |
| event_id | integer | Foreign key → events.id |
| registered_at | date | YYYY-MM-DD |
| attended | string | "yes" or "no" |
| ticket_amount | decimal | What they paid (0 for free events) |

### campaigns.csv
Fundraising campaigns that payments and events can be attributed to.

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| name | string | e.g., "Annual Fund 2025", "Capital Campaign - New Building" |
| goal_amount | decimal | Fundraising target |
| start_date | date | YYYY-MM-DD |
| end_date | date | YYYY-MM-DD |
| status | string | One of: active, completed |

### memberships.csv
Membership program records.

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| person_id | integer | Foreign key → people.id |
| level | string | One of: Basic ($75), Silver ($250), Gold ($500), Platinum ($1,000), Benefactor ($2,500) |
| fee | decimal | Annual fee |
| start_date | date | YYYY-MM-DD |
| end_date | date | YYYY-MM-DD |
| status | string | One of: active, expired, cancelled |

### volunteer_hours.csv
Tracked volunteer time.

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| person_id | integer | Foreign key → people.id |
| date | date | YYYY-MM-DD |
| hours | decimal | Hours volunteered |
| activity | string | One of: Event setup, Mentoring, Office admin, Fundraising calls, Data entry, Teaching, Transportation, Board meeting, Committee work, Community outreach |
| event_id | integer (nullable) | Foreign key → events.id. Present if the hours were tied to a specific event |

## Relationships

```
people ──┬── payments (person_id)
         ├── in_kind_gifts (person_id)
         ├── registrations (person_id)
         ├── memberships (person_id)
         ├── volunteer_hours (person_id)
         └── companies (primary_contact_id)

companies ──┬── people (company_id)
            ├── payments (company_id)
            └── in_kind_gifts (company_id)

campaigns ──┬── payments (campaign_id)
            └── events (campaign_id)

events ──┬── registrations (event_id)
         └── volunteer_hours (event_id)
```

## Rules for LLMs

When answering questions or generating code from this dataset:

1. **Only reference columns and values that exist in the schema above.** Do not invent columns, tables, or enum values. For example, there is no `in_kind` category in payments — in-kind gifts are a separate table.
2. **Every number must be computed from the data.** Never hardcode, estimate, or approximate a value.
3. **Verify joins before using them.** Only the relationships listed above are valid. Do not assume relationships that aren't documented.
4. **Show your work.** When computing a metric, state which table(s) and column(s) you're using so the user can verify.

## Common Questions You Can Ask

**Fundraising:**
- Who are our top 10 donors by total giving?
- Which donors gave last year but not this year (lapsed donors)?
- How much has each campaign raised vs. its goal?
- What's our average gift size? How has it changed over time?
- How many donors give more than once (retention)?

**Events:**
- What's our average attendance rate (registered vs. attended)?
- Which events generate the most revenue?
- Who attends the most events?

**Volunteers:**
- Who are our most active volunteers?
- How many volunteer hours are tied to events vs. independent?
- Which activities consume the most volunteer time?

**Organizations:**
- Which foundations have given us the largest grants?
- Which corporations sponsor us?
- What's the total value of in-kind contributions?

**Defining "Donor":**
A critical question for any nonprofit. Depending on your definition, the number of "donors" changes significantly:
- People who made **any payment** → ~420 people (includes service fees and ticket buyers — too broad)
- People with a payment categorized as **"donation"** → ~250 people (misses grants and sponsorships)
- People with **donation, grant, or sponsorship** payments → ~280 people (misses in-kind contributors)
- People with donation/grant/sponsorship payments **OR** an in-kind gift → ~290 people (broadest reasonable definition)

The gap between 250 and 420 is the whole point — definitions matter. Try each definition and see how the count changes.
