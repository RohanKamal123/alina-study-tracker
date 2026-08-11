-- =============================================================================
-- Study tracker — Supabase schema
-- Run this once in Supabase → SQL Editor. Safe to re-run.
-- =============================================================================
--
-- Two layers, on purpose:
--
--   1. `study_state` — the sync layer. The whole app state travels as ONE JSON
--      document keyed by a secret UUID (the "sync code"). For a single student
--      this makes conflict handling a single last-write-wins comparison instead
--      of per-row merge logic across fifteen tables.
--
--   2. `sd_*` tables — the analysis layer. Every push explodes that document
--      into ordinary relational tables you can run SQL over. They are a
--      DERIVED PROJECTION: never write to them by hand, they are rebuilt from
--      the JSON on every sync. That way they cannot drift from the app.
--
-- Security: `study_state` and the projection are unreachable by the anonymous
-- API role. All app access goes through two SECURITY DEFINER functions scoped
-- to a single row, so knowing one sync code reveals nothing about any other.
-- You query the analysis tables from the SQL Editor, which is not anon.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Sync layer
-- ---------------------------------------------------------------------------

create table if not exists public.study_state (
  id          uuid primary key,
  data        jsonb       not null,
  updated_at  timestamptz not null default now()
);

alter table public.study_state enable row level security;
revoke all on table public.study_state from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Analysis layer (derived — do not hand-edit)
-- ---------------------------------------------------------------------------

create table if not exists public.sd_subjects (
  owner uuid not null,
  id text not null,
  name text,
  name_bn text,
  color text,
  full_marks int,
  archived boolean default false,
  primary key (owner, id)
);

create table if not exists public.sd_chapters (
  owner uuid not null,
  id text not null,
  subject_id text,
  number int,
  name text,
  name_bn text,
  level int,
  updated_at timestamptz,
  primary key (owner, id)
);

create table if not exists public.sd_level_events (
  owner uuid not null,
  id text not null,
  chapter_id text,
  subject_id text,
  level int,
  previous int,
  at timestamptz,
  primary key (owner, id)
);

create table if not exists public.sd_teachers (
  owner uuid not null,
  id text not null,
  name text,
  kind text,
  mode text,
  contact text,
  fee numeric,
  fee_due_day int,
  started_on date,
  ended_on date,
  note text,
  primary key (owner, id)
);

create table if not exists public.sd_teacher_subjects (
  owner uuid not null,
  teacher_id text not null,
  subject_id text not null,
  primary key (owner, teacher_id, subject_id)
);

create table if not exists public.sd_class_slots (
  owner uuid not null,
  id text not null,
  teacher_id text,
  weekday int,
  start_time text,
  end_time text,
  mode text,
  location text,
  active boolean,
  primary key (owner, id)
);

create table if not exists public.sd_session_logs (
  owner uuid not null,
  id text not null,
  date date,
  slot_id text,
  teacher_id text,
  subject_id text,
  status text,
  planned text,
  covered text,
  homework text,
  understanding int,
  notes text,
  primary key (owner, id)
);

create table if not exists public.sd_plan_entries (
  owner uuid not null,
  id text not null,
  date date,
  subject_id text,
  title text,
  detail text,
  kind text,
  done boolean,
  primary key (owner, id)
);

create table if not exists public.sd_coverage_plans (
  owner uuid not null,
  id text not null,
  teacher_id text,
  subject_id text,
  month text,
  title text,
  done boolean,
  primary key (owner, id)
);

create table if not exists public.sd_homework (
  owner uuid not null,
  id text not null,
  title text,
  subject_id text,
  teacher_id text,
  detail text,
  due_date date,
  priority text,
  done boolean,
  done_at timestamptz,
  primary key (owner, id)
);

create table if not exists public.sd_exam_events (
  owner uuid not null,
  id text not null,
  name text,
  kind text,
  start_date date,
  note text,
  primary key (owner, id)
);

create table if not exists public.sd_exam_papers (
  owner uuid not null,
  id text not null,
  exam_id text,
  subject_id text,
  date date,
  time text,
  note text,
  primary key (owner, id)
);

create table if not exists public.sd_study_sessions (
  owner uuid not null,
  id text not null,
  date date,
  subject_id text,
  minutes int,
  started_at timestamptz,
  note text,
  primary key (owner, id)
);

create table if not exists public.sd_fees (
  owner uuid not null,
  id text not null,
  teacher_id text,
  month text,
  amount numeric,
  paid boolean,
  paid_on date,
  note text,
  primary key (owner, id)
);

create table if not exists public.sd_routines (
  owner uuid not null,
  id text not null,
  title text,
  time text,
  weekdays int[],
  active boolean,
  primary key (owner, id)
);

create table if not exists public.sd_routine_checks (
  owner uuid not null,
  date date not null,
  routine_id text not null,
  primary key (owner, date, routine_id)
);

create table if not exists public.sd_goals (
  owner uuid not null,
  id text not null,
  title text,
  detail text,
  kind text,
  target numeric,
  progress numeric,
  unit text,
  due_date date,
  done boolean,
  primary key (owner, id)
);

do $$
declare t text;
begin
  foreach t in array array[
    'sd_subjects','sd_chapters','sd_level_events','sd_teachers','sd_teacher_subjects',
    'sd_class_slots','sd_session_logs','sd_plan_entries','sd_coverage_plans','sd_homework',
    'sd_exam_events','sd_exam_papers','sd_study_sessions','sd_fees','sd_routines',
    'sd_routine_checks','sd_goals'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Projection: JSON document -> relational tables
-- ---------------------------------------------------------------------------

create or replace function public.project_state(p_code uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  d jsonb;
begin
  select data into d from public.study_state where id = p_code;
  if d is null then
    return;
  end if;

  -- Full refresh for this owner. At one student's data volume (hundreds of
  -- rows) a delete + reinsert is far simpler than diffing, and guarantees the
  -- projection matches the document exactly.
  delete from public.sd_subjects         where owner = p_code;
  delete from public.sd_chapters         where owner = p_code;
  delete from public.sd_level_events     where owner = p_code;
  delete from public.sd_teachers         where owner = p_code;
  delete from public.sd_teacher_subjects where owner = p_code;
  delete from public.sd_class_slots      where owner = p_code;
  delete from public.sd_session_logs     where owner = p_code;
  delete from public.sd_plan_entries     where owner = p_code;
  delete from public.sd_coverage_plans   where owner = p_code;
  delete from public.sd_homework         where owner = p_code;
  delete from public.sd_exam_events      where owner = p_code;
  delete from public.sd_exam_papers      where owner = p_code;
  delete from public.sd_study_sessions   where owner = p_code;
  delete from public.sd_fees             where owner = p_code;
  delete from public.sd_routines         where owner = p_code;
  delete from public.sd_routine_checks   where owner = p_code;
  delete from public.sd_goals            where owner = p_code;

  insert into public.sd_subjects (owner, id, name, name_bn, color, full_marks, archived)
  select p_code, x->>'id', x->>'name', x->>'nameBn', x->>'color',
         nullif(x->>'fullMarks','')::int, coalesce((x->>'archived')::boolean, false)
  from jsonb_array_elements(coalesce(d->'subjects','[]'::jsonb)) x
  on conflict do nothing;

  insert into public.sd_chapters (owner, id, subject_id, number, name, name_bn, level, updated_at)
  select p_code, x->>'id', x->>'subjectId', nullif(x->>'number','')::int, x->>'name',
         x->>'nameBn', coalesce(nullif(x->>'level','')::int, 0),
         nullif(x->>'updatedAt','')::timestamptz
  from jsonb_array_elements(coalesce(d->'chapters','[]'::jsonb)) x
  on conflict do nothing;

  insert into public.sd_level_events (owner, id, chapter_id, subject_id, level, previous, at)
  select p_code, x->>'id', x->>'chapterId', x->>'subjectId',
         nullif(x->>'level','')::int, nullif(x->>'previous','')::int,
         nullif(x->>'at','')::timestamptz
  from jsonb_array_elements(coalesce(d->'levelHistory','[]'::jsonb)) x
  on conflict do nothing;

  insert into public.sd_teachers (owner, id, name, kind, mode, contact, fee, fee_due_day, started_on, ended_on, note)
  select p_code, x->>'id', x->>'name', x->>'kind', x->>'mode', x->>'contact',
         nullif(x->>'fee','')::numeric, nullif(x->>'feeDueDay','')::int,
         nullif(x->>'startedOn','')::date, nullif(x->>'endedOn','')::date, x->>'note'
  from jsonb_array_elements(coalesce(d->'teachers','[]'::jsonb)) x
  on conflict do nothing;

  insert into public.sd_teacher_subjects (owner, teacher_id, subject_id)
  select distinct p_code, x->>'id', s
  from jsonb_array_elements(coalesce(d->'teachers','[]'::jsonb)) x
  cross join lateral jsonb_array_elements_text(coalesce(x->'subjectIds','[]'::jsonb)) s
  on conflict do nothing;

  insert into public.sd_class_slots (owner, id, teacher_id, weekday, start_time, end_time, mode, location, active)
  select p_code, x->>'id', x->>'teacherId', nullif(x->>'weekday','')::int,
         x->>'start', x->>'end', x->>'mode', x->>'location',
         coalesce((x->>'active')::boolean, true)
  from jsonb_array_elements(coalesce(d->'slots','[]'::jsonb)) x
  on conflict do nothing;

  insert into public.sd_session_logs (owner, id, date, slot_id, teacher_id, subject_id, status, planned, covered, homework, understanding, notes)
  select p_code, x->>'id', nullif(x->>'date','')::date, x->>'slotId', x->>'teacherId',
         x->>'subjectId', x->>'status', x->>'planned', x->>'covered', x->>'homework',
         nullif(x->>'understanding','')::int, x->>'notes'
  from jsonb_array_elements(coalesce(d->'sessionLogs','[]'::jsonb)) x
  on conflict do nothing;

  insert into public.sd_plan_entries (owner, id, date, subject_id, title, detail, kind, done)
  select p_code, x->>'id', nullif(x->>'date','')::date, x->>'subjectId', x->>'title',
         x->>'detail', x->>'kind', coalesce((x->>'done')::boolean, false)
  from jsonb_array_elements(coalesce(d->'plans','[]'::jsonb)) x
  on conflict do nothing;

  insert into public.sd_coverage_plans (owner, id, teacher_id, subject_id, month, title, done)
  select p_code, x->>'id', x->>'teacherId', x->>'subjectId', x->>'month', x->>'title',
         coalesce((x->>'done')::boolean, false)
  from jsonb_array_elements(coalesce(d->'coverage','[]'::jsonb)) x
  on conflict do nothing;

  insert into public.sd_homework (owner, id, title, subject_id, teacher_id, detail, due_date, priority, done, done_at)
  select p_code, x->>'id', x->>'title', x->>'subjectId', x->>'teacherId', x->>'detail',
         nullif(x->>'dueDate','')::date, x->>'priority',
         coalesce((x->>'done')::boolean, false), nullif(x->>'doneAt','')::timestamptz
  from jsonb_array_elements(coalesce(d->'homework','[]'::jsonb)) x
  on conflict do nothing;

  insert into public.sd_exam_events (owner, id, name, kind, start_date, note)
  select p_code, x->>'id', x->>'name', x->>'kind', nullif(x->>'startDate','')::date, x->>'note'
  from jsonb_array_elements(coalesce(d->'exams','[]'::jsonb)) x
  on conflict do nothing;

  insert into public.sd_exam_papers (owner, id, exam_id, subject_id, date, time, note)
  select p_code, p->>'id', x->>'id', p->>'subjectId', nullif(p->>'date','')::date,
         p->>'time', p->>'note'
  from jsonb_array_elements(coalesce(d->'exams','[]'::jsonb)) x
  cross join lateral jsonb_array_elements(coalesce(x->'papers','[]'::jsonb)) p
  on conflict do nothing;

  insert into public.sd_study_sessions (owner, id, date, subject_id, minutes, started_at, note)
  select p_code, x->>'id', nullif(x->>'date','')::date, x->>'subjectId',
         coalesce(nullif(x->>'minutes','')::int, 0), nullif(x->>'startedAt','')::timestamptz,
         x->>'note'
  from jsonb_array_elements(coalesce(d->'studySessions','[]'::jsonb)) x
  on conflict do nothing;

  insert into public.sd_fees (owner, id, teacher_id, month, amount, paid, paid_on, note)
  select p_code, x->>'id', x->>'teacherId', x->>'month', nullif(x->>'amount','')::numeric,
         coalesce((x->>'paid')::boolean, false), nullif(x->>'paidOn','')::date, x->>'note'
  from jsonb_array_elements(coalesce(d->'fees','[]'::jsonb)) x
  on conflict do nothing;

  insert into public.sd_routines (owner, id, title, time, weekdays, active)
  select p_code, x->>'id', x->>'title', x->>'time',
         (select coalesce(array_agg(v::int), '{}') from jsonb_array_elements_text(coalesce(x->'weekdays','[]'::jsonb)) v),
         coalesce((x->>'active')::boolean, true)
  from jsonb_array_elements(coalesce(d->'routines','[]'::jsonb)) x
  on conflict do nothing;

  insert into public.sd_routine_checks (owner, date, routine_id)
  select distinct p_code, k::date, v
  from jsonb_each(coalesce(d->'routineChecks','{}'::jsonb)) as e(k, arr)
  cross join lateral jsonb_array_elements_text(arr) v
  where k ~ '^\d{4}-\d{2}-\d{2}$'
  on conflict do nothing;

  insert into public.sd_goals (owner, id, title, detail, kind, target, progress, unit, due_date, done)
  select p_code, x->>'id', x->>'title', x->>'detail', x->>'kind',
         nullif(x->>'target','')::numeric, nullif(x->>'progress','')::numeric, x->>'unit',
         nullif(x->>'dueDate','')::date, coalesce((x->>'done')::boolean, false)
  from jsonb_array_elements(coalesce(d->'goals','[]'::jsonb)) x
  on conflict do nothing;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. App-facing sync functions
-- ---------------------------------------------------------------------------

create or replace function public.pull_state(p_code uuid)
returns table (data jsonb, updated_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select s.data, s.updated_at
  from public.study_state s
  where s.id = p_code;
$$;

create or replace function public.push_state(
  p_code       uuid,
  p_data       jsonb,
  p_updated_at timestamptz
)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated timestamptz;
begin
  insert into public.study_state (id, data, updated_at)
  values (p_code, p_data, coalesce(p_updated_at, now()))
  on conflict (id) do update
    set data       = excluded.data,
        updated_at = excluded.updated_at
  returning study_state.updated_at into v_updated;

  -- Refresh the analysis tables. Wrapped so a projection problem can never
  -- cost her a sync — the JSON document is the source of truth.
  begin
    perform public.project_state(p_code);
  exception when others then
    raise warning 'project_state failed for %: %', p_code, sqlerrm;
  end;

  return v_updated;
end;
$$;

grant execute on function public.pull_state(uuid)                     to anon, authenticated;
grant execute on function public.push_state(uuid, jsonb, timestamptz) to anon, authenticated;
-- project_state is internal: called by push_state, never by the client.
revoke all on function public.project_state(uuid) from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Analysis views
-- ---------------------------------------------------------------------------

-- Completion per subject, on the same 0-5 basis the app uses.
create or replace view public.v_subject_progress as
select
  c.owner,
  s.name                                            as subject,
  count(*)                                          as chapters,
  round(avg(c.level)::numeric, 2)                   as avg_level,
  round((sum(c.level)::numeric / (count(*) * 5)) * 100, 1) as percent_complete,
  count(*) filter (where c.level = 5)               as exam_ready,
  count(*) filter (where c.level = 0)               as not_started
from public.sd_chapters c
join public.sd_subjects s on s.owner = c.owner and s.id = c.subject_id
group by c.owner, s.name;

-- Level-points gained per ISO week — the momentum series.
create or replace view public.v_weekly_progress as
select
  owner,
  date_trunc('week', at)::date as week,
  sum(level - previous)        as points_gained,
  count(*)                     as changes
from public.sd_level_events
group by owner, date_trunc('week', at)
order by week;

-- Self-study minutes per subject per week.
create or replace view public.v_weekly_study as
select
  ss.owner,
  date_trunc('week', ss.date)::date as week,
  coalesce(s.name, 'General')       as subject,
  sum(ss.minutes)                   as minutes
from public.sd_study_sessions ss
left join public.sd_subjects s on s.owner = ss.owner and s.id = ss.subject_id
group by ss.owner, date_trunc('week', ss.date), s.name
order by week;

-- Did each class actually happen, and did she follow it?
create or replace view public.v_teacher_reliability as
select
  l.owner,
  t.name                                                as teacher,
  count(*)                                              as logged,
  count(*) filter (where l.status = 'HELD')             as held,
  count(*) filter (where l.status = 'CANCELLED')        as cancelled,
  count(*) filter (where l.status = 'MISSED')           as missed,
  round(100.0 * count(*) filter (where l.status = 'HELD') / nullif(count(*), 0), 1) as held_pct,
  round(avg(l.understanding)::numeric, 2)               as avg_understanding
from public.sd_session_logs l
join public.sd_teachers t on t.owner = l.owner and t.id = l.teacher_id
group by l.owner, t.name;

-- Did teachers cover what they said they would, month by month?
create or replace view public.v_coverage_adherence as
select
  c.owner,
  t.name                                       as teacher,
  c.month,
  count(*)                                     as planned,
  count(*) filter (where c.done)               as covered,
  round(100.0 * count(*) filter (where c.done) / nullif(count(*), 0), 1) as adherence_pct
from public.sd_coverage_plans c
join public.sd_teachers t on t.owner = c.owner and t.id = c.teacher_id
group by c.owner, t.name, c.month
order by c.month;

-- Strong chapters going stale — the spaced-repetition queue.
create or replace view public.v_revision_due as
select
  c.owner,
  s.name                                        as subject,
  c.number,
  c.name                                        as chapter,
  c.level,
  c.updated_at,
  (current_date - c.updated_at::date)           as days_since
from public.sd_chapters c
join public.sd_subjects s on s.owner = c.owner and s.id = c.subject_id
where c.level >= 4
  and c.updated_at is not null
  and (current_date - c.updated_at::date) >= 30
order by days_since desc;

-- Study time vs. work remaining, per subject.
create or replace view public.v_effort_vs_need as
with need as (
  select owner, subject_id, sum(5 - level) as points_left
  from public.sd_chapters group by owner, subject_id
),
effort as (
  select owner, subject_id, sum(minutes) as minutes
  from public.sd_study_sessions
  where date >= current_date - 30
  group by owner, subject_id
)
select
  s.owner,
  s.name                                     as subject,
  coalesce(n.points_left, 0)                 as points_left,
  coalesce(e.minutes, 0)                     as minutes_30d,
  round(100.0 * coalesce(n.points_left, 0) / nullif(sum(coalesce(n.points_left, 0)) over (partition by s.owner), 0), 1) as need_share_pct,
  round(100.0 * coalesce(e.minutes, 0)     / nullif(sum(coalesce(e.minutes, 0))     over (partition by s.owner), 0), 1) as effort_share_pct
from public.sd_subjects s
left join need   n on n.owner = s.owner and n.subject_id = s.id
left join effort e on e.owner = s.owner and e.subject_id = s.id
where coalesce(s.archived, false) = false;
