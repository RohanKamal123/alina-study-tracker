# Study Tracker — SSC 2026

A personal study tracker for an SSC candidate. Built around one real problem:
her tutors and coaching centres change almost every month, so the app treats
teachers as something you *start and stop*, never something you delete.

Offline-first — everything works with no backend at all. Cloud sync is optional
and switched on with two environment variables.

---

## What it does

| Page | What it's for |
|---|---|
| **Today** | Countdown to the exam, a 7-day topic strip (3 days back → 3 days ahead), per-subject progress, today's classes, daily routine, homework due |
| **Calendar** | Month view; per day, plan what to study and afterwards record what was *actually* covered |
| **Teachers** | Every tutor / coaching centre, online or offline, with the subjects they cover and their monthly fee |
| **Schedule** | Recurring weekly class slots (Sat–Fri week) |
| **Class plan** | What each teacher says they will cover this month, plus the next two weeks of scheduled classes |
| **Syllabus** | NCTB chapter list per subject, each chapter rated 0–5 on understanding, with a completion graph per subject |
| **Homework** | Tasks grouped by overdue / today / tomorrow / later |
| **Exams** | Upcoming exams and their paper-by-paper routine, with a countdown to the next one |
| **Study timer** | Stopwatch that logs self-study minutes per subject, plus a daily streak and 14-day chart |
| **Routine & goals** | Repeating daily habits with a 7-day consistency bar, and numeric goals |
| **Fees** | Monthly fee per teacher (paid / unpaid) next to how many classes actually happened |
| **Insights** | Pace forecast against the exam date, weakest chapters, revision queue, study-time vs. work-remaining, teacher reliability |
| **Settings** | Subjects, exam date, study goal, theme, sync, and backup |

### The 0–5 understanding scale

The syllabus is tracked on one axis, and the wording matters more than the number:

| | |
|---|---|
| **0** | Never started this chapter |
| **1** | Just know what is in the chapter |
| **2** | Know some parts of it |
| **3** | Knew it, but needs a revision |
| **4** | Can solve 70–80% of CQ, MCQ and SQ |
| **5** | Can solve everything |

Every completion figure in the app is the mean level over a subject's chapters,
expressed as a percentage — so a subject only reaches 100% when every chapter is
at 5. Completion is shown **per subject**, never as one number across the whole
syllabus, because the useful question is always "which subject is weak?".

Each subject also gets a bar-per-chapter graph, which shows *where* along the
book the gaps are — something a single percentage cannot.

### Three design decisions worth knowing

**Teachers are closed out, not deleted.** When she stops with a tutor, "Stopped
studying" sets an end date and switches off their class slots. Old logs, fees
and history stay intact, and the teacher can be resumed later. Delete is there
too, but it cascades and is meant for typos.

**Planned topics are handed out one per class, in order.** The Today page looks
ahead using the monthly class plan: each upcoming class gets the next unfinished
topic for that teacher, rather than every future day showing the same first
topic. Days in the past show only what was actually logged — behind you is fact,
ahead of you is intent.

**Homework entered in a class log appears in the Homework list automatically.**
Logging a class ("covered X, homework Y") mirrors the homework into the task
list under a derived id, so re-editing the log updates the same task instead of
creating duplicates.

---

## Running it locally

```bash
npm install
npm run dev        # http://localhost:3000
```

Other commands:

```bash
npm run build      # production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

Node 20+ recommended.

---

## Deploying to Vercel (free tier)

1. Push this repository to GitHub.
2. On [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
3. Framework preset is detected as **Next.js**. Leave every build setting alone.
4. **Deploy.**

That's the whole thing. With no environment variables set, the app runs fully
offline: all data lives in that browser's `localStorage`.

---

## Optional: cloud sync with Supabase (free tier)

Without this, her data lives in one browser — phone and laptop stay separate,
and clearing browser data wipes it. Turn sync on to share one dataset across
devices.

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql).
3. In **Project Settings → API**, copy the **Project URL** and the **anon public** key.
4. In Vercel → your project → **Settings → Environment Variables**, add:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon public key |

5. Redeploy.
6. Open the app → **Settings → Cloud sync → Turn on sync for this device**. Copy
   the sync code it generates.
7. On her other device, open the app → **Settings → Cloud sync** → paste the code
   under *"use an existing code"* → **Connect**.

### What lands in the database

Two layers, on purpose:

- **`study_state`** — the sync layer. One JSON document per sync code.
- **`sd_*` tables** — the analysis layer. Every push explodes that document
  into ordinary relational tables (`sd_chapters`, `sd_session_logs`,
  `sd_study_sessions`, `sd_level_events`, …) that you can run SQL over.

The `sd_*` tables are a **derived projection**, rebuilt from the JSON on every
sync. Never write to them by hand — the next push overwrites them. Because they
are derived rather than maintained in parallel, they cannot drift from what the
app actually holds.

Ready-made views:

| View | Answers |
|---|---|
| `v_subject_progress` | How complete is each subject, on the same 0–5 basis the app uses? |
| `v_weekly_progress` | How many level-points were gained each week? |
| `v_weekly_study` | How many minutes went into each subject each week? |
| `v_teacher_reliability` | How often did each teacher's class actually happen, and how well did she follow it? |
| `v_coverage_adherence` | Did each teacher cover what they said they would, month by month? |
| `v_revision_due` | Which strong chapters have gone stale? |
| `v_effort_vs_need` | Is study time going where the work still is? |

```sql
-- e.g. subjects where the remaining work outweighs the time being spent
select subject, points_left, minutes_30d, need_share_pct, effort_share_pct
from v_effort_vs_need
order by need_share_pct - coalesce(effort_share_pct, 0) desc;
```

### How the sync works

The entire app state is stored as one JSON document keyed by a secret UUID (the
"sync code"). Reconciliation is last-write-wins on a timestamp: on load, whichever
copy was edited more recently wins, and the losing copy is kept as a restorable
snapshot (**Settings → Restore last snapshot**).

That means it is **not** built for two devices editing at the same moment — the
later save wins the whole document. For one student on a phone and a laptop, this
is the right trade: no accounts, no login, no merge conflicts to reason about.

### Security note

The `study_state` table has RLS enabled with **no policies**, so the anonymous
API key cannot touch it directly. All access goes through two `SECURITY DEFINER`
functions that only ever read or write the single row matching the code passed
in. Knowing one sync code reveals nothing about any other.

The practical consequence: **the sync code is the password.** Anyone who has it
can read and change the data. It is not shown anywhere except Settings — keep it
private, and don't put it in a screenshot.

The `sd_*` analysis tables are locked down the same way: RLS on, no policies, so
the anonymous API key cannot read them. You query them from the Supabase SQL
Editor, which runs as a privileged role.

### A note on whose data this is

This is one student's personal study record, including how well she says she
understands each chapter. The design keeps it that way: everything on the
Insights page is computed **on her device**, and the only copy that leaves it is
the one that goes to a Supabase project you control. There is no analytics SDK,
no third-party script, and nothing is sent anywhere else. If that ever changes,
it should be her call.

---

## Backups

Cloud sync is convenience, not a backup — a bad edit syncs everywhere.

**Settings → Export backup** downloads a JSON file. Do this every few weeks. It
is the only copy that survives clearing browser data, and it imports back through
**Import backup**.

---

## Tech

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** — theme tokens in `app/globals.css`, light/dark aware
- **Supabase** — optional, JSON document store via two RPC functions
- Charts are hand-rolled inline SVG (`components/charts.tsx`), no charting library

Everything is client-side; there are no API routes and no server-side data.

```
app/          one folder per page
components/   Shell (nav), ui.tsx (Card/Modal/Field/…), charts.tsx
lib/
  types.ts       the whole data model
  store.tsx      React context, CRUD helpers, persistence + sync
  storage.ts     localStorage + Supabase adapters
  selectors.ts   derived data (progress, streaks, pace, gaps)
  syllabus.ts    default NCTB subject + chapter lists
  date.ts        local-timezone-safe date handling
supabase/schema.sql
```

### A note on the syllabus data

`lib/syllabus.ts` holds the default NCTB Science-group subject and chapter lists.
Board editions differ year to year, so **treat it as a starting point** — check it
against her actual printed books. Every subject and chapter is editable, and new
ones can be added from Settings and the Syllabus page.

### A note on dates

Calendar days are handled as plain `YYYY-MM-DD` strings in local time and never
round-tripped through `Date.toISOString()`, which would shift to UTC and land on
the previous day for anyone east of Greenwich. The week runs **Saturday →
Friday**, matching the Bangladeshi school week.
