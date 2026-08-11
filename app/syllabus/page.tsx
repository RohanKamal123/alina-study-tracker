"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useStore, uid } from "@/lib/store";
import { Card, ConfirmButton, Dot, Empty, Field, Modal, PageHeader } from "@/components/ui";
import { ChapterLevelChart, LevelSpread } from "@/components/charts";
import { progressBySubject } from "@/lib/selectors";
import { LEVELS, MAX_LEVEL, levelMeta } from "@/lib/levels";
import type { AppState, Chapter } from "@/lib/types";

/**
 * Applies a level change and appends it to the history, so progress over time
 * is reconstructable. Every path that edits a level goes through here.
 */
function recordLevel(draft: AppState, chapter: Chapter, level: number) {
  const previous = chapter.level ?? 0;
  chapter.level = level;
  chapter.updatedAt = new Date().toISOString();
  draft.levelHistory.push({
    id: uid("lv"),
    chapterId: chapter.id,
    subjectId: chapter.subjectId,
    level,
    previous,
    at: chapter.updatedAt,
  });
}

/** The 0-5 picker. Deliberately six real buttons, not a slider — the labels
 *  are the whole point and a slider hides them. */
function LevelPicker({
  value,
  onChange,
  color,
  compact = false,
}: {
  value: number;
  onChange: (v: number) => void;
  color: string;
  compact?: boolean;
}) {
  return (
    <div className="flex gap-1" role="group" aria-label="Understanding level">
      {LEVELS.map((lv) => {
        const on = value >= lv.value && lv.value > 0;
        const isCurrent = value === lv.value;
        return (
          <button
            key={lv.value}
            type="button"
            title={`${lv.value} — ${lv.label}`}
            aria-label={`${lv.value}: ${lv.label}`}
            aria-pressed={isCurrent}
            onClick={() => onChange(lv.value)}
            className="grid place-items-center rounded-md font-bold transition-all"
            style={{
              width: compact ? 22 : 26,
              height: compact ? 24 : 28,
              fontSize: compact ? 11 : 12,
              // All six read as one segmented control; only the fill differs.
              background: on ? color : "var(--surface-3)",
              color: on ? "#fff" : "var(--muted)",
              border: isCurrent
                ? `2px solid ${lv.value === 0 ? "var(--muted)" : color}`
                : "2px solid transparent",
            }}
          >
            {lv.value}
          </button>
        );
      })}
    </div>
  );
}

export default function SyllabusPage() {
  const { state, update, remove } = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const [chapterDraft, setChapterDraft] = useState<Chapter | null>(null);

  const subjects = useMemo(() => progressBySubject(state), [state]);

  const setLevel = (id: string, level: number) => {
    update((draft) => {
      const c = draft.chapters.find((x) => x.id === id);
      if (!c || c.level === level) return;
      recordLevel(draft, c, level);
    });
  };

  return (
    <div>
      <PageHeader
        title="Syllabus"
        subtitle="Rate every chapter 0–5 on how well you actually know it. Be honest — the point is to find the weak ones, not to collect fives."
      />

      {/* The scale, spelled out. */}
      <Card className="mb-5">
        <h2 className="mb-3 text-sm font-bold">What the numbers mean</h2>
        <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {LEVELS.map((lv) => (
            <li key={lv.value} className="flex items-center gap-2.5 text-sm">
              <span
                className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-xs font-bold"
                style={{
                  background: lv.value === 0 ? "var(--surface-3)" : lv.color,
                  color: lv.value === 0 ? "var(--muted)" : "#fff",
                }}
              >
                {lv.value}
              </span>
              <span style={{ color: "var(--text-soft)" }}>{lv.label}</span>
            </li>
          ))}
        </ul>
      </Card>

      {subjects.length === 0 ? (
        <Empty
          title="No subjects yet"
          hint="Add your SSC subjects from Settings and their chapter lists come with them."
        />
      ) : (
        <div className="space-y-3">
          {subjects.map(({ subject, progress, chapters }) => {
            const isOpen = open === subject.id;
            return (
              <Card key={subject.id} className="!p-0 overflow-hidden">
                <button
                  className="flex w-full items-start gap-3 p-4 text-left sm:p-5"
                  onClick={() => setOpen(isOpen ? null : subject.id)}
                >
                  <span className="mt-1 shrink-0">
                    {isOpen ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <span className="flex items-center gap-2">
                        <Dot color={subject.color} />
                        <span className="display text-base font-bold">{subject.name}</span>
                      </span>
                      <span className="flex items-baseline gap-2">
                        <span
                          className="numeral text-2xl"
                          style={{ color: subject.color }}
                        >
                          {progress.percent}%
                        </span>
                        <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                          avg {progress.average}/{MAX_LEVEL}
                        </span>
                      </span>
                    </div>

                    {/* Per-subject completion graph: one bar per chapter. */}
                    <div className="mt-3">
                      <ChapterLevelChart chapters={chapters} color={subject.color} />
                    </div>

                    <div className="mt-2.5">
                      <LevelSpread byLevel={progress.byLevel} total={progress.total} />
                    </div>

                    <div
                      className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs font-semibold"
                      style={{ color: "var(--muted)" }}
                    >
                      <span>{progress.total} chapters</span>
                      <span style={{ color: progress.examReady ? "var(--good)" : undefined }}>
                        {progress.examReady} exam-ready
                      </span>
                      <span style={{ color: progress.untouched ? "var(--warn)" : undefined }}>
                        {progress.untouched} not started
                      </span>
                    </div>
                  </div>
                </button>

                {isOpen ? (
                  <div
                    className="border-t px-3 pb-3 sm:px-4"
                    style={{ borderColor: "color-mix(in srgb, var(--border) 70%, transparent)" }}
                  >
                    <ul>
                      {chapters.map((c) => {
                        const meta = levelMeta(c.level);
                        return (
                          <li
                            key={c.id}
                            className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b py-3 last:border-b-0"
                            style={{
                              borderColor: "color-mix(in srgb, var(--border) 55%, transparent)",
                            }}
                          >
                            <span
                              className="numeral w-6 shrink-0 text-sm"
                              style={{ color: "var(--muted)" }}
                            >
                              {c.number}
                            </span>
                            <button
                              className="min-w-0 flex-1 text-left"
                              onClick={() => setChapterDraft({ ...c })}
                            >
                              <span className="block truncate text-sm font-semibold">{c.name}</span>
                              <span
                                className="block truncate text-xs"
                                style={{ color: "var(--muted)" }}
                              >
                                {c.nameBn ? `${c.nameBn} · ` : ""}
                                {meta.label}
                              </span>
                            </button>
                            <LevelPicker
                              value={c.level}
                              color={subject.color}
                              onChange={(v) => setLevel(c.id, v)}
                            />
                          </li>
                        );
                      })}
                    </ul>
                    <button
                      className="btn btn-ghost mt-3 text-xs"
                      onClick={() =>
                        setChapterDraft({
                          id: uid("ch"),
                          subjectId: subject.id,
                          number: chapters.length + 1,
                          name: "",
                          level: 0,
                        })
                      }
                    >
                      <Plus size={13} /> Add chapter
                    </button>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={chapterDraft !== null}
        onClose={() => setChapterDraft(null)}
        title={state.chapters.some((c) => c.id === chapterDraft?.id) ? "Edit chapter" : "Add chapter"}
      >
        {chapterDraft ? (
          <div className="space-y-3">
            <div className="grid grid-cols-[80px_minmax(0,1fr)] gap-3">
              <Field label="No.">
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={chapterDraft.number}
                  onChange={(e) =>
                    setChapterDraft({ ...chapterDraft, number: Number(e.target.value) || 1 })
                  }
                />
              </Field>
              <Field label="Chapter name">
                <input
                  className="input"
                  autoFocus
                  value={chapterDraft.name}
                  onChange={(e) => setChapterDraft({ ...chapterDraft, name: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Bangla name">
              <input
                className="input"
                value={chapterDraft.nameBn ?? ""}
                onChange={(e) => setChapterDraft({ ...chapterDraft, nameBn: e.target.value })}
              />
            </Field>
            <div>
              <span className="label">How well do you know it?</span>
              <div className="space-y-1.5">
                {LEVELS.map((lv) => (
                  <button
                    key={lv.value}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors"
                    style={{
                      background:
                        chapterDraft.level === lv.value ? "var(--accent-soft)" : "var(--surface-2)",
                      border:
                        chapterDraft.level === lv.value
                          ? "2px solid var(--accent)"
                          : "2px solid transparent",
                    }}
                    onClick={() => setChapterDraft({ ...chapterDraft, level: lv.value })}
                  >
                    <span
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold"
                      style={{
                        background: lv.value === 0 ? "var(--surface-3)" : lv.color,
                        color: lv.value === 0 ? "var(--muted)" : "#fff",
                      }}
                    >
                      {lv.value}
                    </span>
                    {lv.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-between gap-2 pt-1">
              {state.chapters.some((c) => c.id === chapterDraft.id) ? (
                <ConfirmButton
                  className="btn btn-danger"
                  onConfirm={() => {
                    remove("chapters", chapterDraft.id);
                    setChapterDraft(null);
                  }}
                >
                  Delete
                </ConfirmButton>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button className="btn btn-ghost" onClick={() => setChapterDraft(null)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  disabled={!chapterDraft.name.trim()}
                  onClick={() => {
                    const next = { ...chapterDraft, name: chapterDraft.name.trim() };
                    update((draft) => {
                      const existing = draft.chapters.find((c) => c.id === next.id);
                      if (!existing) {
                        draft.chapters.push(next);
                        if (next.level > 0) {
                          draft.levelHistory.push({
                            id: uid("lv"),
                            chapterId: next.id,
                            subjectId: next.subjectId,
                            level: next.level,
                            previous: 0,
                            at: new Date().toISOString(),
                          });
                        }
                        return;
                      }
                      const levelChanged = existing.level !== next.level;
                      Object.assign(existing, next);
                      if (levelChanged) recordLevel(draft, existing, next.level);
                    });
                    setChapterDraft(null);
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
