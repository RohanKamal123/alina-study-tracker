"use client";

/**
 * The app's mascot. Drawn rather than emoji so it inherits the theme colours
 * and stays crisp at any size.
 */
export function CatFace({
  size = 32,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      aria-hidden
    >
      {/* ears */}
      <path d="M9 18V7.5l10 6.2z" fill="currentColor" />
      <path d="M39 18V7.5l-10 6.2z" fill="currentColor" />
      <path d="M11.6 15.6V11l4.6 2.9z" fill="var(--accent-soft)" opacity=".75" />
      <path d="M36.4 15.6V11l-4.6 2.9z" fill="var(--accent-soft)" opacity=".75" />
      {/* head */}
      <path
        d="M24 12c9 0 15 5.9 15 14.3C39 34.9 32.6 41 24 41S9 34.9 9 26.3C9 17.9 15 12 24 12"
        fill="currentColor"
      />
      {/* eyes */}
      <ellipse cx="17.6" cy="25.4" rx="2.5" ry="3.1" fill="var(--surface)" />
      <ellipse cx="30.4" cy="25.4" rx="2.5" ry="3.1" fill="var(--surface)" />
      <ellipse cx="17.6" cy="25.8" rx="1.15" ry="1.9" fill="var(--text)" />
      <ellipse cx="30.4" cy="25.8" rx="1.15" ry="1.9" fill="var(--text)" />
      {/* nose + mouth */}
      <path d="M24 30.2l-2 -1.6h4z" fill="var(--surface)" />
      <path
        d="M24 30.6v1.7M24 32.3c0 1.2-1.3 1.9-2.5 1.5M24 32.3c0 1.2 1.3 1.9 2.5 1.5"
        stroke="var(--surface)"
        strokeWidth="1.15"
        strokeLinecap="round"
        fill="none"
        opacity=".9"
      />
      {/* whiskers */}
      <path
        d="M13.5 28.5H7M13.8 31.4l-6 1.8M34.5 28.5H41M34.2 31.4l6 1.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A single paw print — used to mark empty states and the streak flame's cousin. */
export function Paw({
  size = 24,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      style={style}
      aria-hidden
    >
      <ellipse cx="16" cy="21.5" rx="7" ry="5.8" fill="currentColor" />
      <ellipse cx="7.6" cy="14.2" rx="3.2" ry="4.1" fill="currentColor" transform="rotate(-18 7.6 14.2)" />
      <ellipse cx="13.2" cy="9.4" rx="3.1" ry="4.2" fill="currentColor" transform="rotate(-6 13.2 9.4)" />
      <ellipse cx="19.4" cy="9.4" rx="3.1" ry="4.2" fill="currentColor" transform="rotate(6 19.4 9.4)" />
      <ellipse cx="24.6" cy="14.2" rx="3.2" ry="4.1" fill="currentColor" transform="rotate(18 24.6 14.2)" />
    </svg>
  );
}

/**
 * A cat curled up asleep. Sits in the dashboard hero as the one piece of pure
 * decoration in the app.
 */
export function SleepingCat({
  size = 132,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size * 0.72}
      viewBox="0 0 200 144"
      fill="none"
      className={className}
      style={style}
      aria-hidden
    >
      {/* tail curling around the body */}
      <path
        d="M150 116c22 4 34-6 32-20-2-13-16-16-22-8-5 7 1 13 7 11"
        stroke="currentColor"
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
        opacity=".55"
      />
      {/* body */}
      <path
        d="M40 116c-14 0-24-11-24-26 0-26 24-46 56-46s58 18 58 44c0 17-11 28-27 28z"
        fill="currentColor"
      />
      {/* head tucked in */}
      <circle cx="52" cy="84" r="30" fill="currentColor" />
      <path d="M28 68V50l16 10z" fill="currentColor" />
      <path d="M76 68V50L60 60z" fill="currentColor" />
      {/* closed eyes */}
      <path
        d="M38 82c2.5 3 6.5 3 9 0M57 82c2.5 3 6.5 3 9 0"
        stroke="var(--surface)"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
      {/* nose */}
      <path d="M52 90l-2.6-2.2h5.2z" fill="var(--surface)" opacity=".95" />
      {/* stripes */}
      <path
        d="M104 62c6 5 8 12 7 20M120 70c5 6 6 13 4 21"
        stroke="var(--surface)"
        strokeWidth="4"
        strokeLinecap="round"
        opacity=".35"
        fill="none"
      />
    </svg>
  );
}
