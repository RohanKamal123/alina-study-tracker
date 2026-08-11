/**
 * The 0-5 understanding scale used across the syllabus.
 *
 * The wording matters more than the number: "can solve everything" is a
 * question she can answer honestly about a chapter, where an abstract
 * "confidence: 4/5" is not. Every label below is hers.
 */
export interface LevelMeta {
  value: number;
  /** Short label for chips and legends. */
  short: string;
  /** The full statement she is agreeing with. */
  label: string;
  color: string;
}

export const LEVELS: LevelMeta[] = [
  {
    value: 0,
    short: "Not started",
    label: "Never started this chapter",
    color: "var(--muted)",
  },
  {
    value: 1,
    short: "Skimmed",
    label: "Just know what is in the chapter",
    color: "#b45309",
  },
  {
    value: 2,
    short: "Some parts",
    label: "Know some parts of it",
    color: "#d97706",
  },
  {
    value: 3,
    short: "Needs revision",
    label: "Knew it, but needs a revision",
    color: "#ca8a04",
  },
  {
    value: 4,
    short: "Mostly solid",
    label: "Can solve 70–80% of CQ, MCQ and SQ",
    color: "#65a30d",
  },
  {
    value: 5,
    short: "Exam ready",
    label: "Can solve everything",
    color: "#15803d",
  },
];

export const MAX_LEVEL = 5;

export function levelMeta(level: number): LevelMeta {
  const clamped = Math.max(0, Math.min(MAX_LEVEL, Math.round(level || 0)));
  return LEVELS[clamped];
}

/**
 * A chapter at level 5 counts as fully done; anything below is partial credit.
 * This is what every "completion" figure in the app is built from.
 */
export function levelPercent(level: number): number {
  return (Math.max(0, Math.min(MAX_LEVEL, level || 0)) / MAX_LEVEL) * 100;
}
