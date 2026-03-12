# Nonprofit Data Playground

A sample nonprofit CRM dataset you can explore using ChatGPT, Claude, or any AI assistant. Ask questions in plain English, build dashboards, and see how different definitions change the answers you get.

No coding required. No database to set up. Just data and curiosity.

## What This Dataset Is

This repository contains a simulated nonprofit CRM (constituent relationship management) system. It includes the kinds of records a real nonprofit might keep: people, organizations, donations, event attendance, volunteer hours, and more.

It's designed for nonprofit leaders, consultants, board members, and students who want to explore what nonprofit data looks like and how to ask good questions about it.

The dataset accompanies the newsletter post [What Is a Forest?](what_is_a_forest.md), which explores how fuzzy definitions make it surprisingly hard for nonprofits to answer simple questions.

## Quick Start

### Option 1: Explore with an AI

Copy and paste this prompt into ChatGPT, Claude, or any AI assistant:

---

**You are a nonprofit data analyst.** I'm going to give you a dataset. Your job is to help me explore it interactively.

**Rules:**
- Do NOT summarize the dataset.
- Do NOT explain the schema back to me.
- Do NOT list what analyses are possible.
- Do NOT write more than a few short paragraphs at a time.

**What to do:**

1. Fetch the JSON file below. It contains 9 relational tables (people, companies, payments, in_kind_gifts, events, registrations, campaigns, memberships, volunteer_hours).
2. Show me a dashboard: 4-6 key metrics with charts (total revenue, number of donors, campaign progress, event attendance rate, etc.).
3. Below the dashboard, ask me: **"What do you want to explore?"**
4. When I ask a question:
   - Answer it with a chart or table.
   - In 1-2 sentences, explain how you calculated the answer (which tables, which columns).
   - Offer: "Want to see the raw data behind this?"
   - Suggest 2-3 follow-up questions.
5. Repeat. This is a conversation, not a report.

**Dataset (all tables in one file):**
https://raw.githubusercontent.com/tedkriwiel/nonprofit-data-playground/main/data/dataset.json

**Schema and relationships:**
https://raw.githubusercontent.com/tedkriwiel/nonprofit-data-playground/main/SCHEMA.md

**Start now. Show me the dashboard.**

---

### Option 2: Explore the pre-built dashboard

Download [`dashboard.html`](dashboard.html) and open it in your browser. No server needed — all the data is already embedded in the file.

Want to customize it? Share the file with an AI and ask it to make changes. The HTML includes built-in instructions that help the AI modify it correctly.

## Repository Map

```
nonprofit-data-playground/
├── data/
│   ├── people.csv
│   ├── companies.csv
│   ├── payments.csv
│   ├── in_kind_gifts.csv
│   ├── events.csv
│   ├── registrations.csv
│   ├── campaigns.csv
│   ├── memberships.csv
│   ├── volunteer_hours.csv
│   └── dataset.json        ← All tables in one file (for AI)
│
├── README.md            ← You are here
├── SCHEMA.md            ← Full data dictionary for AI systems
├── dataset.json         ← Machine-readable dataset manifest
├── dashboard.html       ← Self-contained visual dashboard
├── what_is_a_forest.md  ← Source newsletter post
├── sources.md           ← Research sources
├── seed.js              ← Script that generates the data
├── test_data.js         ← Validates data integrity
├── package.json         ← Node.js dependencies
└── .gitignore
```

## How Nonprofit Data Works

Nonprofits track relationships with many different types of people and organizations. Here's what each part of this dataset represents:

- **People** — Everyone the nonprofit interacts with: individual donors, volunteers, staff, board members, event attendees, and program participants.
- **Companies** — Organizations the nonprofit has relationships with: corporate sponsors, grant-making foundations, law firms providing pro bono services, and others.
- **Payments** — All money coming in. This includes charitable donations, foundation grants, corporate sponsorships, service fees, and event ticket purchases. Not all payments are donations — that distinction is central to this dataset.
- **In-kind gifts** — Non-cash contributions like donated goods or pro bono services. These are tracked separately from payments because no money changes hands.
- **Events** — Fundraising galas, community gatherings, and other events the nonprofit hosts.
- **Registrations** — Records of who signed up for events and whether they attended.
- **Campaigns** — Fundraising initiatives with specific goals and timelines, like an annual fund or capital campaign.
- **Memberships** — People who pay annual dues at different levels (Basic, Silver, Gold, Platinum).
- **Volunteer hours** — Tracked time that volunteers contribute, sometimes tied to specific events.

For the complete technical schema — every column, data type, and relationship — see [SCHEMA.md](SCHEMA.md).

## Dataset Tables

### people.csv
Every individual the nonprofit has a relationship with.
- **Primary key:** `id`
- **Key fields:** `first_name`, `last_name`, `email`, `city`, `state`, `role`, `company_id`
- **200 rows**
- Referenced by: payments, in_kind_gifts, registrations, memberships, volunteer_hours

### companies.csv
Organizations connected to the nonprofit.
- **Primary key:** `id`
- **Key fields:** `name`, `type`, `primary_contact_id`
- **30 rows**
- Referenced by: people, payments, in_kind_gifts

### payments.csv
All monetary transactions — donations, grants, sponsorships, service fees, and event tickets.
- **Primary key:** `id`
- **Key fields:** `person_id`, `company_id`, `amount`, `category`, `payment_date`, `campaign_id`
- **581 rows**
- Categories: `donation`, `grant`, `sponsorship`, `service`, `event_ticket`

### in_kind_gifts.csv
Non-cash contributions tracked separately from payments.
- **Primary key:** `id`
- **Key fields:** `person_id`, `company_id`, `description`, `estimated_value`, `category`
- **15 rows**
- Categories: `goods`, `services`

### events.csv
Events hosted by the nonprofit.
- **Primary key:** `id`
- **Key fields:** `name`, `date`, `location`, `capacity`, `ticket_price`, `campaign_id`
- **12 rows**

### registrations.csv
Event attendance records.
- **Primary key:** `id`
- **Key fields:** `person_id`, `event_id`, `attended`, `ticket_amount`
- **574 rows**

### campaigns.csv
Fundraising campaigns with goals and timelines.
- **Primary key:** `id`
- **Key fields:** `name`, `goal_amount`, `start_date`, `end_date`, `status`
- **8 rows**

### memberships.csv
Membership program records.
- **Primary key:** `id`
- **Key fields:** `person_id`, `level`, `fee`, `start_date`, `end_date`, `status`
- **40 rows**
- Levels: `Basic`, `Silver`, `Gold`, `Platinum`

### volunteer_hours.csv
Tracked volunteer time.
- **Primary key:** `id`
- **Key fields:** `person_id`, `date`, `hours`, `activity`, `event_id`
- **146 rows**

## Table Relationships

```
people.id → payments.person_id
people.id → in_kind_gifts.person_id
people.id → registrations.person_id
people.id → memberships.person_id
people.id → volunteer_hours.person_id
people.company_id → companies.id

companies.id → payments.company_id
companies.id → in_kind_gifts.company_id
companies.primary_contact_id → people.id

campaigns.id → payments.campaign_id
campaigns.id → events.campaign_id

events.id → registrations.event_id
events.id → volunteer_hours.event_id
```

## Dataset Size

| Table | Rows |
|-------|------|
| people | 200 |
| companies | 30 |
| payments | 581 |
| in_kind_gifts | 15 |
| events | 12 |
| registrations | 574 |
| campaigns | 8 |
| memberships | 40 |
| volunteer_hours | 146 |

## Example Questions This Dataset Can Answer

**Fundraising**
- How many donors gave this year?
- Who are our top 10 donors by total giving?
- Which donors gave last year but not this year?
- How much has each campaign raised vs. its goal?
- What is our average gift size?

**Events**
- Which events had the most registrations?
- What percentage of people who registered actually attended?
- Which events generated the most revenue?

**Volunteers**
- Who are our most active volunteers?
- How many volunteer hours are tied to events vs. independent work?
- Which activities consume the most volunteer time?

**Organizations**
- Which foundations have given us the largest grants?
- Which corporations sponsor us?
- What is the total value of in-kind contributions?

**The big question**
- How many "donors" do we have? (The answer depends entirely on your definition.)

## Why This Dataset Exists

The nonprofit sector suffers from fuzzy definitions. A basic request like "give me a list of our donors" can produce five different answers depending on who you ask — because nobody agreed on what "donor" means.

The definition of "donor" changes depending on whether you include:

- **Cash donations only** — the narrowest definition
- **Grants from foundations** — large institutional gifts
- **Corporate sponsorships** — companies funding your work
- **In-kind contributions** — donated goods and pro bono services
- **Event ticket buyers** — they gave you money, but is it a donation?
- **Service fee payers** — they paid for something you provide

Each definition produces a different list of people and a different count. This dataset is designed to make that ambiguity visible and to help nonprofit leaders think critically about how they define and measure their work.

Scientists studying forests faced the same problem. Ten datasets, ten definitions, and they only agreed on [26% of the world's forest](https://news.mongabay.com/2026/02/scientists-cant-agree-on-where-the-worlds-forests-are/). Read the full story in [What Is a Forest?](what_is_a_forest.md)

## How AI Systems Should Use This Repository

1. Fetch the combined dataset: https://raw.githubusercontent.com/tedkriwiel/nonprofit-data-playground/main/data/dataset.json
2. Use the [Table Relationships](#table-relationships) to join tables correctly.
3. Refer to [SCHEMA.md](SCHEMA.md) for complete column definitions, data types, and enum values.

Machine-readable dataset manifest: [`dataset.json`](dataset.json) ([raw](https://raw.githubusercontent.com/tedkriwiel/nonprofit-data-playground/main/dataset.json))

Individual CSV files are also available in [`data/`](data/) for human browsing.

## Regenerating the Data

```bash
npm install
node seed.js       # generates all CSV files in data/
node test_data.js  # validates schema, referential integrity, and newsletter queries
```

The seed uses a fixed random seed (42) so the output is deterministic.
