"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Bell, AlertTriangle, AlertCircle, Info, Check, ChevronRight } from "lucide-react";
import { useFinance } from "@/lib/finance-context";
import { generateFinancialAlerts, calculateFreeBalance } from "@/lib/planning-service";
import { formatCurrency } from "@/lib/formatters";

interface AlertsCenterProps {
  onNavigateTab?: (tab: string) => void;
}

export function AlertsCenter({ onNavigateTab }: AlertsCenterProps) {
  const {
    transactions,
    invoices,
    budgets,
    categories,
    futureReserves,
    financialGoals,
    accounts,
    accountBalances,
    monthlyCommitments,
    dismissedAlertIds,
    dismissAlert,
  } = useFinance();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const todayString = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const freeBalance = useMemo(
    () =>
      calculateFreeBalance({
        accounts,
        accountBalances,
        monthlyCommitments,
        reserves: futureReserves,
        goals: financialGoals,
        transactions,
        todayString,
      }),
    [accounts, accountBalances, monthlyCommitments, futureReserves, financialGoals, transactions, todayString]
  );

  const alerts = useMemo(
    () =>
      generateFinancialAlerts({
        transactions,
        invoices,
        budgets,
        categories,
        reserves: futureReserves,
        goals: financialGoals,
        freeBalance,
        todayString,
        dismissedAlertIds,
      }),
    [
      transactions,
      invoices,
      budgets,
      categories,
      futureReserves,
      financialGoals,
      freeBalance,
      todayString,
      dismissedAlertIds,
    ]
  );

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const criticalCount = alerts.filter((a) => a.priority === "critical").length;
  const totalCount = alerts.length;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Alertas financeiros"
        className="relative grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
      >
        <Bell size={16} />
        {totalCount > 0 && (
          <span
            className={`absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white shadow-2xs ${
              criticalCount > 0 ? "bg-rose-500" : "bg-amber-500"
            }`}
          >
            {totalCount > 9 ? "9+" : totalCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xl z-50 animate-in fade-in-50 zoom-in-95">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 px-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">Alertas Financeiros</span>
              {totalCount > 0 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {totalCount}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400">Baseado em dados reais</span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 py-1">
            {alerts.length === 0 ? (
              <div className="py-6 text-center">
                <div className="mx-auto grid h-8 w-8 place-items-center rounded-full bg-emerald-50 text-emerald-600 mb-2">
                  <Check size={16} />
                </div>
                <p className="text-xs font-medium text-slate-700">Tudo certo por aqui!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Nenhum alerta financeiro pendente no momento.</p>
              </div>
            ) : (
              alerts.map((alert) => {
                const isCrit = alert.priority === "critical";
                const isWarn = alert.priority === "warning";

                return (
                  <div key={alert.id} className="py-2.5 px-2 hover:bg-slate-50/60 rounded-xl transition-colors">
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md ${
                          isCrit
                            ? "bg-rose-100 text-rose-600"
                            : isWarn
                            ? "bg-amber-100 text-amber-600"
                            : "bg-blue-100 text-[#3157a8]"
                        }`}
                      >
                        {isCrit ? <AlertCircle size={14} /> : isWarn ? <AlertTriangle size={14} /> : <Info size={14} />}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-800">{alert.title}</p>
                          <button
                            type="button"
                            onClick={() => dismissAlert(alert.id)}
                            title="Marcar como lido"
                            className="text-[10px] text-slate-400 hover:text-slate-600 ml-2"
                          >
                            Dispensar
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{alert.description}</p>

                        {alert.linkTab && onNavigateTab && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsOpen(false);
                              onNavigateTab(alert.linkTab!);
                            }}
                            className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#3157a8] hover:underline"
                          >
                            <span>{alert.actionLabel || "Visualizar"}</span>
                            <ChevronRight size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
