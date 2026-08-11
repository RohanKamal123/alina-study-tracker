export type ID = string;

/** Offline = she goes to them / they come home. Online = Zoom, Meet, etc. */
export type Mode = "OFFLINE" | "ONLINE";

/** A private tutor vs. a coaching centre / batch. */
export type TeacherKind = "TUTOR" | "COACHING";

/**
 * How well she knows a chapter, 0-5. This is the single axis the syllabus is
 * tracked on - it replaced a separate status enum plus a confidence score,
 * which asked the same question twice.
 */
export type Level = 0 | 1 | 2 | 3 | 4 | 5;

export type ClassStatus = "HELD" | "CANCELLED" | "MISSED" | "RESCHEDULED";

export type PlanKind = "PLAN" | "REVISION" | "EXAM" | "OTHER";

export type ExamKind = "SSC" | "MODEL" | "SCHOOL" | "COACHING" | "OTHER";

export type GoalKind = "WEEKLY" | "MONTHLY" | "EXAM";

export interface Subject {
  id: ID;
  name: string;
  /** Bangla name, shown as a subtitle where there is room. */
  nameBn?: string;
  /** Tailwind-independent hex, used for calendar dots and chart series. */
  color: string;
  /** Full marks in the SSC exam, used by the score tracker's default. */
  fullMarks?: number;
  archived?: boolean;
}

/**
 * A tutor or coaching centre. Her line-up changes almost every month, so a
 * teacher is never deleted once she has logged classes against them - it is
 * closed out with `endedOn` and drops off the active lists while its history
 * stays intact.
 */
export interface Teacher {
  id: ID;
  name: string;
  kind: TeacherKind;
  mode: Mode;
  subjectIds: ID[];
  contact?: string;
  /** Monthly fee in BDT. */
  fee?: number;
  /** Day of month the fee is usually due (1-31). */
  feeDueDay?: number;
  /** ISO date (YYYY-MM-DD) she started with them. */
  startedOn: string;
  /** ISO date she stopped. Null/undefined = still ongoing. */
  endedOn?: string | null;
  note?: string;
}

/** A recurring weekly class slot. */
export interface ClassSlot {
  id: ID;
  teacherId: ID;
  subjectIds: ID[];
  /** 0 = Sunday ... 6 = Saturday (the week starts on Saturday in Bangladesh, see WEEK_ORDER). */
  weekday: number;
  /** "HH:MM" 24h. */
  start: string;
  end: string;
  mode?: Mode;
  location?: string;
  /** Slots also churn month to month; inactive slots stay for history. */
  active: boolean;
}

/** What actually happened in one class on one date. */
export interface SessionLog {
  id: ID;
  /** YYYY-MM-DD */
  date: string;
  slotId?: ID | null;
  teacherId: ID;
  subjectId?: ID | null;
  status: ClassStatus;
  /** What was meant to be covered. */
  planned?: string;
  /** What was actually covered - the "correct it over time" half. */
  covered?: string;
  homework?: string;
  /** Chapters touched in this class, so syllabus progress links back to classes. */
  chapterIds?: ID[];
  /** 1-5, how well she followed the class. */
  understanding?: number;
  notes?: string;
}

/** A self-study / revision item placed on a calendar day. */
export interface PlanEntry {
  id: ID;
  date: string;
  subjectId?: ID | null;
  title: string;
  detail?: string;
  kind: PlanKind;
  done: boolean;
}

export interface Chapter {
  id: ID;
  subjectId: ID;
  number: number;
  name: string;
  nameBn?: string;
  /** 0-5, see LEVELS in lib/levels.ts for what each step means. */
  level: number;
  updatedAt?: string;
}

export interface Homework {
  id: ID;
  title: string;
  subjectId?: ID | null;
  teacherId?: ID | null;
  detail?: string;
  dueDate?: string;
  priority: "LOW" | "NORMAL" | "HIGH";
  done: boolean;
  doneAt?: string;
}

/** One paper inside an exam routine. */
export interface ExamPaper {
  id: ID;
  subjectId: ID | null;
  /** YYYY-MM-DD */
  date: string;
  /** "HH:MM" start time, optional. */
  time?: string;
  note?: string;
}

/**
 * An upcoming exam and its routine. The SSC exam itself is tracked here too,
 * so the countdown and the paper-by-paper routine live in one place.
 */
export interface ExamEvent {
  id: ID;
  name: string;
  kind: ExamKind;
  /** First day of the exam. */
  startDate: string;
  note?: string;
  papers: ExamPaper[];
}

/**
 * One recorded change to a chapter's understanding level.
 *
 * A chapter only stores its *current* level, so without this there is no way
 * to answer "is she actually moving?" - the single most useful question for
 * predicting whether the syllabus gets finished in time.
 */
export interface LevelEvent {
  id: ID;
  chapterId: ID;
  subjectId: ID;
  /** Level after the change. */
  level: number;
  /** Level before it, so gains and slips are both visible. */
  previous: number;
  /** ISO timestamp. */
  at: string;
}

/**
 * What a teacher intends to cover in a given month. Filled in from what they
 * tell her, then ticked off as it actually happens.
 */
export interface CoveragePlan {
  id: ID;
  teacherId: ID;
  subjectId: ID | null;
  /** YYYY-MM */
  month: string;
  /** The topic, in her own words or theirs. */
  title: string;
  chapterIds?: ID[];
  done: boolean;
}

/** One tracked stretch of self-study. */
export interface StudySession {
  id: ID;
  /** YYYY-MM-DD of the day it is credited to. */
  date: string;
  subjectId?: ID | null;
  minutes: number;
  startedAt?: string;
  note?: string;
}

export interface FeePayment {
  id: ID;
  teacherId: ID;
  /** YYYY-MM */
  month: string;
  amount: number;
  paid: boolean;
  paidOn?: string;
  note?: string;
}

/** A repeating daily habit, e.g. "Fajr + 30 min revision". */
export interface RoutineItem {
  id: ID;
  title: string;
  /** "HH:MM", optional. */
  time?: string;
  /** Weekdays it applies to; empty = every day. */
  weekdays: number[];
  active: boolean;
}

export interface Goal {
  id: ID;
  title: string;
  detail?: string;
  kind: GoalKind;
  /** Optional numeric target, e.g. 20 (chapters) or 35 (hours). */
  target?: number;
  progress?: number;
  unit?: string;
  dueDate?: string;
  done: boolean;
}

export interface Settings {
  studentName: string;
  /** ISO date of the first SSC exam. */
  examDate: string;
  /** Minutes of self-study she is aiming for each day. */
  dailyStudyMinutesTarget: number;
  /** Sync row id (a UUID). Null until she turns cloud sync on. */
  syncCode: string | null;
  theme: "system" | "light" | "dark";
}

export interface AppState {
  version: number;
  /** ISO timestamp of the last local mutation - drives sync conflict resolution. */
  updatedAt: string;
  settings: Settings;
  subjects: Subject[];
  teachers: Teacher[];
  slots: ClassSlot[];
  sessionLogs: SessionLog[];
  plans: PlanEntry[];
  chapters: Chapter[];
  homework: Homework[];
  exams: ExamEvent[];
  coverage: CoveragePlan[];
  levelHistory: LevelEvent[];
  studySessions: StudySession[];
  fees: FeePayment[];
  routines: RoutineItem[];
  /** date (YYYY-MM-DD) -> routine ids ticked off that day. */
  routineChecks: Record<string, ID[]>;
  goals: Goal[];
}

/** Collections that are plain arrays of `{ id }` records - used by the generic CRUD helpers. */
export type CollectionKey =
  | "subjects"
  | "teachers"
  | "slots"
  | "sessionLogs"
  | "plans"
  | "chapters"
  | "homework"
  | "exams"
  | "coverage"
  | "levelHistory"
  | "studySessions"
  | "fees"
  | "routines"
  | "goals";
