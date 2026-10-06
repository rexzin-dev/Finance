"use client";

import React, { useState, useMemo } from "react";
import { Download, FileText, FileSpreadsheet, Filter } from "lucide-react";
import { useFinance } from "@/lib/finance-context";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { formatCurrency, formatDate } from "@/lib/formatters";
import {
  exportTransactionsToCSV,
  exportTransactionsToXLSX,
  exportTransactionsToPDF,
} from "@/lib/export-utils";
import { toast } from "sonner";
import { IncomeExpenseChart } from "@/components/dashboard/income-expense-chart";
import { CategoryExpensesChart } from "@/components/dashboard/category-expenses-chart";

export function ReportsView({ onNewTransaction }: { onNewTransaction: () => void }) {
  const { transactions, accounts, categories, dateRange, period } = useFinance();

  const [selectedAccount, setSelectedAccount] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (t.transaction_date < dateRange.startDate || t.transaction_date > dateRange.endDate) {
        return false;
      }
      if (selectedAccount !== "all" && t.account_id !== selectedAccount) return false;
      if (selectedCategory !== "all" && t.category_id !== selectedCategory) return false;
      if (selectedType !== "all" && t.type !== selectedType) return false;
      return true;
    });
  }, [transactions, dateRange, selectedAccount, selectedCategory, selectedType]);

  const summary = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const t of filtered) {
      if (t.status === "paid" || t.status === "received") {
        if (t.type === "income") inc += Number(t.amount) || 0;
        if (t.type === "expense") exp += Number(t.amount) || 0;
      }
    }
    return { totalIncome: inc, totalExpense: exp, result: inc - exp };
  }, [filtered]);

  const periodLabels: Record<string, string> = {
    this_month: "Este mês",
    last_month: "Mês anterior",
    last_3_months: "Últimos 3 meses",
    last_6_months: "Últimos 6 meses",
    this_year: "Este ano",
    custom: "Personalizado",
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.error("Não há lançamentos no período filtrado para exportar.");
      return;
    }
    exportTransactionsToCSV(filtered);
    toast.success("Arquivo CSV gerado com sucesso.");
  };

  const handleExportXLSX = async () => {
    if (filtered.length === 0) {
      toast.error("Não há lançamentos no período filtrado para exportar.");
      return;
    }
    try {
      await exportTransactionsToXLSX(filtered);
      toast.success("Planilha Excel gerada com sucesso.");
    } catch {
      toast.error("Erro ao gerar planilha Excel.");
    }
  };

  const handleExportPDF = async () => {
    if (filtered.length === 0) {
      toast.error("Não há lançamentos no período filtrado para exportar.");
      return;
    }
    try {
      await exportTransactionsToPDF(filtered, periodLabels[period] || period, summary);
      toast.success("Relatório PDF gerado com sucesso.");
    } catch {
      toast.error("Erro ao gerar relatório PDF.");
    }
  };

  return (
    <div className="space-y-5">
      {/* Cabeçalho Contextual */}
      <PageHeader
        title="Relatórios"
        description="Analise e exporte seus dados financeiros."
        actionLabel="Exportar PDF"
        actionIcon={FileText}
        onAction={handleExportPDF}
      >
        <Button
          size="sm"
          variant="outline"
          onClick={handleExportCSV}
          className="h-9 gap-1.5 rounded-xl border-slate-200 text-xs font-semibold hover:bg-slate-50"
        >
          <Download size={14} />
          CSV
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleExportXLSX}
          className="h-9 gap-1.5 rounded-xl border-slate-200 text-xs font-semibold hover:bg-slate-50"
        >
          <FileSpreadsheet size={14} />
          Excel
        </Button>
      </PageHeader>

      {/* Filtros do Relatório */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase">Conta</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
            >
              <option value="all">Todas as contas</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase">Categoria</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
            >
              <option value="all">Todas as categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase">Tipo</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
            >
              <option value="all">Todos os tipos</option>
              <option value="income">Receitas</option>
              <option value="expense">Despesas</option>
              <option value="transfer">Transferências</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resumo Consolidado */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
          <span className="text-xs font-medium text-slate-500">Receitas Filtradas</span>
          <p className="mt-1 text-xl font-bold font-mono text-emerald-600">
            {formatCurrency(summary.totalIncome)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
          <span className="text-xs font-medium text-slate-500">Despesas Filtradas</span>
          <p className="mt-1 text-xl font-bold font-mono text-rose-600">
            {formatCurrency(summary.totalExpense)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
          <span className="text-xs font-medium text-slate-500">Resultado do Período</span>
          <p
            className={`mt-1 text-xl font-bold font-mono ${
              summary.result >= 0 ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {formatCurrency(summary.result)}
          </p>
        </div>
      </div>

      {/* Gráficos Reais no Relatório */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <IncomeExpenseChart
            transactions={filtered}
            onNewTransaction={onNewTransaction}
          />
        </div>
        <div className="lg:col-span-6">
          <CategoryExpensesChart
            transactions={filtered}
            onNewTransaction={onNewTransaction}
          />
        </div>
      </div>
    </div>
  );
}
