"use client";

import React, { useState, useMemo } from "react";
import {
  CalendarDays,
  CreditCard,
  Repeat,
  HandCoins,
  Receipt,
  ChevronRight,
  ChevronLeft,
  X,
  Filter,
} from "lucide-react";
import { useFinance } from "@/lib/finance-context";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";
import type { MonthlyCommitmentSummary } from "@/lib/types";

export function ForecastView({ onNewTransaction }: { onNewTransaction: () => void }) {
  const { monthlyCommitments } = useFinance();
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState<"all" | "credit_card" | "fixed" | "loan" | "pending_bill">("all");

  const currentMonth = monthlyCommitments[selectedMonthIndex] || monthlyCommitments[0];

  const filteredItems = useMemo(() => {
    if (!currentMonth) return [];
    if (activeFilter === "all") return currentMonth.items;
    return currentMonth.items.filter((item) => item.type === activeFilter);
  }, [currentMonth, activeFilter]);

  if (!currentMonth) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-8">
        <EmptyState
          icon={CalendarDays}
          title="Nenhum compromisso futuro registrado"
          description="A previsão mensal é formada exclusivamente por compras parceladas no cartão, empréstimos e contas pendentes cadastradas."
          actionLabel="Novo lançamento"
          onAction={onNewTransaction}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Topo */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-800">
          Planejamento & Previsão Mensal
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Consulte com exatidão o valor total comprometido para pagar mês a mês.
        </p>
      </div>

      {/* Régua de Navegação dos Meses */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {monthlyCommitments.map((m, idx) => {
          const isSelected = idx === selectedMonthIndex;
          return (
            <button
              key={m.monthKey}
              onClick={() => setSelectedMonthIndex(idx)}
              className={`flex shrink-0 flex-col rounded-xl border px-4 py-3 text-left transition-all ${
                isSelected
                  ? "border-[#3157a8] bg-[#edf2ff] ring-1 ring-[#3157a8]"
                  : "border-slate-200/80 bg-white hover:bg-slate-50"
              }`}
            >
              <span
                className={`text-xs font-bold font-mono uppercase ${
                  isSelected ? "text-[#3157a8]" : "text-slate-600"
                }`}
              >
                {m.monthLabel}
              </span>
              <span className="mt-1 text-sm font-bold font-mono text-slate-900">
                {formatCurrency(m.totalCommitted)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cards de Resumo da Composição do Mês Selecionado */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <CreditCard size={15} />
            <span>Faturas de Cartão</span>
          </div>
          <p className="mt-2 text-lg font-bold font-mono text-slate-800">
            {formatCurrency(currentMonth.creditCardTotal)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <HandCoins size={15} />
            <span>Empréstimos</span>
          </div>
          <p className="mt-2 text-lg font-bold font-mono text-slate-800">
            {formatCurrency(currentMonth.loanTotal)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Repeat size={15} />
            <span>Contas Fixas / Recorrentes</span>
          </div>
          <p className="mt-2 text-lg font-bold font-mono text-slate-800">
            {formatCurrency(currentMonth.fixedTotal)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Receipt size={15} />
            <span>Outras Contas Pendentes</span>
          </div>
          <p className="mt-2 text-lg font-bold font-mono text-slate-800">
            {formatCurrency(currentMonth.otherPendingTotal)}
          </p>
        </div>
      </div>

      {/* Detalhamento das Obrigações */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Obrigações de {currentMonth.monthLabel}
            </h3>
            <p className="text-xs text-slate-400">
              Total consolidado:{" "}
              <strong className="text-slate-800 font-mono">
                {formatCurrency(currentMonth.totalCommitted)}
              </strong>
            </p>
          </div>

          {/* Filtro de Tipo */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => setActiveFilter("all")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                activeFilter === "all" ? "bg-[#3157a8] text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setActiveFilter("credit_card")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                activeFilter === "credit_card"
                  ? "bg-[#3157a8] text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              Cartões
            </button>
            <button
              onClick={() => setActiveFilter("loan")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                activeFilter === "loan" ? "bg-[#3157a8] text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              Empréstimos
            </button>
            <button
              onClick={() => setActiveFilter("fixed")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                activeFilter === "fixed" ? "bg-[#3157a8] text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              Fixas
            </button>
            <button
              onClick={() => setActiveFilter("pending_bill")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                activeFilter === "pending_bill"
                  ? "bg-[#3157a8] text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              Outras
            </button>
          </div>
        </div>

        {/* Tabela / Lista de Itens */}
        <div className="divide-y divide-slate-100">
          {filteredItems.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">
              Nenhuma obrigação encontrada para esta categoria neste mês.
            </p>
          ) : (
            filteredItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100 text-slate-600">
                    {item.type === "credit_card" && <CreditCard size={15} />}
                    {item.type === "fixed" && <Repeat size={15} />}
                    {item.type === "loan" && <HandCoins size={15} />}
                    {item.type === "pending_bill" && <Receipt size={15} />}
                  </div>
                  <div>
                    <h5 className="font-semibold text-slate-800">{item.title}</h5>
                    <p className="text-[11px] text-slate-400">
                      {item.detail} • Vencimento: {formatDate(item.dueDate)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  {item.isVariable ? (
                    <span className="text-[11px] font-medium text-amber-600">A confirmar</span>
                  ) : (
                    <span className="font-bold font-mono text-slate-800">
                      {formatCurrency(item.amount)}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
