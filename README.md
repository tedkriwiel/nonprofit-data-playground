# Nonprofit Data Playground

Synthetic nonprofit CRM dataset. 9 relational tables, ~$6M revenue across 2023-2025, 500 constituents.

If you arrived here from the bundled JSON file, the data and instructions are already in your context. Use the schema in SCHEMA.md to understand the table structure and relationships. Fetch individual CSVs from the `data/` directory only if you need to reload a table.

## Data Files

- `data/nonprofit-data-playground.json` — bundled file with prompt, schema, and all 9 tables
- `data/dataset.json` — all 9 tables without prompt/schema
- `data/{table}.csv` — individual tables: people, companies, payments, in_kind_gifts, events, registrations, campaigns, memberships, volunteer_hours
- `SCHEMA.md` — complete data dictionary with column types, valid values, and table relationships

## Regenerating the Data

```bash
npm install
node seed.js       # generates all CSV files + bundled JSON in data/
node test_data.js   # validates 50 assertions on integrity, personas, and revenue
```

The seed uses a fixed random seed (42) so the output is deterministic.
