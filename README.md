# Nonprofit Data Playground

A sample nonprofit CRM dataset you can explore using ChatGPT, Claude, or any AI assistant. Ask questions in plain English, build dashboards, and see how different definitions change the answers you get.

No coding required. No database to set up. Just data and curiosity.

## What This Dataset Is

This repository contains a simulated nonprofit CRM (constituent relationship management) system. It includes the kinds of records a real nonprofit might keep: people, organizations, donations, event attendance, volunteer hours, and more.

It's designed for nonprofit leaders, consultants, board members, and students who want to explore what nonprofit data looks like and how to ask good questions about it.

The dataset accompanies the newsletter post [What Is a Forest?](what_is_a_forest.md), which explores how fuzzy definitions make it surprisingly hard for nonprofits to answer simple questions.

## Quick Start

### Option 1: Ask an AI questions about the data

Copy this prompt into ChatGPT, Claude, or any AI tool:

> Fetch the following CSV files and tell me who our top 10 donors are by total giving:
>
> - https://raw.githubusercontent.com/tedkriwiel/nonprofit-data-playground/main/data/people.csv
> - https://raw.githubusercontent.com/tedkriwiel/nonprofit-data-playground/main/data/companies.csv
> - https://raw.githubusercontent.com/tedkriwiel/nonprofit-data-playground/main/data/payments.csv
> - https://raw.githubusercontent.com/tedkriwiel/nonprofit-data-playground/main/data/in_kind_gifts.csv
> - https://raw.githubusercontent.com/tedkriwiel/nonprofit-data-playground/main/data/events.csv
> - https://raw.githubusercontent.com/tedkriwiel/nonprofit-data-playground/main/data/registrations.csv
> - https://raw.githubusercontent.com/tedkriwiel/nonprofit-data-playground/main/data/campaigns.csv
> - https://raw.githubusercontent.com/tedkriwiel/nonprofit-data-playground/main/data/memberships.csv
> - https://raw.githubusercontent.com/tedkriwiel/nonprofit-data-playground/main/data/volunteer_hours.csv

The AI will retrieve the data and answer your question. Follow up with whatever you're curious about.

### Option 2: Explore the dashboard

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
│   └── volunteer_hours.csv
│
├── README.md            ← You are here
├── SCHEMA.md            ← Full data dictionary for AI systems
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

## AI Access to the Dataset

AI systems can retrieve this data directly using the raw GitHub URLs below. No authentication required.

```
DATASETS

people:
https://raw.githubusercontent.com/tedkriwiel/nonprofit-data-playground/main/data/people.csv

companies:
https://raw.githubusercontent.com/tedkriwiel/nonprofit-data-playground/main/data/companies.csv

payments:
https://raw.githubusercontent.com/tedkriwiel/nonprofit-data-playground/main/data/payments.csv

in_kind_gifts:
https://raw.githubusercontent.com/tedkriwiel/nonprofit-data-playground/main/data/in_kind_gifts.csv

events:
https://raw.githubusercontent.com/tedkriwiel/nonprofit-data-playground/main/data/events.csv

registrations:
https://raw.githubusercontent.com/tedkriwiel/nonprofit-data-playground/main/data/registrations.csv

campaigns:
https://raw.githubusercontent.com/tedkriwiel/nonprofit-data-playground/main/data/campaigns.csv

memberships:
https://raw.githubusercontent.com/tedkriwiel/nonprofit-data-playground/main/data/memberships.csv

volunteer_hours:
https://raw.githubusercontent.com/tedkriwiel/nonprofit-data-playground/main/data/volunteer_hours.csv
```

For the full schema with column definitions, data types, enum values, and table relationships, see:
https://github.com/tedkriwiel/nonprofit-data-playground/blob/main/SCHEMA.md

## Regenerating the Data

```bash
npm install
node seed.js       # generates all CSV files in data/
node test_data.js  # validates schema, referential integrity, and newsletter queries
```

The seed uses a fixed random seed (42) so the output is deterministic.
