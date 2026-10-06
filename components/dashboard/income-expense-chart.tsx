"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { EmptyState } from "./empty-state";
import type { Transaction } from "@/lib/types";

interface IncomeExpenseChartProps {
  transactions: Transaction[];
  onNewTransaction: () => void;
  loading?: boolean;
}

export function IncomeExpenseChart({
  transactions,
  onNewTransaction,
}: IncomeExpenseChartProps) {
  const chartData = useMemo(() => {
    // Group transactions by month or day
    const valid = transactions.filter(
      (t) => t.type !== "transfer" && (t.status === "paid" || t.status === "received")
    );

    if (valid.length === 0) return [];

    const map = new Map<string, { label: string; income: number; expense: number }>();

    // Sort ascending by date
    const sorted = [...valid].sort((a, b) => a.transaction_date.localeCompare(b.transaction_date));

    for (const t of sorted) {
      const monthKey = t.transaction_date.slice(0, 7); // yyyy-MM
      const [year, month] = monthKey.split("-");
      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const label = `${monthNames[parseInt(month, 10) - 1]}/${year.slice(2)}`;

      const current = map.get(monthKey) || { label, income: 0, expense: 0 };
      const amt = Number(t.amount) || 0;

      if (t.type === "income") {
        current.income += amt;
      } else if (t.type === "expense") {
        current.expense += amt;
      }
      map.set(monthKey, current);
    }

    return Array.from(map.values());
  }, [transactions]);

  const hasData = chartData.length > 0 && chartData.some((d) => d.income > 0 || d.expense > 0);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Receitas x Despesas</h3>
          <p className="text-xs text-slate-400">Comparativo do fluxo financeiro</p>
        </div>
      </div>

      <div className="flex-1 min-h-[260px] flex items-center justify-center">
        {!hasData ? (
          <EmptyState
            icon={BarChart3}
            title="Ainda não há movimentações"
            description="Registre receitas e despesas para visualizar o comparativo do seu fluxo financeiro."
            actionLabel="Novo lançamento"
            onAction={onNewTransaction}
          />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickFormatter={(val) => `R$ ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const inc = payload.find((p) => p.dataKey === "income")?.value as number;
                    const exp = payload.find((p) => p.dataKey === "expense")?.value as number;
                    return (
                      <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-lg shadow-slate-900/5 text-xs">
                        <p className="font-semibold text-slate-700 uppercase">{label}</p>
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-500">Receitas:</span>
                            <span className="font-medium text-emerald-600">{formatCurrency(inc)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-500">Despesas:</span>
                            <span className="font-medium text-rose-600">{formatCurrency(exp)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="income" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="expense" name="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
