"use client";

import React, { useState } from "react";
import {
  CalendarDays,
  CreditCard,
  Repeat,
  HandCoins,
  Receipt,
  ChevronRight,
  X,
  AlertCircle,
} from "lucide-react";
import { useFinance } from "@/lib/finance-context";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { EmptyState } from "./empty-state";
import type { MonthlyCommitmentSummary, MonthlyCommitmentItem } from "@/lib/types";

interface CommitmentsForecastProps {
  onNewTransaction: () => void;
}

export function CommitmentsForecast({ onNewTransaction }: CommitmentsForecastProps) {
  const { monthlyCommitments } = useFinance();
  const [selectedMonth, setSelectedMonth] = useState<MonthlyCommitmentSummary | null>(null);

  // Considerar os 6 meses calculados
  const hasAnyCommitment = monthlyCommitments.some((m) => m.totalCommitted > 0);
  const maxCommitment = Math.max(1, ...monthlyCommitments.map((m) => m.totalCommitted));

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-5">
        <div>
          <h3 className="text-sm font-bold text-slate-800">
            Compromissos dos Próximos Meses
          </h3>
          <p className="text-xs text-slate-400">
            Previsão real de obrigações registradas (faturas de cartão, parcelas, contas pendentes e empréstimos)
          </p>
        </div>
        <span className="text-[11px] font-semibold text-[#3157a8]">
          Previsão de 6 meses
        </span>
      </div>

      {!hasAnyCommitment ? (
        <EmptyState
          icon={CalendarDays}
          title="Nenhum compromisso futuro cadastrado"
          description="Quando você registrar compras parceladas no cartão, empréstimos ou contas a vencer, elas formarão a previsão financeira aqui."
          actionLabel="Novo lançamento"
          onAction={onNewTransaction}
        />
      ) : (
        <div className="space-y-6">
          {/* Gráfico de Barras Elegante dos Meses */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {monthlyCommitments.map((m) => {
              const heightPercent = Math.max(12, Math.round((m.totalCommitted / maxCommitment) * 100));
              const isSelected = selectedMonth?.monthKey === m.monthKey;

              return (
                <button
                  key={m.monthKey}
                  type="button"
                  onClick={() => setSelectedMonth(m)}
                  className={`group flex flex-col justify-between rounded-xl border p-3 text-left transition-all hover:border-blue-400 hover:shadow-xs ${
                    isSelected
                      ? "border-[#3157a8] bg-blue-50/30 ring-1 ring-[#3157a8]"
                      : "border-slate-100 bg-slate-50/50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold text-slate-600 uppercase font-mono">
                      {m.monthLabel}
                    </span>
                    <ChevronRight size={13} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Barra Visual */}
                  <div className="my-3 h-16 w-full flex items-end rounded-md bg-slate-100 p-1">
                    <div
                      className="w-full rounded-xs bg-[#3157a8] transition-all group-hover:bg-[#203c7a]"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Comprometido</span>
                    <span className="text-xs font-bold text-slate-800 font-mono">
                      {formatCurrency(m.totalCommitted)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-center text-[11px] text-slate-400">
            Clique em qualquer mês para abrir o detalhamento completo dos compromissos.
          </p>
        </div>
      )}

      {/* Modal / Gaveta de Detalhamento do Mês Selecionado */}
      {selectedMonth && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl bg-white p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-base font-bold text-slate-800">
                  Compromissos de {selectedMonth.monthLabel}
                </h4>
                <p className="text-xs text-slate-400">
                  Composição real das obrigações a pagar no período
                </p>
              </div>
              <button
                onClick={() => setSelectedMonth(null)}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Subtotais por Tipo */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                <span className="text-[10px] text-slate-400">Cartões</span>
                <p className="font-bold text-slate-800 font-mono">
                  {formatCurrency(selectedMonth.creditCardTotal)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                <span className="text-[10px] text-slate-400">Empréstimos</span>
                <p className="font-bold text-slate-800 font-mono">
                  {formatCurrency(selectedMonth.loanTotal)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                <span className="text-[10px] text-slate-400">Fixas & Pendentes</span>
                <p className="font-bold text-slate-800 font-mono">
                  {formatCurrency(selectedMonth.fixedTotal + selectedMonth.otherPendingTotal)}
                </p>
              </div>
            </div>

            {/* Lista Detalhada de Itens */}
            <div className="my-4 flex-1 overflow-y-auto divide-y divide-slate-100 pr-1">
              {selectedMonth.items.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  Nenhum compromisso registrado para este mês.
                </p>
              ) : (
                selectedMonth.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2.5 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-slate-600">
                        {item.type === "credit_card" && <CreditCard size={14} />}
                        {item.type === "fixed" && <Repeat size={14} />}
                        {item.type === "loan" && <HandCoins size={14} />}
                        {item.type === "pending_bill" && <Receipt size={14} />}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{item.title}</p>
                        <span className="text-[11px] text-slate-400">
                          {item.detail} • Venc: {formatDate(item.dueDate)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      {item.isVariable ? (
                        <span className="text-[11px] text-amber-600 font-medium">A confirmar</span>
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

            {/* Totalizador Final */}
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-medium">TOTAL COMPROMETIDO</span>
                <p className="text-xl font-bold font-mono text-slate-900">
                  {formatCurrency(selectedMonth.totalCommitted)}
                </p>
              </div>
              <button
                onClick={() => setSelectedMonth(null)}
                className="rounded-xl bg-[#3157a8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#25468b]"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
