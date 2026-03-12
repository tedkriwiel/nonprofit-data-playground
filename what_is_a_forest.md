---
title: "What Is a Forest?"
pubDate: 2026-03-12
---

What is a forest?

A seemingly simple question with no clear answer.

Scientists examined [ten datasets](https://www.cell.com/one-earth/abstract/S2590-3322(25)00384-7) to see how forests were defined and found that they only agreed on [around 26%](https://news.mongabay.com/2026/02/scientists-cant-agree-on-where-the-worlds-forests-are/) of the world's forest. Dense canopies in the Amazon were fairly easy, but scrubland and more scattered areas were harder.

![Spatial agreement of forest datasets across the globe](figure1-castle-et-al-2025-2048x1521.jpg)
*Source: Castle et al., 2025, One Earth*

A forest is lots of trees. But what kind of trees? How concentrated must the trees be to constitute a forest? How large an area must they cover?

As you drill into the details, it's easy to imagine how complicated the answer becomes.

We can't dismiss this as an exercise either; politicians, scientists and businesses use this data to determine the best way to set policy and protect (or destroy) these resources.

How can we preserve something we can't define? How will we know if conservation efforts are successful? Are forests growing or shrinking? Right now, it depends on who you ask.

## Fuzzy Definitions

The nonprofit sector suffers from notoriously fuzzy definitions. When the time comes to demonstrate progress things start to sound a little hand wavy.

*"We collaborated with our partners to create systems change."*

What do you mean by "collaborate" and how does someone become your "partner" and what is "systems change?"

If we don't have clear answers to these questions...

*any* activity might be called "collaboration"
and *any* person could be our "partner"...
and *any* "change" in *any* "system" might be celebrated...

**We can't be effective until we get specific.**

This is true in our external work, but you also see this play out inside our organizations as well.

Countless executive directors have vented about how impossible it is to get answers to simple questions. A basic request like, "give me a list of our donors" can devolve into chaos. Sometimes the root cause is a bad process, or a skills issue, but more often than not, it's a lack of definition.

Let me illustrate with that request. "Give me a list of our donors."

## What Is a Donor?

**A donor is a person who gives us money.**

```sql
SELECT DISTINCT people.* FROM people
JOIN payments ON people.id = payments.person_id
WHERE payments.amount > 0
```

This seems true, unless your organization sells services or products ([50% of nonprofit revenue comes from selling services](https://www.nonprofitimpactmatters.org/data/downloadable-charts/)). People who pay for services or attend your events give you money but aren't donors. We must be more specific.

**A donor is a person who *donates* money.**

```sql
SELECT DISTINCT people.* FROM people
JOIN payments ON people.id = payments.person_id
WHERE payments.category = 'donation'
```

This is great. But what if a foundation gives you a grant or a corporation provides a sponsorship. Can an "organization" be a donor? Is the accounts payable person at the corporation the "donor?" Or should it be the CEO? We need to expand our definition.

**A donor is a person who *donates* money or the point person from an organization who provided a grant or sponsorship.**

```sql
SELECT DISTINCT people.* FROM people
JOIN payments ON people.id = payments.person_id
WHERE payments.category IN ('donation', 'grant', 'sponsorship')
```

Now we're closing in on it. But what about the caterer who provided $25,000 worth of food for your gala. Or the lawyer who provided $10,000 of services pro bono. Are they donors? If yes, the definition must now include:

**A donor is a person or the point person from an organization who donates money or provides services in kind or provides a grant or sponsorship.**

```sql
SELECT DISTINCT people.* FROM people
JOIN payments ON people.id = payments.person_id
WHERE payments.category IN ('donation', 'grant', 'sponsorship')

UNION

SELECT DISTINCT people.* FROM people
JOIN in_kind_gifts ON people.id = in_kind_gifts.person_id
```

That's a mouthful. But it's specific and clear. Of course they could add more layers like, only people who donated within the last 36 months or those who provided more than $10,000 in goods and services in the last 12 months. All of these add more context, and the more specific the request, the more actionable it becomes. A common report you might request is which donors gave last year but not this year?

The ability to ask these questions is based on a strong data model (which demands definition), solid processes for capturing data, and patience to get into the weeds.

We shouldn't be surprised when the executive director sends a message on Slack requesting the most updated donor list only to receive five different versions in response.

When scientists map the forests they don't agree either.

The world is a wonderfully complicated place. We just have to be patient enough to see it clearly.

Until next week,

Ted
