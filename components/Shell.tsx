"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  Cloud,
  CloudOff,
  GraduationCap,
  Home,
  ListChecks,
  Loader2,
  CalendarClock,
  MoreHorizontal,
  Target,
  Settings as SettingsIcon,
  Timer,
  Users,
  Wallet,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { daysToExam } from "@/lib/selectors";
import { CatFace } from "@/components/Cat";

const NAV = [
  { href: "/", label: "Today", icon: Home },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/teachers", label: "Teachers", icon: Users },
  { href: "/schedule", label: "Schedule", icon: ClipboardList },
  { href: "/plan", label: "Class plan", icon: CalendarClock },
  { href: "/syllabus", label: "Syllabus", icon: BookOpen },
  { href: "/homework", label: "Homework", icon: ListChecks },
  { href: "/exams", label: "Exams", icon: GraduationCap },
  { href: "/study", label: "Study timer", icon: Timer },
  { href: "/routines", label: "Routine & goals", icon: Target },
  { href: "/fees", label: "Fees", icon: Wallet },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

/** The five that fit a phone's bottom bar. */
const MOBILE_NAV = [NAV[0], NAV[1], NAV[5], NAV[6], NAV[8]];

function SyncBadge() {
  const { syncStatus, cloudConfigured } = useStore();
  if (!cloudConfigured) return null;

  if (syncStatus.kind === "syncing") {
    return (
      <span className="chip" title="Syncing">
        <Loader2 size={12} className="animate-spin" /> Syncing
      </span>
    );
  }
  if (syncStatus.kind === "error") {
    return (
      <span className="chip" style={{ color: "var(--bad)" }} title={syncStatus.message}>
        <CloudOff size={12} /> Sync failed
      </span>
    );
  }
  if (syncStatus.kind === "idle") {
    return (
      <span className="chip" style={{ color: "var(--good)" }} title="Saved to the cloud">
        <Cloud size={12} /> Synced
      </span>
    );
  }
  return (
    <span className="chip" title="Saved in this browser only">
      <CloudOff size={12} /> Local
    </span>
  );
}

function ThemeSync() {
  const { state } = useStore();
  const theme = state.settings.theme;

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
  }, [theme]);

  return null;
}

function Logo({ compact = false }: { compact?: boolean }) {
  const { state } = useStore();
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span
        className="flex shrink-0 items-center justify-center rounded-2xl"
        style={{
          background: "var(--accent)",
          color: "var(--ink-on-accent)",
          width: compact ? 36 : 42,
          height: compact ? 36 : 42,
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <CatFace size={compact ? 24 : 28} />
      </span>
      {compact ? null : (
        <span className="leading-tight">
          <span className="display block text-[15px] font-bold">
            {state.settings.studentName || "Study"}&apos;s desk
          </span>
          <span className="muted block text-[11px] font-semibold">SSC candidate</span>
        </span>
      )}
    </Link>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, ready } = useStore();
  const left = daysToExam(state);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <div className="min-h-screen">
      <ThemeSync />

      {/* ---------- Desktop sidebar ---------- */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col px-4 py-5 lg:flex">
        <div className="px-1">
          <Logo />
        </div>

        <div
          className="mt-5 rounded-2xl px-4 py-3.5"
          style={{
            background: "var(--accent-soft)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="eyebrow" style={{ color: "var(--accent-strong)" }}>
            SSC exam
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="numeral text-3xl" style={{ color: "var(--accent-strong)" }}>
              {left > 0 ? left : left === 0 ? "0" : "—"}
            </span>
            <span className="text-xs font-bold" style={{ color: "var(--accent-strong)" }}>
              {left > 0 ? "days to go" : left === 0 ? "today!" : "done"}
            </span>
          </div>
        </div>

        <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto pr-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all"
                style={
                  active
                    ? {
                        background: "var(--accent)",
                        color: "var(--ink-on-accent)",
                        boxShadow: "var(--shadow-sm)",
                      }
                    : { color: "var(--text-soft)" }
                }
              >
                <Icon size={17} strokeWidth={active ? 2.5 : 2} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="pt-3">
          <SyncBadge />
        </div>
      </aside>

      {/* ---------- Mobile top bar ---------- */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between gap-2 px-4 py-3 lg:hidden"
        style={{
          background: "color-mix(in srgb, var(--bg) 88%, transparent)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <Logo compact />
          <span className="leading-tight">
            <span className="numeral block text-lg" style={{ color: "var(--accent-strong)" }}>
              {left > 0 ? left : left === 0 ? "0" : "—"}
            </span>
            <span className="muted block text-[10px] font-bold">
              {left > 0 ? "days to SSC" : left === 0 ? "exam day" : "exams done"}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <SyncBadge />
          <Link href="/settings" className="btn btn-ghost !px-2.5 !py-2" aria-label="Settings">
            <SettingsIcon size={16} />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 lg:pb-12 lg:pl-72 lg:pt-8">
        {ready ? children : <div className="muted py-24 text-center text-sm">Loading…</div>}
      </main>

      {/* ---------- Mobile bottom nav ---------- */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 px-1 pb-[env(safe-area-inset-bottom)] pt-1 lg:hidden"
        style={{
          background: "color-mix(in srgb, var(--surface) 92%, transparent)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: "0 -1px 0 color-mix(in srgb, var(--border) 70%, transparent), var(--shadow-md)",
        }}
      >
        {[...MOBILE_NAV, { href: "/more", label: "More", icon: MoreHorizontal }].map(
          ({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-bold transition-colors"
                style={{ color: active ? "var(--accent)" : "var(--muted)" }}
              >
                <span
                  className="flex h-7 w-11 items-center justify-center rounded-full transition-all"
                  style={active ? { background: "var(--accent-soft)" } : undefined}
                >
                  <Icon size={18} strokeWidth={active ? 2.6 : 2} />
                </span>
                <span className="truncate px-0.5">{label}</span>
              </Link>
            );
          },
        )}
      </nav>
    </div>
  );
}

export { NAV };
