"use client";

import { useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, ChevronLeft, ChevronRight, Circle, Plus } from "lucide-react";
import { useStore, uid } from "@/lib/store";
import { Card, ConfirmButton, Dot, Empty, Field, Modal, PageHeader, Progress } from "@/components/ui";
import { activeTeachers, classesOn } from "@/lib/selectors";
import {
  addDays,
  currentMonthKey,
  formatDay,
  formatMonthKey,
  formatTime,
  shiftMonthKey,
  todayKey,
  weekdayOf,
  WEEKDAY_SHORT,
} from "@/lib/date";
import type { CoveragePlan } from "@/lib/types";

export default function ClassPlanPage() {
  const { state, upsert, remove, update } = useStore();
  const [month, setMonth] = useState(currentMonthKey());
  const [draft, setDraft] = useState<CoveragePlan | null>(null);

  const today = todayKey();
  const teachers = useMemo(() => activeTeachers(state), [state]);

  /** The next two weeks of scheduled classes, so she can see what's coming. */
  const upcoming = useMemo(() => {
    const days: { date: string; classes: ReturnType<typeof classesOn> }[] = [];
    for (let i = 0; i < 14; i += 1) {
      const date = addDays(today, i);
      const classes = classesOn(state, date);
      if (classes.length > 0) days.push({ date, classes });
    }
    return days;
  }, [state, today]);

  const planFor = (teacherId: string) =>
    state.coverage.filter((c) => c.teacherId === teacherId && c.month === month);

  const toggleDone = (row: CoveragePlan) => upsert("coverage", { ...row, done: !row.done });

  const monthRows = state.coverage.filter((c) => c.month === month);
  const monthDone = monthRows.filter((c) => c.done).length;

  /** Carries anything unfinished into the next month rather than losing it. */
  const rolloverUnfinished = () => {
    const next = shiftMonthKey(month, 1);
    update((draft2) => {
      const unfinished = draft2.coverage.filter((c) => c.month === month && !c.done);
      for (const row of unfinished) {
        const exists = draft2.coverage.some(
          (c) => c.month === next && c.teacherId === row.teacherId && c.title === row.title,
        );
        if (!exists) {
          draft2.coverage.push({ ...row, id: uid("cov"), month: next, done: false });
        }
      }
    });
    setMonth(next);
  };

  return (
    <div>
      <PageHeader
        title="Class plan"
        subtitle="What each teacher says they will cover this month, and which classes are coming up. Ask them at the start of the month and write it down here."
      />

      {teachers.length === 0 ? (
        <Empty
          title="No teachers yet"
          hint="Add your tutors and coaching centres first — the monthly plan hangs off them."
        />
      ) : (
        <div className="space-y-6">
          {/* ---------- Month switcher ---------- */}
          <div className="flex items-center justify-between gap-2">
            <button
              className="btn btn-ghost !px-2.5"
              onClick={() => setMonth(shiftMonthKey(month, -1))}
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="text-center">
              <h2 className="display text-base font-bold">{formatMonthKey(month)}</h2>
              {monthRows.length > 0 ? (
                <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                  {monthDone} of {monthRows.length} topics covered
                </p>
              ) : null}
            </div>
            <button
              className="btn btn-ghost !px-2.5"
              onClick={() => setMonth(shiftMonthKey(month, 1))}
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {monthRows.length > 0 ? (
            <Progress
              value={(monthDone / monthRows.length) * 100}
              color={monthDone === monthRows.length ? "var(--good)" : "var(--accent)"}
            />
          ) : null}

          {/* ---------- Per teacher ---------- */}
          <div className="grid gap-4 md:grid-cols-2">
            {teachers.map((t) => {
              const rows = planFor(t.id);
              return (
                <Card key={t.id}>
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="display truncate text-base font-bold">{t.name}</h3>
                      <div
                        className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs"
                        style={{ color: "var(--muted)" }}
                      >
                        <span className="chip">{t.kind === "COACHING" ? "Coaching" : "Tutor"}</span>
                        {t.subjectIds.slice(0, 2).map((sid) => {
                          const sub = state.subjects.find((x) => x.id === sid);
                          if (!sub) return null;
                          return (
                            <span key={sid} className="inline-flex items-center gap-1">
                              <Dot color={sub.color} />
                              {sub.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost shrink-0 !px-2.5 !py-1 text-xs"
                      onClick={() =>
                        setDraft({
                          id: uid("cov"),
                          teacherId: t.id,
                          subjectId: t.subjectIds[0] ?? null,
                          month,
                          title: "",
                          done: false,
                        })
                      }
                    >
                      <Plus size={13} /> Topic
                    </button>
                  </div>

                  {rows.length === 0 ? (
                    <p className="py-3 text-sm" style={{ color: "var(--muted)" }}>
                      Nothing noted for {formatMonthKey(month)} yet.
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {rows.map((row) => (
                        <li key={row.id} className="flex items-start gap-2">
                          <button
                            className="mt-1.5 shrink-0"
                            onClick={() => toggleDone(row)}
                            aria-label={row.done ? "Mark not covered" : "Mark covered"}
                          >
                            {row.done ? (
                              <CheckCircle2 size={17} style={{ color: "var(--good)" }} />
                            ) : (
                              <Circle size={17} style={{ color: "var(--muted)" }} />
                            )}
                          </button>
                          <button
                            className="min-w-0 flex-1 rounded-lg px-1 py-1 text-left"
                            onClick={() => setDraft({ ...row })}
                          >
                            <span
                              className="block text-sm"
                              style={
                                row.done
                                  ? { color: "var(--muted)", textDecoration: "line-through" }
                                  : undefined
                              }
                            >
                              {row.title}
                            </span>
                            {row.subjectId ? (
                              <span
                                className="inline-flex items-center gap-1 text-xs"
                                style={{ color: "var(--muted)" }}
                              >
                                <Dot
                                  color={
                                    state.subjects.find((s) => s.id === row.subjectId)?.color ??
                                    "#999"
                                  }
                                />
                                {state.subjects.find((s) => s.id === row.subjectId)?.name}
                              </span>
                            ) : null}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              );
            })}
          </div>

          {monthRows.some((c) => !c.done) ? (
            <button className="btn btn-ghost text-xs" onClick={rolloverUnfinished}>
              Move unfinished topics into {formatMonthKey(shiftMonthKey(month, 1))}
            </button>
          ) : null}

          {/* ---------- Upcoming classes ---------- */}
          <div>
            <h2 className="display mb-3 flex items-center gap-2 text-lg font-bold">
              <CalendarClock size={18} style={{ color: "var(--accent)" }} />
              Next two weeks of classes
            </h2>
            {upcoming.length === 0 ? (
              <Empty
                title="No classes scheduled"
                hint="Add recurring class times on the Schedule page and they will appear here."
              />
            ) : (
              <div className="space-y-2">
                {upcoming.map(({ date, classes }) => (
                  <Card key={date} className="!px-4 !py-3">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="display w-28 shrink-0 text-sm font-bold">
                        {date === today ? "Today" : formatDay(date)}
                      </span>
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "var(--muted)" }}
                      >
                        {WEEKDAY_SHORT[weekdayOf(date)]}
                      </span>
                    </div>
                    <ul className="mt-2 space-y-1.5">
                      {classes.map(({ slot, teacher }) => {
                        const planned = state.coverage.find(
                          (c) =>
                            c.teacherId === slot.teacherId &&
                            c.month === date.slice(0, 7) &&
                            !c.done,
                        );
                        return (
                          <li
                            key={slot.id}
                            className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-3 py-2"
                            style={{ background: "var(--surface-2)" }}
                          >
                            <span className="numeral shrink-0 text-xs">
                              {formatTime(slot.start)}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                              {teacher?.name}
                            </span>
                            <span
                              className="min-w-0 basis-full truncate text-xs sm:basis-auto"
                              style={{ color: planned ? "var(--text-soft)" : "var(--muted)" }}
                            >
                              {planned ? `→ ${planned.title}` : "no topic noted"}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Modal
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={state.coverage.some((c) => c.id === draft?.id) ? "Edit topic" : "Add topic"}
      >
        {draft ? (
          <div className="space-y-3">
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {state.teachers.find((t) => t.id === draft.teacherId)?.name} ·{" "}
              {formatMonthKey(draft.month)}
            </p>
            <Field label="Topic they will cover">
              <input
                className="input"
                autoFocus
                value={draft.title}
                placeholder="e.g. Physics ch. 3 — Force, up to Newton's 3rd law"
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </Field>
            <Field label="Subject">
              <select
                className="input"
                value={draft.subjectId ?? ""}
                onChange={(e) => setDraft({ ...draft, subjectId: e.target.value || null })}
              >
                <option value="">Not specific</option>
                {state.subjects
                  .filter((s) => !s.archived)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.done}
                onChange={(e) => setDraft({ ...draft, done: e.target.checked })}
              />
              Already covered
            </label>
            <div className="flex justify-between gap-2 pt-1">
              {state.coverage.some((c) => c.id === draft.id) ? (
                <ConfirmButton
                  className="btn btn-danger"
                  onConfirm={() => {
                    remove("coverage", draft.id);
                    setDraft(null);
                  }}
                >
                  Delete
                </ConfirmButton>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button className="btn btn-ghost" onClick={() => setDraft(null)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  disabled={!draft.title.trim()}
                  onClick={() => {
                    upsert("coverage", { ...draft, title: draft.title.trim() });
                    setDraft(null);
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
