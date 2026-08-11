"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Flame,
  RotateCcw,
  TrendingUp,
  Users,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Card, Dot, Empty, PageHeader, Progress, Stat } from "@/components/ui";
import { BarChart } from "@/components/charts";
import {
  MIN_SAMPLE_DAYS,
  consistency,
  effortVsNeed,
  forecast,
  revisionDue,
  teacherReports,
  weakChapters,
  weeklyPoints,
} from "@/lib/insights";
import { daysToExam } from "@/lib/selectors";
import { levelMeta } from "@/lib/levels";
import { formatDuration } from "@/lib/date";

export default function InsightsPage() {
  const { state } = useStore();

  const fc = useMemo(() => forecast(state), [state]);
  const weekly = useMemo(() => weeklyPoints(state, 8), [state]);
  const weak = useMemo(() => weakChapters(state, 2, 10), [state]);
  const revise = useMemo(() => revisionDue(state, 30, 8), [state]);
  const effort = useMemo(() => effortVsNeed(state, 30), [state]);
  const teachers = useMemo(() => teacherReports(state, 90), [state]);
  const cons = useMemo(() => consistency(state, 30), [state]);

  const left = daysToExam(state);
  const hasHistory = state.levelHistory.length > 0;
  const underServed = effort.rows.filter((e) => e.gap >= 8 && e.needShare > 0).slice(0, 4);
  const overServed = effort.rows.filter((e) => e.gap <= -8 && e.effortShare > 0).slice(0, 2);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Insights"
        subtitle="Worked out from your own data, on this device. Nothing here is a guess — it is arithmetic on what you have logged."
      />

      {/* ---------- Forecast ---------- */}
      <Card
        className="!border-transparent"
        style={{
          background:
            fc.onTrack === false
              ? "color-mix(in srgb, var(--warn) 12%, var(--surface))"
              : "var(--surface)",
        }}
      >
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp size={18} style={{ color: "var(--accent)" }} />
          <h2 className="display text-lg font-bold">Will you finish in time?</h2>
        </div>

        {!hasHistory ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Not enough history yet. Rate a few chapters on the{" "}
            <Link href="/syllabus" className="font-bold hover:underline" style={{ color: "var(--accent)" }}>
              Syllabus
            </Link>{" "}
            page and come back in a week — this needs to watch you move before it can say anything
            honest.
          </p>
        ) : !fc.enoughData ? (
          <>
            <p className="text-sm leading-relaxed">
              <strong>Still measuring.</strong> There is only {fc.sampleDays} day
              {fc.sampleDays === 1 ? "" : "s"} of history across {fc.activeDays} active
              {fc.activeDays === 1 ? " day" : " days"}. A weekly pace worked out from that would be
              noise, so no forecast yet — keep rating chapters and it appears once there are{" "}
              {MIN_SAMPLE_DAYS} days of history.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat label="Left to do" value={fc.remaining} sub="level-points" />
              <Stat
                label="Needed"
                value={`${fc.requiredPerWeek}`}
                sub="points / week"
                tone="warn"
              />
              <Stat label="Weeks left" value={fc.weeksAvailable} sub={`${left} days`} />
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat
                label="Pace"
                value={`${fc.perWeek}`}
                sub="points / week"
                icon={<ArrowUpRight size={13} />}
                tone={fc.perWeek > 0 ? "good" : "warn"}
              />
              <Stat label="Left to do" value={fc.remaining} sub="level-points" />
              <Stat
                label="Needed"
                value={`${fc.requiredPerWeek}`}
                sub="points / week"
                tone={fc.perWeek >= fc.requiredPerWeek ? "good" : "bad"}
              />
              <Stat label="Weeks left" value={fc.weeksAvailable} sub={`${left} days`} />
            </div>

            <p className="mt-4 text-sm leading-relaxed">
              {fc.perWeek <= 0 ? (
                <>
                  Nothing has moved in the last four weeks. At a standstill the syllabus will not
                  finish itself — even one chapter a week changes the arithmetic.
                </>
              ) : fc.onTrack ? (
                <>
                  <strong style={{ color: "var(--good)" }}>On track.</strong> At {fc.perWeek} points
                  a week you need about <strong>{fc.weeksNeeded} weeks</strong> and you have{" "}
                  <strong>{fc.weeksAvailable}</strong>. Keep this pace and everything reaches level 5
                  before the exam.
                </>
              ) : (
                <>
                  <strong style={{ color: "var(--warn)" }}>Behind pace.</strong> At {fc.perWeek}{" "}
                  points a week this takes <strong>{fc.weeksNeeded} weeks</strong>, but only{" "}
                  <strong>{fc.weeksAvailable}</strong> remain. You need about{" "}
                  <strong>{fc.requiredPerWeek} points a week</strong> — roughly{" "}
                  {Math.ceil(fc.requiredPerWeek / 5)} chapter{Math.ceil(fc.requiredPerWeek / 5) === 1 ? "" : "s"}{" "}
                  taken from nothing to exam-ready each week.
                </>
              )}
            </p>

            <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
              Based on {fc.sampleDays} days of history.
            </p>

            <div className="mt-4">
              <div className="eyebrow mb-2">Momentum — points gained per week</div>
              <BarChart data={weekly} height={80} suffix=" pts" />
            </div>
          </>
        )}
      </Card>

      {/* ---------- Effort vs need ---------- */}
      <Card>
        <h2 className="display mb-1 text-lg font-bold">Where your time goes vs. where it is needed</h2>
        <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>
          Study hours over the last 30 days, against each subject&apos;s share of the work still
          left.
        </p>

        {effort.taggedMinutes === 0 ? (
          <Empty
            title={
              effort.untaggedMinutes > 0
                ? "Your study time has no subject on it"
                : "No study logged yet"
            }
            hint={
              effort.untaggedMinutes > 0
                ? `${formatDuration(effort.untaggedMinutes)} logged in the last 30 days, but all of it as "General study". Pick a subject when you start the timer and this comparison starts working.`
                : "Use the Study timer for a couple of weeks and this becomes the most useful thing on the page."
            }
          />
        ) : (
          <>
            {underServed.length > 0 ? (
              <div
                className="mb-4 rounded-xl px-4 py-3"
                style={{ background: "color-mix(in srgb, var(--warn) 14%, transparent)" }}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" style={{ color: "var(--warn)" }} />
                  <p className="text-sm leading-relaxed">
                    <strong>{underServed.map((e) => e.subject.name).join(", ")}</strong>{" "}
                    {underServed.length === 1 ? "holds" : "hold"} a big share of the remaining
                    syllabus but little of your study time.
                    {overServed.length > 0 ? (
                      <>
                        {" "}
                        Meanwhile <strong>{overServed.map((e) => e.subject.name).join(" and ")}</strong>{" "}
                        {overServed.length === 1 ? "is" : "are"} taking more time than the work left
                        justifies.
                      </>
                    ) : null}
                  </p>
                </div>
              </div>
            ) : null}

            <ul className="space-y-3">
              {effort.rows.map((row) => (
                <li key={row.subject.id}>
                  <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <span className="flex min-w-0 items-center gap-1.5 text-sm font-bold">
                      <Dot color={row.subject.color} />
                      <span className="truncate">{row.subject.name}</span>
                    </span>
                    <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                      {formatDuration(row.minutes)} · {row.percent}% done
                      {row.gap >= 8 ? (
                        <span style={{ color: "var(--warn)" }}> · needs more time</span>
                      ) : row.gap <= -8 ? (
                        <span style={{ color: "var(--muted)" }}> · well served</span>
                      ) : null}
                    </span>
                  </div>
                  {/* Two bars: time spent above, work remaining below. */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-10 shrink-0 text-[10px] font-bold" style={{ color: "var(--muted)" }}>
                        time
                      </span>
                      <div className="flex-1">
                        <Progress value={row.effortShare} color={row.subject.color} height={7} />
                      </div>
                      <span className="w-9 shrink-0 text-right text-[10px] tabular-nums" style={{ color: "var(--muted)" }}>
                        {row.effortShare}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-10 shrink-0 text-[10px] font-bold" style={{ color: "var(--muted)" }}>
                        work
                      </span>
                      <div className="flex-1">
                        <Progress value={row.needShare} color="var(--surface-3)" height={7} />
                      </div>
                      <span className="w-9 shrink-0 text-right text-[10px] tabular-nums" style={{ color: "var(--muted)" }}>
                        {row.needShare}%
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {effort.untaggedMinutes > 0 ? (
              <p className="mt-3 text-xs" style={{ color: "var(--muted)" }}>
                {formatDuration(effort.untaggedMinutes)} more was logged without a subject, so it is
                not counted above.
              </p>
            ) : null}
          </>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ---------- Weakest chapters ---------- */}
        <Card>
          <h2 className="display mb-3 text-lg font-bold">Weakest chapters</h2>
          {weak.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Nothing sitting at level 2 or below. Good place to be.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {weak.map(({ chapter, subject, ageDays }) => {
                const meta = levelMeta(chapter.level);
                return (
                  <li
                    key={chapter.id}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2"
                    style={{ background: "var(--surface-2)" }}
                  >
                    <span
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-xs font-bold"
                      style={{
                        background: chapter.level === 0 ? "var(--surface-3)" : meta.color,
                        color: chapter.level === 0 ? "var(--muted)" : "#fff",
                      }}
                    >
                      {chapter.level}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{chapter.name}</span>
                      <span
                        className="flex items-center gap-1 text-[11px]"
                        style={{ color: "var(--muted)" }}
                      >
                        <Dot color={subject.color} />
                        {subject.name}
                        {ageDays !== null && ageDays > 14 ? ` · untouched ${ageDays}d` : ""}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <Link
            href="/syllabus"
            className="mt-3 inline-block text-xs font-bold hover:underline"
            style={{ color: "var(--accent)" }}
          >
            Open syllabus →
          </Link>
        </Card>

        {/* ---------- Revision due ---------- */}
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <RotateCcw size={16} style={{ color: "var(--accent)" }} />
            <h2 className="display text-lg font-bold">Due a revision</h2>
          </div>
          {revise.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Nothing strong has gone stale yet. Chapters you take to level 4 or 5 will appear here
              a month later.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {revise.map(({ chapter, subject, ageDays }) => (
                <li
                  key={chapter.id}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2"
                  style={{ background: "var(--surface-2)" }}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{chapter.name}</span>
                    <span
                      className="flex items-center gap-1 text-[11px]"
                      style={{ color: "var(--muted)" }}
                    >
                      <Dot color={subject.color} />
                      {subject.name}
                    </span>
                  </span>
                  <span className="chip shrink-0">{ageDays}d ago</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* ---------- Consistency ---------- */}
      <Card>
        <div className="mb-3 flex items-center gap-2">
          <Flame size={17} style={{ color: "var(--accent)" }} />
          <h2 className="display text-lg font-bold">Consistency, last 30 days</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            label="Days studied"
            value={`${cons.daysStudied}/${cons.windowDays}`}
            tone={cons.daysStudied >= 20 ? "good" : cons.daysStudied >= 10 ? "warn" : "bad"}
            icon={<CheckCircle2 size={13} />}
          />
          <Stat label="Total" value={formatDuration(cons.totalMinutes)} sub="self-study" />
          <Stat
            label="Per day"
            value={formatDuration(cons.avgMinutesPerActiveDay)}
            sub="average"
          />
          <Stat
            label="Best streak"
            value={`${cons.bestStreak}d`}
            tone={cons.bestStreak >= 7 ? "good" : "default"}
            icon={<Flame size={13} />}
          />
        </div>
        <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
          You hit the daily goal on <strong>{cons.goalDays}</strong> of the last {cons.windowDays}{" "}
          days.
        </p>
      </Card>

      {/* ---------- Teachers ---------- */}
      <Card>
        <div className="mb-3 flex items-center gap-2">
          <Users size={17} style={{ color: "var(--accent)" }} />
          <h2 className="display text-lg font-bold">Are your teachers delivering?</h2>
        </div>
        {teachers.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No current teachers.
          </p>
        ) : (
          <div className="scroll-x">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-left" style={{ color: "var(--muted)" }}>
                  <th className="pb-2 font-bold">Teacher</th>
                  <th className="pb-2 text-right font-bold">Held</th>
                  <th className="pb-2 text-right font-bold">Missed</th>
                  <th className="pb-2 text-right font-bold">Ran</th>
                  <th className="pb-2 text-right font-bold">Topics</th>
                  <th className="pb-2 text-right font-bold">You followed</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((r) => (
                  <tr
                    key={r.teacher.id}
                    className="border-t"
                    style={{ borderColor: "color-mix(in srgb, var(--border) 60%, transparent)" }}
                  >
                    <td className="py-2 pr-3 font-semibold">{r.teacher.name}</td>
                    <td className="py-2 text-right tabular-nums">{r.held}</td>
                    <td
                      className="py-2 text-right tabular-nums"
                      style={{ color: r.missed > 0 ? "var(--bad)" : undefined }}
                    >
                      {r.missed + r.cancelled}
                    </td>
                    <td
                      className="py-2 text-right tabular-nums font-bold"
                      style={{
                        color:
                          r.reliability === null
                            ? "var(--muted)"
                            : r.reliability >= 85
                              ? "var(--good)"
                              : r.reliability >= 60
                                ? "var(--warn)"
                                : "var(--bad)",
                      }}
                    >
                      {r.reliability === null ? "—" : `${r.reliability}%`}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {r.plannedTopics === 0 ? "—" : `${r.coveredTopics}/${r.plannedTopics}`}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {r.avgUnderstanding === null ? "—" : `${r.avgUnderstanding}/5`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs" style={{ color: "var(--muted)" }}>
          Built from class logs and the monthly class plan. &ldquo;Ran&rdquo; is how often a
          scheduled class actually happened; &ldquo;you followed&rdquo; is your own 1–5 rating from
          the class log.
        </p>
      </Card>
    </div>
  );
}
