"use client";

import React from "react";
import { LEVELS, MAX_LEVEL } from "@/lib/levels";

/**
 * Deliberately dependency-free SVG charts. The data volumes here are tiny
 * (a few dozen points), so a charting library would cost more in bundle size
 * and theme-wrangling than it saves.
 */

export interface Point {
  label: string;
  value: number;
}

export function BarChart({
  data,
  height = 160,
  color = "var(--accent)",
  suffix = "",
  target,
}: {
  data: Point[];
  height?: number;
  color?: string;
  suffix?: string;
  /** Optional horizontal reference line, e.g. the daily study goal. */
  target?: number;
}) {
  if (data.length === 0) {
    return <p className="muted py-6 text-center text-sm">Nothing logged yet.</p>;
  }
  const max = Math.max(...data.map((d) => d.value), target ?? 0, 1);
  const targetPct = target ? (target / max) * 100 : null;

  return (
    <div>
      <div className="relative flex items-end gap-1.5" style={{ height }}>
        {targetPct !== null ? (
          <div
            className="pointer-events-none absolute inset-x-0 border-t border-dashed"
            style={{ bottom: `${targetPct}%`, borderColor: "var(--warn)" }}
            title={`Target: ${target}${suffix}`}
          />
        ) : null}
        {data.map((d, i) => (
          <div key={i} className="group flex h-full flex-1 flex-col justify-end">
            <div
              className="relative w-full rounded-t-md transition-all"
              style={{
                height: `${Math.max(d.value === 0 ? 0 : 3, (d.value / max) * 100)}%`,
                background: d.value === 0 ? "var(--surface-3)" : color,
                minHeight: d.value === 0 ? 2 : undefined,
              }}
              title={`${d.label}: ${d.value}${suffix}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {data.map((d, i) => (
          <div key={i} className="muted flex-1 truncate text-center text-[10px]">
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Donut({
  percent,
  size = 120,
  stroke = 12,
  color = "var(--accent)",
  track = "var(--surface-3)",
  children,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  color?: string;
  /** Colour of the unfilled ring — override when sitting on a tinted surface. */
  track?: string;
  children?: React.ReactNode;
}) {
  const pct = Math.max(0, Math.min(100, percent));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children ?? <span className="text-xl font-bold">{pct}%</span>}
      </div>
    </div>
  );
}

/**
 * One bar per chapter, height = how well she knows it (0-5). This is the
 * per-subject completion graph: it shows *where* the gaps are along the book,
 * which a single percentage cannot.
 */
export function ChapterLevelChart({
  chapters,
  color,
  height = 44,
}: {
  chapters: { id: string; number: number; name: string; level: number }[];
  color: string;
  height?: number;
}) {
  if (chapters.length === 0) {
    return (
      <p className="text-xs" style={{ color: "var(--muted)" }}>
        No chapters yet.
      </p>
    );
  }

  return (
    <div className="flex items-end gap-[3px]" style={{ height }} aria-hidden>
      {chapters.map((c) => {
        const lv = Math.max(0, Math.min(MAX_LEVEL, c.level ?? 0));
        return (
          <div
            key={c.id}
            className="flex-1 rounded-[3px] transition-all duration-500"
            style={{
              height: lv === 0 ? "10%" : `${(lv / MAX_LEVEL) * 100}%`,
              background: lv === 0 ? "var(--surface-3)" : color,
              opacity: lv === 0 ? 1 : 0.35 + (lv / MAX_LEVEL) * 0.65,
              minWidth: 3,
            }}
            title={`Ch. ${c.number} — ${c.name}: ${lv}/${MAX_LEVEL}`}
          />
        );
      })}
    </div>
  );
}

/** A single stacked bar showing how many chapters sit at each level. */
export function LevelSpread({ byLevel, total }: { byLevel: number[]; total: number }) {
  if (total === 0) return null;
  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-3)" }}>
      {LEVELS.map((lv) => {
        const count = byLevel[lv.value] ?? 0;
        if (count === 0) return null;
        return (
          <div
            key={lv.value}
            style={{
              width: `${(count / total) * 100}%`,
              background: lv.value === 0 ? "var(--surface-3)" : lv.color,
            }}
            title={`${count} × ${lv.short}`}
          />
        );
      })}
    </div>
  );
}
