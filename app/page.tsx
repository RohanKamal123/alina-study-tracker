"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  Timer,
  TrendingUp,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Card, Dot, Progress, Stat } from "@/components/ui";
import { Donut } from "@/components/charts";
import { SleepingCat } from "@/components/Cat";
import {
  classesOn,
  daysToExam,
  openHomework,
  overdueHomework,
  plansOn,
  routineCompletion,
  routinesFor,
  studyMinutesOn,
  studyStreak,
  subjectColor,
  syllabusProgress,
  uncoveredSubjects,
} from "@/lib/selectors";
import {
  formatDuration,
  formatLongDay,
  formatTime,
  todayKey,
} from "@/lib/date";

export default function DashboardPage() {
  const { state, update } = useStore();
  const today = todayKey();

  const classes = useMemo(() => classesOn(state, today), [state, today]);
  const routines = useMemo(() => routinesFor(state, today), [state, today]);
  const checked = new Set(state.routineChecks[today] ?? []);
  const routineStats = routineCompletion(state, today);
  const plans = useMemo(() => plansOn(state, today), [state, today]);
  const homework = useMemo(() => openHomework(state).slice(0, 5), [state]);
  const overdue = useMemo(() => overdueHomework(state), [state]);
  const progress = useMemo(() => syllabusProgress(state), [state]);
  const gaps = useMemo(() => uncoveredSubjects(state), [state]);

  const left = daysToExam(state);
  const minutesToday = studyMinutesOn(state, today);
  const target = state.settings.dailyStudyMinutesTarget || 180;
  const streak = studyStreak(state);

  const toggleRoutine = (id: string) => {
    update((draft) => {
      const list = draft.routineChecks[today] ?? [];
      draft.routineChecks[today] = list.includes(id)
        ? list.filter((x) => x !== id)
        : [...list, id];
    });
  };

  const toggleHomework = (id: string) => {
    update((draft) => {
      const h = draft.homework.find((x) => x.id === id);
      if (h) {
        h.done = !h.done;
        h.doneAt = h.done ? new Date().toISOString() : undefined;
      }
    });
  };

  const togglePlan = (id: string) => {
    update((draft) => {
      const p = draft.plans.find((x) => x.id === id);
      if (p) p.done = !p.done;
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold sm:text-[32px]">
          Assalamu alaikum, {state.settings.studentName || "there"}
        </h1>
        <p className="mt-1 text-sm font-medium" style={{ color: "var(--muted)" }}>
          {formatLongDay(today)}
        </p>
      </div>

      {/* Countdown hero */}
      <div
        className="card card-raised relative overflow-hidden !border-transparent p-6 sm:p-7"
        style={{
          background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%)",
          color: "var(--ink-on-accent)",
        }}
      >
        {/* Desktop: sits in the open middle of the card, clear of both the
            numerals on the left and the donut on the right. */}
        <SleepingCat
          size={162}
          className="pointer-events-none absolute bottom-2 right-44 hidden sm:block"
          style={{ color: "var(--ink-on-accent)", opacity: 0.28 }}
        />
        {/* Mobile: the donut wraps onto its own row, leaving real space beside
            it — the cat is properly visible there rather than a watermark. */}
        <SleepingCat
          size={148}
          className="pointer-events-none absolute bottom-3 right-2 sm:hidden"
          style={{ color: "var(--ink-on-accent)", opacity: 0.32 }}
        />

        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0">
            <div className="eyebrow" style={{ color: "inherit", opacity: 0.75 }}>
              SSC Examination
            </div>
            {left > 0 ? (
              <>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="numeral text-6xl sm:text-7xl">{left}</span>
                  <span className="display text-xl font-bold sm:text-2xl">days left</span>
                </div>
                <div className="mt-2 text-sm font-semibold" style={{ opacity: 0.85 }}>
                  About {Math.floor(left / 7)} weeks · syllabus {progress.percent}% done
                </div>
              </>
            ) : (
              <div className="display mt-2 text-3xl font-bold">
                {left === 0 ? "It's exam day — you've got this." : "Exams are behind you."}
              </div>
            )}
          </div>

          <div className="relative shrink-0">
            <Donut
              percent={progress.percent}
              size={116}
              stroke={12}
              color="var(--ink-on-accent)"
              track="color-mix(in srgb, var(--ink-on-accent) 22%, transparent)"
            >
              <span className="numeral text-2xl">{progress.percent}%</span>
              <span className="text-[10px] font-bold" style={{ opacity: 0.8 }}>
                syllabus
              </span>
            </Donut>
          </div>
        </div>
      </div>

      {overdue.length > 0 ? (
        <Link
          href="/homework"
          className="card flex items-center gap-3 p-3.5"
          style={{ borderColor: "var(--bad)" }}
        >
          <AlertTriangle size={18} style={{ color: "var(--bad)" }} />
          <span className="text-sm font-semibold">
            {overdue.length} homework {overdue.length === 1 ? "task is" : "tasks are"} overdue
          </span>
        </Link>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Studied"
          value={formatDuration(minutesToday)}
          sub={`Goal ${formatDuration(target)}`}
          tone={minutesToday >= target ? "good" : minutesToday > 0 ? "warn" : "default"}
          icon={<Timer size={13} />}
        />
        <Stat
          label="Streak"
          value={`${streak} ${streak === 1 ? "day" : "days"}`}
          sub={streak > 0 ? "Keep it alive" : "Log some study today"}
          tone={streak >= 3 ? "good" : "default"}
          icon={<Flame size={13} />}
        />
        <Stat
          label="Classes"
          value={classes.length}
          sub={
            classes.length > 0
              ? `First at ${formatTime(classes[0].slot.start)}`
              : "A free day"
          }
          icon={<CalendarDays size={13} />}
        />
        <Stat
          label="Routine"
          value={`${routineStats.done}/${routineStats.total}`}
          sub="Daily habits"
          tone={
            routineStats.total > 0 && routineStats.done === routineStats.total ? "good" : "default"
          }
          icon={<CheckCircle2 size={13} />}
        />
      </div>

      <div className="mt-1">
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
          <span className="muted uppercase tracking-wide">Today&apos;s study goal</span>
          <span className="muted">
            {formatDuration(minutesToday)} / {formatDuration(target)}
          </span>
        </div>
        <Progress
          value={(minutesToday / target) * 100}
          color={minutesToday >= target ? "var(--good)" : "var(--accent)"}
          height={10}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Today's classes */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Today&apos;s classes</h2>
            <Link href="/schedule" className="muted text-xs font-semibold hover:underline">
              Edit schedule
            </Link>
          </div>
          {classes.length === 0 ? (
            <p className="muted py-4 text-center text-sm">
              No classes scheduled today.{" "}
              <Link href="/schedule" className="font-semibold hover:underline">
                Add one
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-2">
              {classes.map(({ slot, teacher, logId }) => (
                <li
                  key={slot.id}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                  style={{ background: "var(--surface-2)" }}
                >
                  <div className="text-center">
                    <div className="text-xs font-bold">{formatTime(slot.start)}</div>
                    <div className="muted text-[10px]">{formatTime(slot.end)}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{teacher?.name}</div>
                    <div className="muted flex flex-wrap items-center gap-1.5 text-xs">
                      {slot.subjectIds.map((sid) => (
                        <span key={sid} className="inline-flex items-center gap-1">
                          <Dot color={subjectColor(state, sid)} />
                          {state.subjects.find((s) => s.id === sid)?.name ?? "?"}
                        </span>
                      ))}
                      <span className="chip">{slot.mode ?? teacher?.mode ?? "OFFLINE"}</span>
                    </div>
                  </div>
                  <Link
                    href={`/calendar?date=${today}`}
                    className="btn btn-ghost !px-2.5 !py-1 text-xs"
                  >
                    {logId ? "Logged" : "Log"}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Daily routine */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Daily routine</h2>
            <Link href="/routines" className="muted text-xs font-semibold hover:underline">
              Manage
            </Link>
          </div>
          {routines.length === 0 ? (
            <p className="muted py-4 text-center text-sm">
              No routine set.{" "}
              <Link href="/routines" className="font-semibold hover:underline">
                Build one
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-1">
              {routines.map((r) => {
                const done = checked.has(r.id);
                return (
                  <li key={r.id}>
                    <button
                      onClick={() => toggleRoutine(r.id)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:opacity-80"
                    >
                      {done ? (
                        <CheckCircle2 size={17} style={{ color: "var(--good)" }} />
                      ) : (
                        <Circle size={17} className="muted" />
                      )}
                      <span className={`min-w-0 flex-1 ${done ? "muted line-through" : ""}`}>
                        {r.title}
                      </span>
                      {r.time ? (
                        <span className="muted flex shrink-0 items-center gap-1 whitespace-nowrap text-xs">
                          <Clock size={11} />
                          {formatTime(r.time)}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Study plan for today */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Study plan for today</h2>
            <Link href={`/calendar?date=${today}`} className="muted text-xs font-semibold hover:underline">
              Open calendar
            </Link>
          </div>
          {plans.length === 0 ? (
            <p className="muted py-4 text-center text-sm">
              Nothing planned.{" "}
              <Link href={`/calendar?date=${today}`} className="font-semibold hover:underline">
                Plan today
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-1">
              {plans.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => togglePlan(p.id)}
                    className="flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left text-sm hover:opacity-80"
                  >
                    {p.done ? (
                      <CheckCircle2 size={17} className="mt-0.5 shrink-0" style={{ color: "var(--good)" }} />
                    ) : (
                      <Circle size={17} className="muted mt-0.5 shrink-0" />
                    )}
                    <span className="min-w-0">
                      <span className={p.done ? "muted line-through" : ""}>{p.title}</span>
                      {p.subjectId ? (
                        <span className="muted ml-1.5 inline-flex items-center gap-1 text-xs">
                          <Dot color={subjectColor(state, p.subjectId)} />
                          {state.subjects.find((s) => s.id === p.subjectId)?.name}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Homework */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Homework next up</h2>
            <Link href="/homework" className="muted text-xs font-semibold hover:underline">
              See all
            </Link>
          </div>
          {homework.length === 0 ? (
            <p className="muted py-4 text-center text-sm">Nothing pending. Nice.</p>
          ) : (
            <ul className="space-y-1">
              {homework.map((h) => {
                const late = h.dueDate && h.dueDate < today;
                return (
                  <li key={h.id}>
                    <button
                      onClick={() => toggleHomework(h.id)}
                      className="flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left text-sm hover:opacity-80"
                    >
                      <Circle size={17} className="muted mt-0.5 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{h.title}</span>
                        <span
                          className="muted text-xs"
                          style={late ? { color: "var(--bad)" } : undefined}
                        >
                          {h.subjectId
                            ? state.subjects.find((s) => s.id === h.subjectId)?.name
                            : "General"}
                          {h.dueDate ? ` · due ${h.dueDate}` : ""}
                          {late ? " · overdue" : ""}
                        </span>
                      </span>
                      {h.priority === "HIGH" ? <span className="chip">High</span> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {gaps.length > 0 ? (
        <Card>
          <div className="flex items-start gap-3">
            <TrendingUp size={18} style={{ color: "var(--warn)" }} className="mt-0.5 shrink-0" />
            <div>
              <h2 className="text-sm font-bold">Subjects with no teacher right now</h2>
              <p className="muted mt-1 text-sm">
                {gaps.map((s) => s.name).join(", ")} — none of your current teachers cover{" "}
                {gaps.length === 1 ? "this" : "these"}. Worth planning self-study, or finding a
                tutor.
              </p>
              <Link href="/teachers" className="btn btn-ghost mt-3 text-xs">
                Manage teachers
              </Link>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
