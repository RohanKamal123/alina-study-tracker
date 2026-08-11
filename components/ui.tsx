"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Paw } from "@/components/Cat";

export function Card({
  children,
  className = "",
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card p-4 sm:p-5 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold sm:text-[30px]">{title}</h1>
        {subtitle ? (
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--text-soft)" }}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Empty({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="dashed px-6 py-10 text-center">
      <Paw size={34} className="mx-auto mb-3" style={{ color: "var(--accent)", opacity: 0.35 }} />
      <p className="display text-base font-bold">{title}</p>
      {hint ? (
        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          {hint}
        </p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      style={{ background: "color-mix(in srgb, #2a1a0e 62%, transparent)" }}
      onMouseDown={(e) => {
        if (!panel.current?.contains(e.target as Node)) onClose();
      }}
    >
      <div
        ref={panel}
        className={`card card-raised max-h-[92vh] w-full overflow-y-auto !rounded-b-none sm:!rounded-3xl ${
          wide ? "sm:max-w-3xl" : "sm:max-w-lg"
        }`}
        style={{ boxShadow: "var(--shadow-lg)" }}
      >
        <div
          className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-3.5"
          style={{
            background: "var(--surface)",
            borderBottom: "1.5px solid color-mix(in srgb, var(--border) 70%, transparent)",
          }}
        >
          <h2 className="text-lg font-bold">{title}</h2>
          <button className="btn btn-ghost !px-2 !py-1.5" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
  group = false,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  /**
   * Set for anything that is not a single form control — a row of chip
   * buttons, a checkbox list. A <button> inside a <label> takes the label's
   * text as its accessible name, so without this every day chip would
   * announce as "Day" instead of "Sat", "Sun"…
   */
  group?: boolean;
}) {
  const body = (
    <>
      <span className="label">{label}</span>
      {children}
      {hint ? (
        <span className="mt-1 block text-xs" style={{ color: "var(--muted)" }}>
          {hint}
        </span>
      ) : null}
    </>
  );

  if (group) {
    return (
      <div className="block" role="group" aria-label={label}>
        {body}
      </div>
    );
  }

  return <label className="block">{body}</label>;
}

export function Progress({
  value,
  color,
  height = 9,
}: {
  value: number;
  color?: string;
  height?: number;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className="w-full overflow-hidden rounded-full"
      style={{ background: "var(--surface-3)", height }}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color ?? "var(--accent)" }}
      />
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone = "default",
  icon,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "default" | "good" | "warn" | "bad";
  icon?: React.ReactNode;
}) {
  const toneColor =
    tone === "good"
      ? "var(--good)"
      : tone === "warn"
        ? "var(--warn)"
        : tone === "bad"
          ? "var(--bad)"
          : "var(--text)";
  const toneBg =
    tone === "good"
      ? "var(--good-soft)"
      : tone === "warn"
        ? "var(--warn-soft)"
        : tone === "bad"
          ? "var(--bad-soft)"
          : "var(--surface-2)";

  return (
    <div className="card p-3.5 sm:p-4">
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ background: toneBg, color: toneColor }}
        >
          {icon}
        </span>
        <span className="eyebrow truncate">{label}</span>
      </div>
      <div className="numeral mt-2.5 text-[26px] sm:text-3xl" style={{ color: toneColor }}>
        {value}
      </div>
      {sub ? (
        <div className="mt-1 text-xs font-medium" style={{ color: "var(--muted)" }}>
          {sub}
        </div>
      ) : null}
    </div>
  );
}

export function Dot({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ background: color }}
      aria-hidden
    />
  );
}

export function ConfirmButton({
  onConfirm,
  children,
  className = "btn btn-danger",
  confirmLabel = "Sure?",
}: {
  onConfirm: () => void;
  children: React.ReactNode;
  className?: string;
  confirmLabel?: string;
}) {
  const [armed, setArmed] = React.useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3500);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (armed) {
          onConfirm();
          setArmed(false);
        } else {
          setArmed(true);
        }
      }}
    >
      {armed ? confirmLabel : children}
    </button>
  );
}
