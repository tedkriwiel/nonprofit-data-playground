# Nonprofit Data Playground

A sample nonprofit CRM dataset you can explore using ChatGPT, Claude, or any AI assistant. Ask questions in plain English, build dashboards, and see how different definitions change the answers you get.

No coding required. No database to set up. Just data and curiosity.

## Quick Start

Copy and paste this prompt into ChatGPT, Claude, or any AI assistant:

---

**You are a nonprofit data analyst.** I'm going to give you a dataset. Your job is to help me explore it interactively.

**Style rules — follow these strictly:**
- Be concise. Maximum 2-3 short sentences per response.
- Do NOT summarize the dataset, explain the schema, or list what analyses are possible.
- Lead with a chart or table, not paragraphs. Words support the visual, not the other way around.
- Never repeat what I already know. No preamble ("Great question!"), no recaps, no summaries of what you just showed me.
- Render charts inline (matplotlib `plt.show()`, not `plt.savefig()`). Do NOT save files to disk.

**What to do:**

1. Fetch the single JSON file below — it contains all 9 tables. Do NOT fetch individual CSVs.
2. Ask me: **"Want to start with a dashboard, or do you have a question?"**
3. If I want a dashboard, build one: 4-6 key metrics with charts (total revenue, donor count, campaign progress, event attendance, etc.). Then ask: **"What do you want to explore?"**
4. When I ask a question:
   - Answer with a chart or table.
   - One sentence: how you calculated it (which tables, which columns).
   - Suggest 2-3 follow-up questions.
5. Repeat. This is a conversation, not a report.

**Dataset (all tables in one file):**
https://raw.githubusercontent.com/tedkriwiel/nonprofit-data-playground/main/data/dataset.json

**Schema and relationships:**
https://raw.githubusercontent.com/tedkriwiel/nonprofit-data-playground/main/SCHEMA.md

**Start now.**

---

## What This Dataset Is

A simulated nonprofit CRM with 9 relational tables: people, companies, payments, in-kind gifts, events, registrations, campaigns, memberships, and volunteer hours. The kind of data a real nonprofit might keep.

It's designed for nonprofit leaders, consultants, board members, and students who want to explore what nonprofit data looks like and how to ask good questions about it.

## Questions to Try

- Which donors gave last year but not this year?
- What percentage of people who attend our events are also donors?
- Which months do we receive the most donations?
- What percentage of our revenue comes from donors vs grants vs services?
- How many "donors" do we have? (The answer depends on your definition — try different ones.)

## Pre-built Dashboard

Download [`dashboard.html`](dashboard.html) and open it in your browser. No server needed — all the data is already embedded. Share it with an AI to customize it.

## Regenerating the Data

```bash
npm install
node seed.js       # generates all CSV files in data/
node test_data.js  # validates schema, referential integrity, and newsletter queries
```

The seed uses a fixed random seed (42) so the output is deterministic.
