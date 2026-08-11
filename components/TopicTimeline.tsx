"use client";

import Link from "next/link";
import { BookOpen, GraduationCap, PenLine } from "lucide-react";
import { Dot } from "@/components/ui";
import type { TimelineDay, TimelineSource } from "@/lib/selectors";
import { formatDay, todayKey, weekdayOf, WEEKDAY_SHORT } from "@/lib/date";
import type { AppState } from "@/lib/types";

const SOURCE_META: Record<TimelineSource, { icon: typeof BookOpen; label: string }> = {
  COVERED: { icon: BookOpen, label: "covered in class" },
  CLASS: { icon: GraduationCap, label: "class" },
  PLAN: { icon: PenLine, label: "self-study" },
};

/**
 * A three-back / three-forward strip of what she studied, is studying and is
 * about to study. Reads as one continuous run of days rather than three
 * separate widgets, because the useful comparison is across the boundary.
 */
export default function TopicTimeline({
  days,
  state,
}: {
  days: TimelineDay[];
  state: AppState;
}) {
  const today = todayKey();

  return (
    <ol className="space-y-1.5">
      {days.map((day) => {
        const isToday = day.date === today;
        const isPast = day.offset < 0;

        return (
          <li
            key={day.date}
            className="rounded-2xl px-3.5 py-3 transition-colors"
            style={
              isToday
                ? {
                    background: "var(--accent-soft)",
                    boxShadow: "inset 0 0 0 2px var(--accent)",
                  }
                : { background: "var(--surface-2)", opacity: isPast ? 0.82 : 1 }
            }
          >
            <div className="flex items-baseline gap-2">
              <span
                className="display text-sm font-bold"
                style={{ color: isToday ? "var(--accent-strong)" : "var(--text)" }}
              >
                {isToday ? "Today" : formatDay(day.date)}
              </span>
              {!isToday ? (
                <span className="text-[11px] font-bold" style={{ color: "var(--muted)" }}>
                  {WEEKDAY_SHORT[weekdayOf(day.date)]}
                  {day.offset > 0 ? ` · in ${day.offset}d` : ` · ${-day.offset}d ago`}
                </span>
              ) : null}
            </div>

            {day.items.length === 0 ? (
              <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                {isPast ? "Nothing recorded." : "Nothing planned yet."}
              </p>
            ) : (
              <ul className="mt-1.5 space-y-1">
                {day.items.map((item, i) => {
                  const Meta = SOURCE_META[item.source];
                  const Icon = Meta.icon;
                  const color = item.subjectId
                    ? (state.subjects.find((s) => s.id === item.subjectId)?.color ?? "var(--muted)")
                    : "var(--muted)";
                  return (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Icon
                        size={13}
                        className="mt-1 shrink-0"
                        style={{ color: "var(--muted)" }}
                        aria-label={Meta.label}
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          style={
                            item.done
                              ? { color: "var(--muted)", textDecoration: "line-through" }
                              : undefined
                          }
                        >
                          {item.label}
                        </span>
                        {item.subjectId ? (
                          <span
                            className="ml-1.5 inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-semibold"
                            style={{ color: "var(--muted)" }}
                          >
                            <Dot color={color} />
                            {state.subjects.find((s) => s.id === item.subjectId)?.name}
                          </span>
                        ) : null}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        );
      })}
      <li className="pt-1 text-center">
        <Link
          href="/plan"
          className="text-xs font-bold hover:underline"
          style={{ color: "var(--accent)" }}
        >
          Set what teachers will cover →
        </Link>
      </li>
    </ol>
  );
}
