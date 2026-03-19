# Nonprofit Data Playground

Synthetic nonprofit CRM dataset (~$6M, 3-year, 500 people) for exploring how definition ambiguity affects data analysis. Built for AI-powered exploration and education.

## Quick Reference

```bash
npm install                # install dependencies (just @faker-js/faker)
node seed.js               # regenerate all CSV files in data/ (deterministic, seed=42)
node test_data.js           # validate 50 assertions on data integrity, personas, and revenue
```

## Dataset Scale

A $2.5M/year nonprofit with 20% YoY growth across 2023-2025 (~$6.1M total revenue).

| Table | Rows | Notes |
|-------|------|-------|
| People | 500 | Persona-driven: board, major donors, recurring, lapsed, staff, dead records |
| Companies | 75 | ≥10 Foundations, ≥25 Corps/Businesses, law firms |
| Campaigns | 13 | Annual Fund ×3, Year-End Appeal ×3, Spring Gala ×3, Capital Campaign, etc. |
| Events | 32 | 10 recurring templates × 3 years + Leadership Conference |
| Payments | ~6,000 | 5 categories, year-end spike, recurring donors |
| Registrations | ~3,800 | Persona-aware attendance patterns |
| Memberships | ~360 | 5 levels (Basic→Benefactor), 3-year lifecycle |
| In-Kind Gifts | ~38 | Corporate + individual, goods + services |
| Volunteer Hours | ~660 | Event-linked and independent |

## Project Structure

- `seed.js` — persona-first generator: assigns behavioral profiles, then generates transactions
- `test_data.js` — 50 assertions covering scale, integrity, personas, revenue, and definition ambiguity
- `data/` — CSV files + combined `dataset.json`
- `dashboard.html` — self-contained HTML dashboard with embedded data
- `SCHEMA.md` — complete data dictionary for all tables

## Conventions

- **Column names:** snake_case, non-abbreviated (`payment_date` not `pmt_dt`)
- **Foreign keys:** `{table}_id` pattern (e.g., `person_id`, `company_id`)
- **Dates:** ISO 8601 (`YYYY-MM-DD`), range 2023-01-01 to 2025-12-31
- **Nulls in CSV:** empty string, not `"null"`
- **Amounts:** positive decimals (currency)
- **Determinism:** Faker seed is `42` — `node seed.js` always produces identical output

## Data Relationships

```
people ──→ payments, in_kind_gifts, registrations, memberships, volunteer_hours (via person_id)
people.company_id ──→ companies
companies ──→ payments, in_kind_gifts (via company_id)
companies.primary_contact_id ──→ people
campaigns ──→ payments (via campaign_id), events (via campaign_id)
events ──→ registrations, volunteer_hours (via event_id)
```

## Payment Categories

`donation`, `grant`, `sponsorship`, `service`, `event_ticket` — the core of the "definition ambiguity" problem. "How many donors?" depends on which categories you count.
