"use client";

import React, { useMemo } from "react";
import { CalendarClock, AlertCircle, Clock } from "lucide-react";
import { formatCurrency, formatShortDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

interface UpcomingBillsProps {
  transactions: Transaction[];
  onSelectTransaction?: (tx: Transaction) => void;
}

export function UpcomingBills({ transactions, onSelectTransaction }: UpcomingBillsProps) {
  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);

    const pending = transactions.filter(
      (t) => (t.status === "pending" || t.status === "to_receive") && t.due_date
    );

    return pending
      .map((t) => {
        const dueDate = t.due_date!.slice(0, 10);
        let badge: { label: string; style: string } = {
          label: "Próximo",
          style: "bg-slate-100 text-slate-700",
        };

        if (dueDate < today) {
          badge = { label: "Atrasado", style: "bg-rose-50 text-rose-600 border border-rose-200" };
        } else if (dueDate === today) {
          badge = { label: "Hoje", style: "bg-amber-50 text-amber-700 border border-amber-200" };
        }

        return { ...t, badge, dueDate };
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5);
  }, [transactions]);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Próximos Vencimentos</h3>
          <p className="text-xs text-slate-400">Contas e receitas pendentes</p>
        </div>
      </div>

      <div className="flex-1 min-h-[220px] flex items-center justify-center">
        {upcoming.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-400">
              <CalendarClock size={20} />
            </div>
            <p className="mt-2.5 text-xs text-slate-500 font-medium">
              Nenhuma conta pendente para os próximos dias.
            </p>
          </div>
        ) : (
          <div className="w-full space-y-2.5">
            {upcoming.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectTransaction?.(item)}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 p-2.5 transition-colors hover:bg-slate-50/80"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center justify-center rounded-lg bg-slate-100 px-2 py-1 text-center font-mono">
                    <span className="text-[10px] font-bold text-slate-700">
                      {formatShortDate(item.dueDate)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 truncate max-w-[140px] sm:max-w-[180px]">
                      {item.description}
                    </p>
                    <span className="text-[11px] text-slate-400">
                      {item.category_name || item.account_name || "Geral"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      item.type === "expense" ? "text-slate-800" : "text-emerald-600"
                    )}
                  >
                    {formatCurrency(item.amount)}
                  </span>
                  <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold", item.badge.style)}>
                    {item.badge.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
