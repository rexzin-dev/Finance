"use client";

import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { formatCurrency, formatShortDate } from "@/lib/formatters";
import { EmptyState } from "./empty-state";
import type { Transaction } from "@/lib/types";

interface BalanceEvolutionChartProps {
  transactions: Transaction[];
  initialBalance: number;
  onNewTransaction: () => void;
  loading?: boolean;
}

export function BalanceEvolutionChart({
  transactions,
  initialBalance,
  onNewTransaction,
}: BalanceEvolutionChartProps) {
  const chartData = useMemo(() => {
    const valid = transactions
      .filter((t) => t.status === "paid" || t.status === "received")
      .sort((a, b) => a.transaction_date.localeCompare(b.transaction_date));

    if (valid.length === 0) return [];

    let currentBalance = initialBalance;
    const points: { date: string; label: string; balance: number }[] = [];

    for (const t of valid) {
      const amt = Number(t.amount) || 0;
      if (t.type === "income") currentBalance += amt;
      else if (t.type === "expense") currentBalance -= amt;

      points.push({
        date: t.transaction_date,
        label: formatShortDate(t.transaction_date),
        balance: currentBalance,
      });
    }

    return points;
  }, [transactions, initialBalance]);

  const hasData = chartData.length > 0;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Evolução do Saldo</h3>
          <p className="text-xs text-slate-400">Trajetória patrimonial ao longo do tempo</p>
        </div>
      </div>

      <div className="flex-1 min-h-[260px] flex items-center justify-center">
        {!hasData ? (
          <EmptyState
            icon={TrendingUp}
            title="Ainda não há dados suficientes"
            description="Conforme você registrar movimentações, a curva histórica do seu saldo será apresentada aqui."
            actionLabel="Novo lançamento"
            onAction={onNewTransaction}
          />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3157a8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3157a8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
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
                    const val = payload[0].value as number;
                    return (
                      <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-lg shadow-slate-900/5 text-xs">
                        <p className="font-semibold text-slate-700">{label}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-slate-500">Saldo acumulado:</span>
                          <span className="font-semibold text-[#3157a8]">{formatCurrency(val)}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="balance"
                name="Saldo"
                stroke="#3157a8"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#balanceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
