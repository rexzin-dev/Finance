"use client";

import React, { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieIcon } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { EmptyState } from "./empty-state";
import type { Transaction } from "@/lib/types";

interface CategoryExpensesChartProps {
  transactions: Transaction[];
  onNewTransaction: () => void;
}

const PALETTE = [
  "#2563eb", // azul
  "#0d9488", // teal
  "#e11d48", // rose
  "#ea580c", // laranja
  "#7c3aed", // violeta
  "#0891b2", // ciano
  "#ca8a04", // ambar
  "#475569", // slate
];

export function CategoryExpensesChart({
  transactions,
  onNewTransaction,
}: CategoryExpensesChartProps) {
  const { data, total } = useMemo(() => {
    const expenses = transactions.filter(
      (t) => t.type === "expense" && (t.status === "paid" || t.status === "received")
    );

    const map = new Map<string, number>();
    let sum = 0;

    for (const t of expenses) {
      const cat = t.category_name || "Sem categoria";
      const amt = Number(t.amount) || 0;
      map.set(cat, (map.get(cat) || 0) + amt);
      sum += amt;
    }

    const items = Array.from(map.entries())
      .map(([name, value], index) => ({
        name,
        value,
        percent: sum > 0 ? (value / sum) * 100 : 0,
        color: PALETTE[index % PALETTE.length],
      }))
      .sort((a, b) => b.value - a.value);

    return { data: items, total: sum };
  }, [transactions]);

  const hasData = data.length > 0 && total > 0;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Despesas por Categoria</h3>
          <p className="text-xs text-slate-400">Distribuição percentual do período</p>
        </div>
      </div>

      <div className="flex-1 min-h-[260px] flex items-center justify-center">
        {!hasData ? (
          <EmptyState
            icon={PieIcon}
            title="Nenhuma despesa registrada"
            description="Lançamentos de despesas neste período serão categorizados aqui automaticamente."
            actionLabel="Novo lançamento"
            onAction={onNewTransaction}
          />
        ) : (
          <div className="grid w-full items-center gap-4 sm:grid-cols-[160px_1fr]">
            <div className="relative mx-auto h-[160px] w-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-slate-100 bg-white p-2.5 shadow-lg text-xs">
                            <span className="font-semibold text-slate-700">{item.name}</span>
                            <div className="mt-1 flex gap-2">
                              <span>{formatCurrency(item.value)}</span>
                              <span className="text-slate-400">({formatPercent(item.percent)})</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Total</span>
                <span className="text-xs font-bold text-slate-800">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1">
              {data.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate text-slate-700 font-medium">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2 pl-2 shrink-0">
                    <span className="font-semibold text-slate-800">{formatCurrency(cat.value)}</span>
                    <span className="w-11 text-right text-slate-400 font-mono text-[11px]">
                      {formatPercent(cat.percent)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
