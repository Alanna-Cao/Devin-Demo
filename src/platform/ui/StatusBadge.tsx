const TONES = {
  neutral: { chip: "border-slate-300 bg-slate-50 text-slate-700", dot: "bg-slate-400" },
  info: { chip: "border-blue-200 bg-blue-50 text-blue-800", dot: "bg-blue-500" },
  warning: { chip: "border-amber-200 bg-amber-50 text-amber-800", dot: "bg-amber-500" },
  danger: { chip: "border-red-200 bg-red-50 text-red-800", dot: "bg-red-500" },
  success: { chip: "border-emerald-200 bg-emerald-50 text-emerald-800", dot: "bg-emerald-600" },
} as const;

export type Tone = keyof typeof TONES;

export function StatusBadge({
  label,
  tone = "neutral",
  dot = true,
}: {
  label: string;
  tone?: Tone;
  dot?: boolean;
}) {
  const { chip, dot: dotClass } = TONES[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${chip}`}
    >
      {dot ? <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${dotClass}`} /> : null}
      {label}
    </span>
  );
}
