"use client";

import React from "react";
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

interface RecentTransactionsProps {
  transactions: Transaction[];
  onViewAll: () => void;
  onSelectTransaction?: (tx: Transaction) => void;
}

export function RecentTransactions({
  transactions,
  onViewAll,
  onSelectTransaction,
}: RecentTransactionsProps) {
  const recent = [...transactions]
    .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))
    .slice(0, 5);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Últimas Movimentações</h3>
          <p className="text-xs text-slate-400">Atividades financeiras recentes</p>
        </div>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-[#3157a8] transition-colors hover:text-[#203c7a]"
        >
          Ver todos →
        </button>
      </div>

      {recent.length === 0 ? (
        <p className="py-8 text-center text-xs text-slate-400">
          Nenhuma movimentação registrada recentemente.
        </p>
      ) : (
        <div className="divide-y divide-slate-100">
          {recent.map((tx) => {
            const isExpense = tx.type === "expense";
            const isIncome = tx.type === "income";

            return (
              <div
                key={tx.id}
                onClick={() => onSelectTransaction?.(tx)}
                className="flex cursor-pointer items-center justify-between py-3 transition-colors hover:bg-slate-50/60"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                      isIncome && "bg-emerald-50 text-emerald-600",
                      isExpense && "bg-rose-50 text-rose-600",
                      tx.type === "transfer" && "bg-blue-50 text-blue-600"
                    )}
                  >
                    {isIncome && <ArrowDownLeft size={16} />}
                    {isExpense && <ArrowUpRight size={16} />}
                    {tx.type === "transfer" && <ArrowLeftRight size={16} />}
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-800">{tx.description}</h4>
                    <p className="text-[11px] text-slate-400">
                      {tx.category_name || "Geral"} {tx.account_name ? `• ${tx.account_name}` : ""}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={cn(
                      "text-xs font-bold font-mono",
                      isIncome && "text-emerald-600",
                      isExpense && "text-rose-600",
                      tx.type === "transfer" && "text-slate-700"
                    )}
                  >
                    {isIncome ? "+ " : isExpense ? "- " : ""}
                    {formatCurrency(tx.amount)}
                  </p>
                  <span className="text-[10px] text-slate-400">{formatDate(tx.transaction_date)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
