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
      height={size * 0.75}
      viewBox="0 0 200 150"
      fill="none"
      className={className}
      style={style}
      aria-hidden
    >
      {/* tail, curling out from behind the body */}
      <path
        d="M152 120c24 5 36-6 34-21-2-14-17-17-24-9-5 7 1 14 8 12"
        stroke="currentColor"
        strokeWidth="11"
        strokeLinecap="round"
        fill="none"
        opacity=".6"
      />
      {/* body */}
      <path d="M44 122c-16 0-28-12-28-29 0-28 26-49 60-49s62 19 62 47c0 18-12 31-29 31z" fill="currentColor" />
      {/*
        Ears are drawn before the head so the head overlaps their base. They
        must also reach well above the head circle's top edge (y=58) — an
        earlier version tucked them at y=50 against a circle topping out at
        y=54, which left the silhouette reading as a featureless lump.
      */}
      <path d="M40 66 L34 30 L64 52 Z" fill="currentColor" />
      <path d="M84 66 L90 30 L60 52 Z" fill="currentColor" />
      {/* head */}
      <circle cx="62" cy="90" r="32" fill="currentColor" />
      {/* closed, sleeping eyes */}
      <path
        d="M46 88c3 3.6 8 3.6 11 0M67 88c3 3.6 8 3.6 11 0"
        stroke="var(--surface)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* nose */}
      <path d="M62 97l-3-2.6h6z" fill="var(--surface)" />
    </svg>
  );
}
