import React from "react";
import { LucideIcon } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricCardProps {
  title: string;
  value: number;
  icon?: LucideIcon;
  variant?: "default" | "income" | "expense" | "result";
  subtitle?: string;
  loading?: boolean;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  variant = "default",
  subtitle,
  loading,
}: MetricCardProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="mt-4 h-8 w-36" />
        {subtitle && <Skeleton className="mt-2 h-3 w-28" />}
      </div>
    );
  }

  const valueColors = {
    default: "text-slate-900",
    income: "text-emerald-600",
    expense: "text-rose-600",
    result: value >= 0 ? "text-emerald-600" : "text-rose-600",
  };

  const iconStyles = {
    default: "bg-slate-100 text-slate-600",
    income: "bg-emerald-50 text-emerald-600",
    expense: "bg-rose-50 text-rose-600",
    result: value >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-slate-500">{title}</span>
        {Icon && (
          <div className={cn("grid h-8 w-8 place-items-center rounded-lg", iconStyles[variant])}>
            <Icon size={16} />
          </div>
        )}
      </div>
      <div className="mt-3">
        <span className={cn("text-2xl font-bold tracking-tight sm:text-[26px]", valueColors[variant])}>
          {formatCurrency(value)}
        </span>
        {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}
