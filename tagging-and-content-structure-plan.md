# Tagging, search, and content ordering — plan

**Status:** Planning — standalone from the main project plan
**Applies to:** every topic on the blog, not just Machine Learning (ML is used throughout as the worked example since that's what you described)

---

## 1. Two separate problems, two separate systems

Your note is really describing two different needs that happen to both involve "Machine Learning" as an example:

1. **Discoverability** — someone searches "ML" and should find posts tagged "Machine Learning." This is a **tagging + search** problem.
2. **Sequencing** — within a topic, some posts are foundational and some assume you've read the foundational ones first. This is a **content ordering / learning path** problem.

They're solved differently, so this plan covers them as two systems that work together rather than one big feature.

---

## 2. Tagging & search system

### 2.1 Two-tier taxonomy

Flat tags alone get messy fast. Use two levels:

- **Category** — broad, one per post. Examples: `Machine Learning`, `Web Development`, `AI Ethics`, `Tools & Infrastructure`. Used for top-level navigation and topic hub pages (see Section 3).
- **Tags** — specific, many per post. Examples on an ML post: `Machine Learning`, `Neural Networks`, `PyTorch`. Used for filtering and search.

A post always has exactly one category and any number of tags.

### 2.2 Canonical name + aliases

Every tag has one **canonical name** (what's displayed on the site) and a list of **aliases** (other ways people type or search for it). This is what makes "ML" resolve to "Machine Learning."

| Canonical name | Aliases |
|---|---|
| Machine Learning | ML, machine learning, ML models |
| Natural Language Processing | NLP, natural language processing |
| Large Language Models | LLM, LLMs, large language models |
| Computer Vision | CV, computer vision |
| Reinforcement Learning | RL, reinforcement learning |
| Generative AI | GenAI, gen AI, generative AI |
| Neural Networks | neural nets, NN |
| AI Ethics | ethics, responsible AI |
| MLOps | ML ops, machine learning ops |
| Frontend Development | frontend, front-end, front end |
| DevOps | dev ops |

This table is illustrative — you'll build your own as you tag posts, but the pattern (one canonical name, a short list of common variants) is what generalizes to any subject, not just ML.

### 2.3 Database schema

Two new tables replace a plain `tags` text array with something that can actually resolve aliases:

```
tags
  id            uuid (PK)
  name          text            -- canonical display name, e.g. "Machine Learning"
  slug          text, unique    -- "machine-learning", used in the URL
  category      text            -- which category this tag belongs under
  aliases       text[]          -- ["ML", "machine learning", "ML models"]

post_tags
  post_id       uuid FK -> posts
  tag_id        uuid FK -> tags
  (composite primary key on post_id + tag_id)
```

A post's category can live directly on the `posts` table (it's one value), while tags go through the join table since a post can have several.

### 2.4 How the search actually resolves "ML" → "Machine Learning"

At the database level (Postgres/Supabase), match the search term against both the tag name and its aliases:

```sql
select distinct p.*
from posts p
join post_tags pt on pt.post_id = p.id
join tags t on t.id = pt.tag_id
where p.status = 'published'
and (
  t.name ilike '%' || :query || '%'
  or exists (
    select 1 from unnest(t.aliases) a
    where a ilike '%' || :query || '%'
  )
);
```

For an MVP without touching SQL on every search, the same idea works client-side: keep a small alias-to-canonical lookup (a plain JSON object) and normalize the search term before querying —

```js
const aliasMap = { "ml": "Machine Learning", "nlp": "Natural Language Processing", "llm": "Large Language Models" };
const resolvedTag = aliasMap[query.trim().toLowerCase()] || query;
```

Start with the client-side map (Section 2.2's table, basically) since it's zero database work. Move to the `aliases` column approach once you have enough tags that maintaining a separate lookup file becomes annoying — the schema in 2.3 is there when you're ready for it.

### 2.5 Tag pages

Each tag gets its own page at `/tags/machine-learning` listing every post with that tag, newest first. This is what a reader lands on whether they searched "ML," "machine learning," or clicked the tag chip on a post — one destination regardless of how they typed it.

---

## 3. Ordering content within a topic (the "what comes after what" problem)

This is a genuinely different problem from tagging. Tags answer "what is this post about." Ordering answers "in what sequence should someone read a topic's posts to actually build understanding."

### 3.1 A general framework for sequencing any topic

Before touching the database, decide the sequence editorially. A five-tier structure works for pretty much any technical subject:

1. **Foundations** — what is this thing, why does it exist, basic vocabulary.
2. **Core building blocks** — the small number of concepts everything else depends on.
3. **Practical application** — how it's actually used, hands-on, tools.
4. **Advanced / specialized** — deeper or more niche subtopics that assume 1–3.
5. **Perspectives & trends** — opinion, industry commentary, "where this is going" — readable at any point, doesn't require the earlier tiers.

Posts in tier 5 don't need strict ordering relative to each other; tiers 1–4 generally do.

### 3.2 Worked example: Machine Learning

Applying that framework to the ML category:

| Tier | Example posts |
|---|---|
| 1. Foundations | "What machine learning actually is", "Supervised vs. unsupervised learning" |
| 2. Core building blocks | "How a neural network learns", "Loss functions, explained" |
| 3. Practical application | "Training your first model", "Choosing between PyTorch and TensorFlow" |
| 4. Advanced / specialized | "Attention and transformers", "Fine-tuning large language models" |
| 5. Perspectives & trends | "Why benchmarks keep lying to us", "The economics of running your own LLM" |

You'd repeat this same exercise for any other category (Web Development, AI Ethics, whatever comes next) — the tiers stay the same, only the post titles change.

### 3.3 How this becomes a feature on the site: series

Turn the ordered list into an actual **series** — a named, ordered collection of posts a reader can follow start to finish.

- A topic hub page (e.g. `/topics/machine-learning`) shows the recommended reading order, tier by tier, as a simple numbered list — this doubles as your "start here" page for new readers.
- Each post that belongs to a series shows a small "Part 2 of 6 — Machine Learning fundamentals" strip near the top, with previous/next links, so readers don't have to go back to the hub page every time.
- Posts don't have to belong to a series — standalone opinion or news posts (tier 5 territory) just carry their tag and category as normal.

### 3.4 Database schema for series

```
series
  id            uuid (PK)
  name          text            -- "Machine Learning fundamentals"
  slug          text, unique
  description   text

series_posts
  series_id     uuid FK -> series
  post_id       uuid FK -> posts
  position      integer         -- 1, 2, 3... controls the order
```

Reordering later (say, you write a new "Foundations" post that should slot in as part 2 instead of part 5) is just updating `position` values — nothing about the post itself changes.

---

## 4. How the two systems combine on a single post

A single post typically carries both:

- **Category + tags** (from Section 2) — for search and filtering, answers "what is this about."
- **Optional series + position** (from Section 3) — for sequencing, answers "where does this fit in a learning path."

Example: a post titled "Attention and transformers" might have category `Machine Learning`, tags `Machine Learning, Neural Networks, Transformers`, and sit at position 4 in the "Machine Learning fundamentals" series. A reader could arrive at it either by searching "transformers," or by working through the series in order — both paths lead to the same post.

---

## 5. Admin panel additions this implies

Small, additive changes to the admin panel described in the main project plan:

- A **Tags** screen: create/edit tags, set the canonical name, and add aliases as a simple comma-separated field.
- A **Series** screen: create a series, then drag posts into order (a simple up/down reorder list is enough — no need for a complex builder).
- On the post editor itself: a tag picker (existing tags autocomplete, or create new), a category dropdown, and an optional "add to series + position" field.

---

## 6. Quick checklist when publishing a new post

- [ ] Pick one category.
- [ ] Add 2–4 specific tags (reuse existing tags rather than creating near-duplicates — check the tag list first).
- [ ] If this post assumes earlier knowledge, add it to the relevant series at the right position.
- [ ] If it's a standalone opinion/news piece, it's fine to skip the series entirely.
