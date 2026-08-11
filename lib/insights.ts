import type { AppState, Chapter, ID, Subject, Teacher } from "./types";
import { MAX_LEVEL } from "./levels";
import { addDays, daysBetween, todayKey } from "./date";
import { activeTeachers, syllabusProgress } from "./selectors";

/**
 * Everything here is computed on the device from her own data. Nothing is
 * predictive in a statistical sense - these are arithmetic observations she
 * could make herself given enough patience, surfaced automatically.
 */

// ---------------------------------------------------------------------------
// Velocity and forecast
// ---------------------------------------------------------------------------

/** Level-points gained (net of any slips) over the last `days` days. */
export function pointsGained(state: AppState, days = 28): number {
  const from = addDays(todayKey(), -days);
  return state.levelHistory
    .filter((e) => e.at.slice(0, 10) >= from)
    .reduce((sum, e) => sum + (e.level - e.previous), 0);
}

/** Total level-points still needed to get every chapter to 5. */
export function pointsRemaining(state: AppState): number {
  const live = new Set(state.subjects.filter((s) => !s.archived).map((s) => s.id));
  return state.chapters
    .filter((c) => live.has(c.subjectId))
    .reduce((sum, c) => sum + (MAX_LEVEL - Math.min(MAX_LEVEL, c.level ?? 0)), 0);
}

export interface Forecast {
  /** Level-points per week over the sample window. */
  perWeek: number;
  remaining: number;
  /** Weeks needed at the current rate, or null when nothing is moving. */
  weeksNeeded: number | null;
  weeksAvailable: number;
  /** True when the current rate finishes the syllabus before the exam. */
  onTrack: boolean | null;
  /** Points per week she would need to finish exactly on time. */
  requiredPerWeek: number;
  /** Days actually spanned by the history, not the nominal window. */
  sampleDays: number;
  /** Distinct days on which anything moved. */
  activeDays: number;
  /**
   * False until there is enough history for a rate to mean anything. One
   * afternoon of rating chapters would otherwise produce a confident-looking
   * projection built on a single data point.
   */
  enoughData: boolean;
}

/** A rate needs at least this much history before it is worth quoting. */
export const MIN_SAMPLE_DAYS = 7;
export const MIN_ACTIVE_DAYS = 2;

/**
 * Projects the current rate of progress forward to the exam date.
 *
 * Uses a 28-day window: long enough to survive a quiet week, short enough to
 * react when she changes gear.
 */
export function forecast(state: AppState, windowDays = 28): Forecast {
  const today = todayKey();
  const from = addDays(today, -windowDays);
  const events = state.levelHistory.filter((e) => e.at.slice(0, 10) >= from);

  const gained = events.reduce((sum, e) => sum + (e.level - e.previous), 0);
  const activeDates = new Set(events.map((e) => e.at.slice(0, 10)));
  const earliest = [...activeDates].sort()[0];

  // Divide by the span actually observed, not the nominal window - otherwise
  // a single busy afternoon looks like a month of steady work.
  const sampleDays = earliest ? Math.max(1, daysBetween(earliest, today) + 1) : 0;
  const perWeek = sampleDays > 0 ? (gained / sampleDays) * 7 : 0;

  const remaining = pointsRemaining(state);
  const daysLeft = Math.max(0, daysBetween(today, state.settings.examDate));
  const weeksAvailable = daysLeft / 7;

  const enoughData = sampleDays >= MIN_SAMPLE_DAYS && activeDates.size >= MIN_ACTIVE_DAYS;
  const weeksNeeded = perWeek > 0 ? remaining / perWeek : null;
  const requiredPerWeek = weeksAvailable > 0 ? remaining / weeksAvailable : remaining;

  return {
    perWeek: Math.round(perWeek * 10) / 10,
    remaining,
    weeksNeeded: weeksNeeded === null ? null : Math.round(weeksNeeded * 10) / 10,
    weeksAvailable: Math.round(weeksAvailable * 10) / 10,
    onTrack: enoughData && weeksNeeded !== null ? weeksNeeded <= weeksAvailable : null,
    requiredPerWeek: Math.round(requiredPerWeek * 10) / 10,
    sampleDays,
    activeDays: activeDates.size,
    enoughData,
  };
}

/** Net level-points per week, oldest week first — feeds the momentum chart. */
export function weeklyPoints(state: AppState, weeks = 8): { label: string; value: number }[] {
  const out: { label: string; value: number }[] = [];
  for (let w = weeks - 1; w >= 0; w -= 1) {
    const end = addDays(todayKey(), -w * 7);
    const start = addDays(end, -6);
    const value = state.levelHistory
      .filter((e) => {
        const d = e.at.slice(0, 10);
        return d >= start && d <= end;
      })
      .reduce((sum, e) => sum + (e.level - e.previous), 0);
    out.push({ label: w === 0 ? "now" : `-${w}w`, value: Math.max(0, value) });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Weak spots and staleness
// ---------------------------------------------------------------------------

export interface WeakChapter {
  chapter: Chapter;
  subject: Subject;
  /** Days since the level last moved; null if it never has. */
  ageDays: number | null;
}

/** Chapters at or below `maxLevel`, weakest and stalest first. */
export function weakChapters(state: AppState, maxLevel = 2, limit = 12): WeakChapter[] {
  const subjects = new Map(state.subjects.map((s) => [s.id, s]));
  const today = todayKey();

  return state.chapters
    .filter((c) => (c.level ?? 0) <= maxLevel)
    .map((chapter): WeakChapter | null => {
      const subject = subjects.get(chapter.subjectId);
      const ageDays = chapter.updatedAt
        ? daysBetween(chapter.updatedAt.slice(0, 10), today)
        : null;
      return subject && !subject.archived ? { chapter, subject, ageDays } : null;
    })
    .filter((x): x is WeakChapter => x !== null)
    .sort(
      (a, b) =>
        a.chapter.level - b.chapter.level || (b.ageDays ?? 9999) - (a.ageDays ?? 9999),
    )
    .slice(0, limit);
}

/**
 * Chapters she got to 4 or 5 and has not touched since. These are the ones
 * that quietly decay, and the cheapest marks to protect.
 */
export function revisionDue(state: AppState, afterDays = 30, limit = 10): WeakChapter[] {
  const subjects = new Map(state.subjects.map((s) => [s.id, s]));
  const today = todayKey();

  return state.chapters
    .filter((c) => (c.level ?? 0) >= 4 && c.updatedAt)
    .map((chapter): WeakChapter | null => {
      const subject = subjects.get(chapter.subjectId);
      const ageDays = daysBetween(chapter.updatedAt!.slice(0, 10), today);
      return subject && !subject.archived && ageDays >= afterDays
        ? { chapter, subject, ageDays }
        : null;
    })
    .filter((x): x is WeakChapter => x !== null)
    .sort((a, b) => (b.ageDays ?? 0) - (a.ageDays ?? 0))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Effort vs. need
// ---------------------------------------------------------------------------

export interface EffortSummary {
  rows: EffortRow[];
  /** Minutes logged with no subject attached - invisible to the comparison. */
  untaggedMinutes: number;
  taggedMinutes: number;
}

export interface EffortRow {
  subject: Subject;
  /** Self-study minutes over the window. */
  minutes: number;
  /** Share of total study time, 0-100. */
  effortShare: number;
  /** Share of all remaining level-points, 0-100. */
  needShare: number;
  percent: number;
  /** needShare - effortShare. Positive = under-served. */
  gap: number;
}

/**
 * Compares where her study time goes against where the syllabus still needs
 * work. A subject taking 5% of her hours while holding 25% of the remaining
 * work is the single most actionable thing this app can tell her.
 */
export function effortVsNeed(state: AppState, days = 30): EffortSummary {
  const from = addDays(todayKey(), -days);
  const subjects = state.subjects.filter((s) => !s.archived);

  const minutesBySubject = new Map<ID, number>();
  let untaggedMinutes = 0;
  for (const s of state.studySessions) {
    if (s.date < from) continue;
    if (!s.subjectId) {
      untaggedMinutes += s.minutes;
      continue;
    }
    minutesBySubject.set(s.subjectId, (minutesBySubject.get(s.subjectId) ?? 0) + s.minutes);
  }

  const needBySubject = new Map<ID, number>();
  for (const c of state.chapters) {
    const need = MAX_LEVEL - Math.min(MAX_LEVEL, c.level ?? 0);
    needBySubject.set(c.subjectId, (needBySubject.get(c.subjectId) ?? 0) + need);
  }

  const totalMinutes = [...minutesBySubject.values()].reduce((a, b) => a + b, 0);
  const totalNeed = [...needBySubject.values()].reduce((a, b) => a + b, 0);

  const rows = subjects
    .map((subject) => {
      const minutes = minutesBySubject.get(subject.id) ?? 0;
      const need = needBySubject.get(subject.id) ?? 0;
      const effortShare = totalMinutes > 0 ? (minutes / totalMinutes) * 100 : 0;
      const needShare = totalNeed > 0 ? (need / totalNeed) * 100 : 0;
      return {
        subject,
        minutes,
        effortShare: Math.round(effortShare),
        needShare: Math.round(needShare),
        percent: syllabusProgress(state, subject.id).percent,
        gap: Math.round(needShare - effortShare),
      };
    })
    .sort((a, b) => b.gap - a.gap);

  return { rows, untaggedMinutes, taggedMinutes: totalMinutes };
}

// ---------------------------------------------------------------------------
// Teachers: reliability and whether they cover what they promise
// ---------------------------------------------------------------------------

export interface TeacherReport {
  teacher: Teacher;
  held: number;
  cancelled: number;
  missed: number;
  logged: number;
  /** Held as a share of everything logged, 0-100. Null when nothing logged. */
  reliability: number | null;
  plannedTopics: number;
  coveredTopics: number;
  /** Covered as a share of planned, 0-100. Null when nothing was planned. */
  adherence: number | null;
  /** Mean self-reported understanding in their classes, 1-5. */
  avgUnderstanding: number | null;
}

export function teacherReports(state: AppState, days = 90): TeacherReport[] {
  const from = addDays(todayKey(), -days);

  return activeTeachers(state).map((teacher) => {
    const logs = state.sessionLogs.filter((l) => l.teacherId === teacher.id && l.date >= from);
    const held = logs.filter((l) => l.status === "HELD").length;
    const cancelled = logs.filter((l) => l.status === "CANCELLED").length;
    const missed = logs.filter((l) => l.status === "MISSED").length;

    const cov = state.coverage.filter((c) => c.teacherId === teacher.id);
    const coveredTopics = cov.filter((c) => c.done).length;

    const understanding = logs
      .map((l) => l.understanding)
      .filter((u): u is number => typeof u === "number");

    return {
      teacher,
      held,
      cancelled,
      missed,
      logged: logs.length,
      reliability: logs.length > 0 ? Math.round((held / logs.length) * 100) : null,
      plannedTopics: cov.length,
      coveredTopics,
      adherence: cov.length > 0 ? Math.round((coveredTopics / cov.length) * 100) : null,
      avgUnderstanding:
        understanding.length > 0
          ? Math.round((understanding.reduce((a, b) => a + b, 0) / understanding.length) * 10) / 10
          : null,
    };
  });
}

// ---------------------------------------------------------------------------
// Study consistency
// ---------------------------------------------------------------------------

export interface ConsistencyReport {
  daysStudied: number;
  windowDays: number;
  totalMinutes: number;
  avgMinutesPerActiveDay: number;
  /** Days hitting the daily goal. */
  goalDays: number;
  bestStreak: number;
}

export function consistency(state: AppState, days = 30): ConsistencyReport {
  const target = state.settings.dailyStudyMinutesTarget || 180;
  const byDay = new Map<string, number>();
  const from = addDays(todayKey(), -(days - 1));

  for (const s of state.studySessions) {
    if (s.date < from) continue;
    byDay.set(s.date, (byDay.get(s.date) ?? 0) + s.minutes);
  }

  const totalMinutes = [...byDay.values()].reduce((a, b) => a + b, 0);
  const daysStudied = [...byDay.values()].filter((m) => m > 0).length;
  const goalDays = [...byDay.values()].filter((m) => m >= target).length;

  let bestStreak = 0;
  let run = 0;
  for (let i = 0; i < days; i += 1) {
    const d = addDays(from, i);
    if ((byDay.get(d) ?? 0) > 0) {
      run += 1;
      bestStreak = Math.max(bestStreak, run);
    } else {
      run = 0;
    }
  }

  return {
    daysStudied,
    windowDays: days,
    totalMinutes,
    avgMinutesPerActiveDay: daysStudied > 0 ? Math.round(totalMinutes / daysStudied) : 0,
    goalDays,
    bestStreak,
  };
}
