# Nonprofit CRM Data Model

Synthetic dataset: mid-size nonprofit CRM, ~$2.5M/year with 20% YoY growth across 2023-2025 (~$6.1M total revenue, 500 constituents).

## Rules for LLMs

1. **Only reference columns and values that exist in the schema below.** Do not invent columns, tables, or enum values. There is no `in_kind` category in payments — in-kind gifts are a separate table.
2. **Every number must be computed from the data.** Never hardcode, estimate, or approximate a value.
3. **Verify joins before using them.** Only the relationships listed below are valid.

## Tables

### people.csv
Every individual the organization has a relationship with.

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
| company_id | integer (nullable) | Foreign key → companies.id. Empty if no organizational affiliation |
| role | string | One of: Individual Donor, Board Member, Volunteer, Program Participant, Event Attendee, Staff, Corporate Contact, Foundation Contact, Accounts Payable, VP of Giving, CSR Manager, Executive Director, Program Officer |
| created_at | date | YYYY-MM-DD |

### companies.csv
Organizations the nonprofit has relationships with.

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
| primary_contact_id | integer | Foreign key → people.id |
| created_at | date | YYYY-MM-DD |

### payments.csv
All monetary transactions. **Not all payments are donations.** This table includes event ticket purchases and service fees, which are revenue but not charitable contributions.

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| person_id | integer | Foreign key → people.id |
| company_id | integer (nullable) | Foreign key → companies.id. Present for grants and sponsorships |
| amount | decimal | Dollar amount (always positive) |
| category | string | **One of: donation, grant, sponsorship, service, event_ticket** |
| payment_method | string | One of: credit_card, check, ach, cash, online, wire |
| payment_date | date | YYYY-MM-DD |
| campaign_id | integer (nullable) | Foreign key → campaigns.id |
| notes | string (nullable) | |

**Category definitions:**
- **donation** — Charitable gift from an individual (person_id only, no company_id)
- **grant** — Funding from a foundation (has both person_id and company_id)
- **sponsorship** — Corporate sponsorship (has both person_id and company_id)
- **service** — Fee paid BY a participant for programs/workshops. Earned revenue, NOT a donation
- **event_ticket** — Ticket purchase for a fundraising event. Event revenue, NOT a donation

### in_kind_gifts.csv
Non-cash contributions — donated goods or pro bono services. Tracked separately from payments.

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| person_id | integer | Foreign key → people.id |
| company_id | integer (nullable) | Foreign key → companies.id |
| description | string | What was donated |
| estimated_value | decimal | Fair market value in dollars |
| date | date | YYYY-MM-DD |
| category | string | One of: goods, services |

### events.csv

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
Event attendance records.

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| person_id | integer | Foreign key → people.id |
| event_id | integer | Foreign key → events.id |
| registered_at | date | YYYY-MM-DD |
| attended | string | "yes" or "no" |
| ticket_amount | decimal | What they paid (0 for free events) |

### campaigns.csv
Fundraising campaigns with goals and timelines.

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| name | string | |
| goal_amount | decimal | Fundraising target |
| start_date | date | YYYY-MM-DD |
| end_date | date | YYYY-MM-DD |
| status | string | One of: active, completed |

### memberships.csv

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

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| person_id | integer | Foreign key → people.id |
| date | date | YYYY-MM-DD |
| hours | decimal | Hours volunteered |
| activity | string | One of: Event setup, Mentoring, Office admin, Fundraising calls, Data entry, Teaching, Transportation, Board meeting, Committee work, Community outreach |
| event_id | integer (nullable) | Foreign key → events.id. Present if tied to a specific event |

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
