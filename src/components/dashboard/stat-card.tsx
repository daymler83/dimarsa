import type { LucideIcon } from "lucide-react";

const ACCENT_STYLES = {
  gold: "bg-gold text-navy",
  success: "bg-success/15 text-success",
  navy: "bg-navy text-white",
  sky: "bg-sky-100 text-sky-700",
} as const;

type StatCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  accent?: keyof typeof ACCENT_STYLES;
};

export function StatCard({ label, value, icon: Icon, hint, accent = "navy" }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/95 p-5 shadow-brand">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-full ${ACCENT_STYLES[accent]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-navy">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
