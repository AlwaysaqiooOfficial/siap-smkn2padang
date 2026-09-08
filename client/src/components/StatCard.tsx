import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string; // kelas tailwind untuk warna ikon, mis. "text-emerald-600 bg-emerald-50"
}

export function StatCard({ label, value, icon: Icon, color = "text-brand-600 bg-brand-50" }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-white p-4">
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-slate-400">{label}</p>
        <p className="text-lg font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}
