"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { useStore, uid } from "@/lib/store";
import { Card, ConfirmButton, Dot, Empty, Field, Modal, PageHeader } from "@/components/ui";
import { lastDayOf, nextExam, papersSorted } from "@/lib/selectors";
import { daysBetween, formatDay, formatLongDay, formatTime, todayKey } from "@/lib/date";
import type { ExamEvent, ExamKind, ExamPaper } from "@/lib/types";

const KIND_LABEL: Record<ExamKind, string> = {
  SSC: "SSC Board exam",
  MODEL: "Model test",
  SCHOOL: "School exam",
  COACHING: "Coaching exam",
  OTHER: "Other",
};

function blankExam(startDate: string): ExamEvent {
  return {
    id: uid("ex"),
    name: "",
    kind: "MODEL",
    startDate,
    papers: [],
  };
}

export default function ExamsPage() {
  const { state, upsert, remove } = useStore();
  const [draft, setDraft] = useState<ExamEvent | null>(null);

  const today = todayKey();
  const next = useMemo(() => nextExam(state), [state]);

  const upcoming = useMemo(
    () =>
      [...state.exams]
        .filter((e) => lastDayOf(e) >= today)
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [state.exams, today],
  );

  const past = useMemo(
    () =>
      [...state.exams]
        .filter((e) => lastDayOf(e) < today)
        .sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [state.exams, today],
  );

  const addPaper = () => {
    if (!draft) return;
    setDraft({
      ...draft,
      papers: [
        ...draft.papers,
        { id: uid("pp"), subjectId: null, date: draft.startDate, time: "10:00" },
      ],
    });
  };

  const setPaper = (id: string, patch: Partial<ExamPaper>) => {
    if (!draft) return;
    setDraft({
      ...draft,
      papers: draft.papers.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    });
  };

  const renderRoutine = (exam: ExamEvent, dense = false) => {
    const papers = papersSorted(exam);
    if (papers.length === 0) {
      return (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          No routine entered yet — the start date alone is enough to begin with.
        </p>
      );
    }
    return (
      <ol className="space-y-1.5">
        {papers.map((p) => {
          const subject = state.subjects.find((s) => s.id === p.subjectId);
          const away = daysBetween(today, p.date);
          const done = away < 0;
          return (
            <li
              key={p.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-3 py-2"
              style={{ background: "var(--surface-2)", opacity: done ? 0.55 : 1 }}
            >
              <span className="numeral w-20 shrink-0 text-xs">{formatDay(p.date)}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                {subject ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Dot color={subject.color} />
                    {subject.name}
                  </span>
                ) : (
                  "Paper"
                )}
              </span>
              {p.time ? (
                <span className="shrink-0 text-xs font-semibold" style={{ color: "var(--muted)" }}>
                  {formatTime(p.time)}
                </span>
              ) : null}
              {!dense && !done ? (
                <span className="chip shrink-0">
                  {away === 0 ? "today" : `${away}d`}
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    );
  };

  return (
    <div>
      <PageHeader
        title="Exams"
        subtitle="Upcoming exams and their routines — the SSC board exam, model tests, school and coaching exams."
        action={
          <button className="btn btn-primary" onClick={() => setDraft(blankExam(today))}>
            <Plus size={16} /> Add exam
          </button>
        }
      />

      {/* ---------- Next exam ---------- */}
      {next ? (
        <div
          className="card card-raised mb-6 !border-transparent p-6"
          style={{
            background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%)",
            color: "var(--ink-on-accent)",
          }}
        >
          <div className="eyebrow" style={{ color: "inherit", opacity: 0.8 }}>
            Next exam
          </div>
          <h2 className="display mt-1 text-2xl font-bold">
            {next.name || KIND_LABEL[next.kind]}
          </h2>
          <div className="mt-3 flex flex-wrap items-baseline gap-2">
            <span className="numeral text-5xl">
              {Math.max(0, daysBetween(today, next.startDate))}
            </span>
            <span className="display text-lg font-bold">
              {daysBetween(today, next.startDate) === 0 ? "starts today" : "days away"}
            </span>
          </div>
          <p className="mt-1.5 text-sm font-semibold" style={{ opacity: 0.9 }}>
            Starts {formatLongDay(next.startDate)}
            {next.papers.length > 0 ? ` · ${next.papers.length} papers` : ""}
          </p>
          {next.note ? (
            <p className="mt-2 text-sm" style={{ opacity: 0.85 }}>
              {next.note}
            </p>
          ) : null}
        </div>
      ) : null}

      {state.exams.length === 0 ? (
        <Empty
          title="No exams added yet"
          hint="Add the SSC board exam with its routine, plus any model tests or school exams as they get announced."
          action={
            <button className="btn btn-primary" onClick={() => setDraft(blankExam(today))}>
              <Plus size={16} /> Add the first exam
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 ? (
            <div>
              <h2 className="display mb-3 text-lg font-bold">Upcoming</h2>
              <div className="space-y-3">
                {upcoming.map((exam) => (
                  <Card key={exam.id}>
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="display truncate text-base font-bold">
                          {exam.name || KIND_LABEL[exam.kind]}
                        </h3>
                        <div
                          className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-semibold"
                          style={{ color: "var(--muted)" }}
                        >
                          <span className="chip">{KIND_LABEL[exam.kind]}</span>
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays size={12} />
                            from {formatDay(exam.startDate)}
                          </span>
                          <span>{Math.max(0, daysBetween(today, exam.startDate))} days away</span>
                        </div>
                      </div>
                      <button
                        className="btn btn-ghost !px-2.5 !py-1 text-xs"
                        onClick={() => setDraft({ ...exam, papers: [...exam.papers] })}
                      >
                        Edit
                      </button>
                    </div>
                    {renderRoutine(exam)}
                    {exam.note ? (
                      <p className="mt-2 text-xs italic" style={{ color: "var(--muted)" }}>
                        {exam.note}
                      </p>
                    ) : null}
                  </Card>
                ))}
              </div>
            </div>
          ) : null}

          {past.length > 0 ? (
            <div>
              <h2 className="display mb-3 text-lg font-bold" style={{ color: "var(--muted)" }}>
                Finished
              </h2>
              <div className="space-y-2">
                {past.map((exam) => (
                  <Card key={exam.id} className="!py-3" style={{ opacity: 0.7 }}>
                    <button
                      className="flex w-full items-center gap-3 text-left"
                      onClick={() => setDraft({ ...exam, papers: [...exam.papers] })}
                    >
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                        {exam.name || KIND_LABEL[exam.kind]}
                      </span>
                      <span className="shrink-0 text-xs" style={{ color: "var(--muted)" }}>
                        {formatDay(exam.startDate)}
                      </span>
                    </button>
                  </Card>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ---------- Editor ---------- */}
      <Modal
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={state.exams.some((e) => e.id === draft?.id) ? "Edit exam" : "Add exam"}
        wide
      >
        {draft ? (
          <div className="space-y-3">
            <Field label="Exam name">
              <input
                className="input"
                autoFocus
                value={draft.name}
                placeholder="e.g. SSC Examination 2027, or Model Test 3"
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <select
                  className="input"
                  value={draft.kind}
                  onChange={(e) => setDraft({ ...draft, kind: e.target.value as ExamKind })}
                >
                  {Object.entries(KIND_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Starts on">
                <input
                  className="input"
                  type="date"
                  value={draft.startDate}
                  onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
                />
              </Field>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="label !mb-0">Routine</span>
                <button className="btn btn-ghost !px-2.5 !py-1 text-xs" onClick={addPaper}>
                  <Plus size={13} /> Add paper
                </button>
              </div>

              {draft.papers.length === 0 ? (
                <p className="dashed px-4 py-5 text-center text-sm" style={{ color: "var(--muted)" }}>
                  Optional. Add each paper once the routine is published — the start
                  date alone is enough until then.
                </p>
              ) : (
                <ul className="space-y-2">
                  {draft.papers.map((p) => (
                    <li
                      key={p.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-xl p-2.5"
                      style={{ background: "var(--surface-2)" }}
                    >
                      <div className="grid gap-2 sm:grid-cols-3">
                        <select
                          className="input !py-1.5 text-xs"
                          value={p.subjectId ?? ""}
                          onChange={(e) => setPaper(p.id, { subjectId: e.target.value || null })}
                        >
                          <option value="">Subject…</option>
                          {state.subjects
                            .filter((s) => !s.archived)
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                        </select>
                        <input
                          className="input !py-1.5 text-xs"
                          type="date"
                          value={p.date}
                          onChange={(e) => setPaper(p.id, { date: e.target.value })}
                        />
                        <input
                          className="input !py-1.5 text-xs"
                          type="time"
                          value={p.time ?? ""}
                          onChange={(e) => setPaper(p.id, { time: e.target.value || undefined })}
                        />
                      </div>
                      <button
                        className="btn btn-danger !px-2 !py-1"
                        aria-label="Remove paper"
                        onClick={() =>
                          setDraft({ ...draft, papers: draft.papers.filter((x) => x.id !== p.id) })
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Field label="Note">
              <textarea
                className="input"
                rows={2}
                value={draft.note ?? ""}
                placeholder="Centre, admit card, anything to remember"
                onChange={(e) => setDraft({ ...draft, note: e.target.value })}
              />
            </Field>

            <div className="flex justify-between gap-2 pt-1">
              {state.exams.some((e) => e.id === draft.id) ? (
                <ConfirmButton
                  className="btn btn-danger"
                  onConfirm={() => {
                    remove("exams", draft.id);
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
                  disabled={!draft.startDate}
                  onClick={() => {
                    upsert("exams", { ...draft, name: draft.name.trim() });
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
