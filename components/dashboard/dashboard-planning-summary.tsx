"use client";

import React from "react";
import { Target, PiggyBank, CalendarDays, ArrowRight, CheckCircle2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { calculateReserveProgress, calculateGoalProgress } from "@/lib/planning-service";
import type { CategoryBudgetAnalysis } from "@/lib/planning-service";
import type { FutureReserve, FinancialGoal } from "@/lib/types";

interface DashboardPlanningSummaryProps {
  budgetAnalysis: CategoryBudgetAnalysis[];
  reserves: FutureReserve[];
  goals: FinancialGoal[];
  onNavigateToPlanning?: () => void;
}

export function DashboardPlanningSummary({
  budgetAnalysis,
  reserves,
  goals,
  onNavigateToPlanning,
}: DashboardPlanningSummaryProps) {
  const totalBudgeted = budgetAnalysis.reduce((acc, b) => acc + b.budgetAmount, 0);
  const totalRealized = budgetAnalysis.reduce((acc, b) => acc + b.realizedAmount, 0);
  const totalCommitted = budgetAnalysis.reduce((acc, b) => acc + b.committedAmount, 0);
  const totalConsumed = totalRealized + totalCommitted;
  const available = Math.max(0, totalBudgeted - totalConsumed);
  const budgetPercentage = totalBudgeted > 0 ? Math.min(100, Math.round((totalConsumed / totalBudgeted) * 100)) : 0;

  // Até 3 reservas mais relevantes
  const topReserves = reserves.slice(0, 3);
  // Até 2 metas
  const topGoals = goals.slice(0, 2);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* Bloco 1: Orçamento Consolidado do Mês (7 colunas) */}
      <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-blue-50 text-[#3157a8]">
                <Target size={15} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Orçamento do Mês</h3>
            </div>
            {onNavigateToPlanning && (
              <button
                type="button"
                onClick={onNavigateToPlanning}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#3157a8] hover:underline"
              >
                <span>Ver planejamento</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          {totalBudgeted === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              Nenhum limite orçamentário configurado para este mês.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-500 font-medium">Consumo planejado</span>
                <span className="font-mono font-bold text-slate-800">
                  {formatCurrency(totalConsumed)} de {formatCurrency(totalBudgeted)} ({budgetPercentage}%)
                </span>
              </div>

              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    budgetPercentage >= 100 ? "bg-rose-500" : budgetPercentage >= 80 ? "bg-amber-500" : "bg-[#3157a8]"
                  }`}
                  style={{ width: `${budgetPercentage}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400">Realizado (Pago)</span>
                  <p className="font-mono font-semibold text-slate-700">{formatCurrency(totalRealized)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Comprometido</span>
                  <p className="font-mono font-semibold text-amber-600">{formatCurrency(totalCommitted)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Ainda Disponível</span>
                  <p className="font-mono font-bold text-emerald-600">{formatCurrency(available)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bloco 2: Reservas Futuras e Metas Relevantes (5 colunas) */}
      <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                <PiggyBank size={15} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Reservas e Metas</h3>
            </div>
            {onNavigateToPlanning && (
              <button
                type="button"
                onClick={onNavigateToPlanning}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#3157a8] hover:underline"
              >
                <span>Ver todas</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          {topReserves.length === 0 && topGoals.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              Nenhuma reserva ou meta financeira cadastrada.
            </div>
          ) : (
            <div className="mt-3 divide-y divide-slate-100">
              {topReserves.map((r) => {
                const calc = calculateReserveProgress(r);
                return (
                  <div key={r.id} className="py-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-800">{r.name}</span>
                      <span className="font-mono text-slate-600 font-bold">
                        {formatCurrency(calc.currentAmount)} / {formatCurrency(calc.targetAmount)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#3157a8]"
                        style={{ width: `${Math.min(100, calc.percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {topGoals.map((g) => {
                const calc = calculateGoalProgress(g);
                return (
                  <div key={g.id} className="py-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-800">{g.name}</span>
                      <span className="font-mono text-slate-600 font-bold">
                        {formatCurrency(calc.currentAmount)} / {formatCurrency(calc.targetAmount)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${Math.min(100, calc.percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
