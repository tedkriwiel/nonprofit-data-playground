# Nonprofit Data Playground

A sample nonprofit CRM dataset designed to be explored with an LLM. Ask questions in plain English, build dashboards, and see how different definitions change the answers you get.

This project accompanies the newsletter post [What Is a Forest?](what_is_a_forest.md) — about how fuzzy definitions make it hard for nonprofits to answer simple questions like "how many donors do we have?"

## Quick Start

### Ask an LLM questions about the data

Copy this prompt into ChatGPT, Claude, or any LLM:

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

The LLM will fetch the data and answer your question. Follow up with whatever you're curious about.

### Explore the dashboard

Download [`dashboard.html`](dashboard.html) and open it in your browser. No server required — all the data is embedded in the file.

Want to customize it? Share the file with an LLM and ask it to make changes. The HTML includes prompt architecture that helps the LLM modify it correctly.

## What's in the dataset

| Table | Rows | Description |
|-------|------|-------------|
| people | 200 | Donors, volunteers, staff, board members, attendees |
| companies | 30 | Corporations, foundations, businesses |
| payments | 581 | Donations, grants, sponsorships, service fees, event tickets |
| in_kind_gifts | 15 | Non-cash contributions (goods and services) |
| events | 12 | Fundraising and community events |
| registrations | 574 | Event attendance records |
| campaigns | 8 | Fundraising campaigns with goals |
| memberships | 40 | Membership program records |
| volunteer_hours | 146 | Tracked volunteer time |

For the full schema — every column, type, enum value, and relationship — see [SCHEMA.md](SCHEMA.md).

## The point

A simple question like "give me a list of our donors" can produce very different answers depending on how you define "donor." This dataset is built to make that visible:

1. **Anyone who paid us anything** — includes ticket buyers and service fee payers (too broad)
2. **People with a "donation" payment** — misses grants and corporate sponsors
3. **Donations + grants + sponsorships** — misses in-kind contributors
4. **All of the above + in-kind gifts** — the broadest reasonable definition

Try each definition and see how the count changes. That's the whole idea.

## Questions to try

- Who are our top 10 donors by total giving?
- Which donors gave last year but not this year?
- How much has each campaign raised vs. its goal?
- What's our average event attendance rate?
- Who are our most active volunteers?
- Which foundations have given us the largest grants?
- How many people are "donors" under each definition above?

## Regenerating the data

```bash
npm install
node seed.js    # generates all CSV files in data/
node test_data.js  # validates schema, referential integrity, and newsletter queries
```

The seed uses a fixed random seed (42) so the output is deterministic.
