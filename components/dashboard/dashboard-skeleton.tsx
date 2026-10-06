import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Subheader skeleton */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-3.5 w-64" />
        </div>
        <Skeleton className="h-8 w-48 rounded-xl" />
      </div>

      {/* 4 Indicadores */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="mt-4 h-8 w-36" />
            <Skeleton className="mt-2 h-3 w-28" />
          </div>
        ))}
      </div>

      {/* Compromissos dos próximos meses */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-80" />
          </div>
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-16 w-full rounded-md" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Gráficos Linha 2 */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7 xl:col-span-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs h-[320px]">
          <div className="space-y-1 mb-4">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-[220px] w-full rounded-xl" />
        </div>
        <div className="lg:col-span-5 xl:col-span-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs h-[320px]">
          <div className="space-y-1 mb-4">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-[220px] w-full rounded-xl" />
        </div>
      </div>

      {/* Gráficos Linha 3 */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7 xl:col-span-7 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs h-[280px]">
          <div className="space-y-1 mb-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-[180px] w-full rounded-xl" />
        </div>
        <div className="lg:col-span-5 xl:col-span-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs h-[280px]">
          <div className="space-y-1 mb-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-[180px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
