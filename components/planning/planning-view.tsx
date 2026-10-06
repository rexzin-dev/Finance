"use client";

import React, { useState } from "react";
import {
  CalendarDays,
  Target,
  PiggyBank,
  PieChart,
  CalendarCheck,
  Plus,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  History,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  FileText,
} from "lucide-react";
import { useFinance } from "@/lib/finance-context";
import { formatCurrency, formatDate } from "@/lib/formatters";
import {
  calculateReserveProgress,
  analyzeBudgetForMonth,
  calculateGoalProgress,
  calculateFreeBalance,
} from "@/lib/planning-service";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { toast } from "sonner";
import type { FutureReserve, Budget, FinancialGoal } from "@/lib/types";

export function PlanningView({ onNewTransaction }: { onNewTransaction: () => void }) {
  const {
    monthlyCommitments,
    futureReserves,
    reserveContributions,
    budgets,
    financialGoals,
    goalContributions,
    monthlyClosings,
    categories,
    transactions,
    accounts,
    accountBalances,
    saveReserve,
    removeReserve,
    contributeToReserve,
    saveBudgetRule,
    removeBudgetRule,
    saveGoal,
    removeGoal,
    contributeToGoal,
    closeCurrentMonth,
    reopenClosedMonth,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<"overview" | "budgets" | "reserves" | "goals">("overview");

  // Mês selecionado para visualização/fechamento
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const currentMonthSummary = monthlyCommitments[selectedMonthIndex] || monthlyCommitments[0];
  const currentMonthKey = currentMonthSummary ? currentMonthSummary.monthKey : new Date().toISOString().slice(0, 7);
  const todayString = new Date().toISOString().slice(0, 10);

  // Estados dos Modais
  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  const [editingReserve, setEditingReserve] = useState<FutureReserve | null>(null);
  const [reserveName, setReserveName] = useState("");
  const [reserveTargetAmount, setReserveTargetAmount] = useState("");
  const [reserveTargetDate, setReserveTargetDate] = useState("");
  const [reserveCategoryId, setReserveCategoryId] = useState("");
  const [reserveAccountId, setReserveAccountId] = useState("");
  const [reserveNotes, setReserveNotes] = useState("");

  // Modal Aporte Reserva
  const [contributeReserveModalOpen, setContributeReserveModalOpen] = useState(false);
  const [targetReserveForContribution, setTargetReserveForContribution] = useState<FutureReserve | null>(null);
  const [contribReserveAmount, setContribReserveAmount] = useState("");
  const [contribReserveFromAccount, setContribReserveFromAccount] = useState("");
  const [contribReserveDate, setContribReserveDate] = useState(todayString);
  const [contribReserveNotes, setContribReserveNotes] = useState("");

  // Modal Orçamento
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [budgetCategoryId, setBudgetCategoryId] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetIsRecurring, setBudgetIsRecurring] = useState(true);

  // Modal Meta
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [goalName, setGoalName] = useState("");
  const [goalTargetAmount, setGoalTargetAmount] = useState("");
  const [goalTargetDate, setGoalTargetDate] = useState("");
  const [goalAccountId, setGoalAccountId] = useState("");
  const [goalNotes, setGoalNotes] = useState("");

  // Modal Aporte/Resgate Meta
  const [contributeGoalModalOpen, setContributeGoalModalOpen] = useState(false);
  const [targetGoalForContribution, setTargetGoalForContribution] = useState<FinancialGoal | null>(null);
  const [contribGoalType, setContribGoalType] = useState<"deposit" | "withdraw">("deposit");
  const [contribGoalAmount, setContribGoalAmount] = useState("");
  const [contribGoalFromAccount, setContribGoalFromAccount] = useState("");
  const [contribGoalDate, setContribGoalDate] = useState(todayString);
  const [contribGoalNotes, setContribGoalNotes] = useState("");

  // Modal Fechamento Mensal
  const [closingModalOpen, setClosingModalOpen] = useState(false);
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState("");

  // ==========================================
  // CÁLCULOS PRINCIPAIS
  // ==========================================

  // 1. Orçamentos do Mês
  const budgetAnalysis = analyzeBudgetForMonth({
    monthKey: currentMonthKey,
    budgets,
    categories,
    transactions,
  });

  const totalBudgeted = budgetAnalysis.reduce((acc, b) => acc + b.budgetAmount, 0);
  const totalRealized = budgetAnalysis.reduce((acc, b) => acc + b.realizedAmount, 0);
  const totalBudgetCommitted = budgetAnalysis.reduce((acc, b) => acc + b.committedAmount, 0);
  const totalBudgetAvailable = Math.max(0, totalBudgeted - totalRealized - totalBudgetCommitted);

  // 2. Saldo Livre Estimado
  const freeBalance = calculateFreeBalance({
    accounts,
    accountBalances,
    monthlyCommitments,
    reserves: futureReserves,
    goals: financialGoals,
    transactions,
    todayString,
  });

  // 3. Fechamento do Mês Atual
  const currentClosing = monthlyClosings.find((c) => c.month_key === currentMonthKey);
  const isMonthClosed = currentClosing?.status === "closed";

  // Despesas pendentes do mês atual
  const pendingExpensesThisMonth = transactions.filter(
    (t) =>
      t.type === "expense" &&
      (t.status === "pending" || t.status === "to_receive") &&
      t.due_date &&
      t.due_date.startsWith(currentMonthKey)
  );
  const totalPendingAmount = pendingExpensesThisMonth.reduce((acc, t) => acc + Number(t.amount || 0), 0);

  // ==========================================
  // HANDLERS RESERVAS
  // ==========================================
  const handleOpenReserveModal = (reserve?: FutureReserve) => {
    if (reserve) {
      setEditingReserve(reserve);
      setReserveName(reserve.name);
      setReserveTargetAmount(String(reserve.target_amount));
      setReserveTargetDate(reserve.target_date || "");
      setReserveCategoryId(reserve.category_id || "");
      setReserveAccountId(reserve.account_id || "");
      setReserveNotes(reserve.notes || "");
    } else {
      setEditingReserve(null);
      setReserveName("");
      setReserveTargetAmount("");
      setReserveTargetDate("");
      setReserveCategoryId("");
      setReserveAccountId("");
      setReserveNotes("");
    }
    setReserveModalOpen(true);
  };

  const handleSaveReserve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reserveName.trim()) {
      toast.error("Informe o nome da reserva.");
      return;
    }
    const target = parseFloat(reserveTargetAmount.replace(",", ".")) || 0;
    if (target <= 0) {
      toast.error("Informe um valor previsto maior que zero.");
      return;
    }
    if (!reserveTargetDate) {
      toast.error("Informe a data prevista para a reserva.");
      return;
    }

    saveReserve({
      id: editingReserve?.id,
      name: reserveName.trim(),
      target_amount: target,
      target_date: reserveTargetDate,
      category_id: reserveCategoryId || null,
      account_id: reserveAccountId || null,
      notes: reserveNotes.trim() || null,
    });

    toast.success(editingReserve ? "Reserva atualizada com sucesso." : "Reserva criada com sucesso.");
    setReserveModalOpen(false);
  };

  const handleOpenContributeReserve = (reserve: FutureReserve) => {
    setTargetReserveForContribution(reserve);
    setContribReserveAmount("");
    setContribReserveFromAccount(reserve.account_id || "");
    setContribReserveDate(todayString);
    setContribReserveNotes("");
    setContributeReserveModalOpen(true);
  };

  const handleSaveContributeReserve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetReserveForContribution) return;
    const amt = parseFloat(contribReserveAmount.replace(",", ".")) || 0;
    if (amt <= 0) {
      toast.error("Informe um valor maior que zero.");
      return;
    }

    contributeToReserve({
      reserve_id: targetReserveForContribution.id,
      amount: amt,
      date: contribReserveDate,
      from_account_id: contribReserveFromAccount || null,
      to_account_id: targetReserveForContribution.account_id || null,
      notes: contribReserveNotes.trim() || null,
    });

    toast.success("Valor adicionado à reserva com sucesso.");
    setContributeReserveModalOpen(false);
  };

  // ==========================================
  // HANDLERS ORÇAMENTOS
  // ==========================================
  const handleOpenBudgetModal = (budget?: Budget) => {
    if (budget) {
      setEditingBudget(budget);
      setBudgetCategoryId(budget.category_id);
      setBudgetAmount(String(budget.amount));
      setBudgetIsRecurring(budget.is_recurring);
    } else {
      setEditingBudget(null);
      setBudgetCategoryId(categories.filter((c) => c.kind === "expense")[0]?.id || "");
      setBudgetAmount("");
      setBudgetIsRecurring(true);
    }
    setBudgetModalOpen(true);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetCategoryId) {
      toast.error("Selecione uma categoria.");
      return;
    }
    const amt = parseFloat(budgetAmount.replace(",", ".")) || 0;
    if (amt <= 0) {
      toast.error("Informe um valor orçado válido.");
      return;
    }

    saveBudgetRule({
      id: editingBudget?.id,
      category_id: budgetCategoryId,
      amount: amt,
      month_key: budgetIsRecurring ? null : currentMonthKey,
      is_recurring: budgetIsRecurring,
    });

    toast.success("Orçamento salvo com sucesso.");
    setBudgetModalOpen(false);
  };

  // ==========================================
  // HANDLERS METAS
  // ==========================================
  const handleOpenGoalModal = (goal?: FinancialGoal) => {
    if (goal) {
      setEditingGoal(goal);
      setGoalName(goal.name);
      setGoalTargetAmount(String(goal.target_amount));
      setGoalTargetDate(goal.target_date || "");
      setGoalAccountId(goal.account_id || "");
      setGoalNotes(goal.notes || "");
    } else {
      setEditingGoal(null);
      setGoalName("");
      setGoalTargetAmount("");
      setGoalTargetDate("");
      setGoalAccountId("");
      setGoalNotes("");
    }
    setGoalModalOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName.trim()) {
      toast.error("Informe o nome do objetivo.");
      return;
    }
    const target = parseFloat(goalTargetAmount.replace(",", ".")) || 0;
    if (target <= 0) {
      toast.error("Informe um valor objetivo válido.");
      return;
    }

    saveGoal({
      id: editingGoal?.id,
      name: goalName.trim(),
      target_amount: target,
      target_date: goalTargetDate || null,
      account_id: goalAccountId || null,
      notes: goalNotes.trim() || null,
    });

    toast.success(editingGoal ? "Meta atualizada com sucesso." : "Meta criada com sucesso.");
    setGoalModalOpen(false);
  };

  const handleOpenContributeGoal = (goal: FinancialGoal, type: "deposit" | "withdraw") => {
    setTargetGoalForContribution(goal);
    setContribGoalType(type);
    setContribGoalAmount("");
    setContribGoalFromAccount(goal.account_id || "");
    setContribGoalDate(todayString);
    setContribGoalNotes("");
    setContributeGoalModalOpen(true);
  };

  const handleSaveContributeGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetGoalForContribution) return;
    const amt = parseFloat(contribGoalAmount.replace(",", ".")) || 0;
    if (amt <= 0) {
      toast.error("Informe um valor maior que zero.");
      return;
    }

    try {
      contributeToGoal({
        goal_id: targetGoalForContribution.id,
        type: contribGoalType,
        amount: amt,
        date: contribGoalDate,
        from_account_id: contribGoalFromAccount || null,
        to_account_id: targetGoalForContribution.account_id || null,
        notes: contribGoalNotes.trim() || null,
      });

      toast.success(
        contribGoalType === "deposit" ? "Aporte realizado na meta." : "Resgate realizado da meta."
      );
      setContributeGoalModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar aporte.");
    }
  };

  // ==========================================
  // HANDLERS FECHAMENTO
  // ==========================================
  const handleConfirmCloseMonth = () => {
    closeCurrentMonth({
      month_key: currentMonthKey,
      closed_by: "Usuário",
    });
    toast.success(`Mês ${currentMonthSummary?.monthLabel || currentMonthKey} fechado com sucesso.`);
    setClosingModalOpen(false);
  };

  const handleConfirmReopenMonth = () => {
    reopenClosedMonth({
      month_key: currentMonthKey,
      reopened_by: "Usuário",
      reason: reopenReason.trim() || "Ajuste de lançamentos",
    });
    toast.success(`Mês ${currentMonthSummary?.monthLabel || currentMonthKey} reaberto para correções.`);
    setReopenModalOpen(false);
    setReopenReason("");
  };

  return (
    <div className="space-y-6">
      {/* Topo Contextual com PageHeader e Seletor de Tabs */}
      <PageHeader
        title="Planejamento"
        description="Organize compromissos, reservas e metas."
        actionLabel={
          activeTab === "budgets"
            ? "Novo orçamento"
            : activeTab === "reserves"
            ? "Nova reserva"
            : activeTab === "goals"
            ? "Nova meta"
            : undefined
        }
        onAction={
          activeTab === "budgets"
            ? () => handleOpenBudgetModal()
            : activeTab === "reserves"
            ? () => handleOpenReserveModal()
            : activeTab === "goals"
            ? () => handleOpenGoalModal()
            : undefined
        }
      >
        {/* Seletor de Tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white p-1 shadow-2xs">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "overview" ? "bg-[#3157a8] text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <PieChart size={14} />
            <span>Visão geral</span>
          </button>
          <button
            onClick={() => setActiveTab("budgets")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "budgets" ? "bg-[#3157a8] text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Target size={14} />
            <span>Orçamentos</span>
          </button>
          <button
            onClick={() => setActiveTab("reserves")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "reserves" ? "bg-[#3157a8] text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <CalendarDays size={14} />
            <span>Reservas futuras</span>
          </button>
          <button
            onClick={() => setActiveTab("goals")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "goals" ? "bg-[#3157a8] text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <PiggyBank size={14} />
            <span>Metas</span>
          </button>
        </div>
      </PageHeader>

      {/* =====================================================
          TAB 1: VISÃO GERAL (RESUMO, COMPROMISSOS, FECHAMENTO)
          ===================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Régua de Navegação dos Meses */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {monthlyCommitments.map((month, index) => {
              const isSelected = selectedMonthIndex === index;
              const closing = monthlyClosings.find((c) => c.month_key === month.monthKey);
              const isClosed = closing?.status === "closed";

              return (
                <button
                  key={month.monthKey}
                  onClick={() => setSelectedMonthIndex(index)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs transition-all ${
                    isSelected
                      ? "border-[#3157a8] bg-blue-50/40 text-[#3157a8] ring-1 ring-[#3157a8]"
                      : "border-slate-200/80 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <span className="font-mono font-bold">{month.monthLabel}</span>
                  {isClosed ? (
                    <span className="flex items-center gap-1 rounded-md bg-emerald-100/80 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                      <Lock size={10} /> Fechado
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Aberto</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Banner de Fechamento do Mês Selecionado */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div
                className={`grid h-10 w-10 place-items-center rounded-xl ${
                  isMonthClosed ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-[#3157a8]"
                }`}
              >
                {isMonthClosed ? <Lock size={18} /> : <CalendarCheck size={18} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800">
                    Status de {currentMonthSummary?.monthLabel || currentMonthKey}:
                  </h3>
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                      isMonthClosed ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {isMonthClosed ? "Período Fechado" : "Período Aberto"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isMonthClosed
                    ? `Fechado em ${formatDate(currentClosing.closed_at || "")} por ${currentClosing.closed_by || "Usuário"}`
                    : totalPendingAmount > 0
                    ? `Existem ${formatCurrency(totalPendingAmount)} em pendências a serem pagas antes do fechamento.`
                    : "Todos os compromissos deste mês foram quitados."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isMonthClosed && (
                <button
                  type="button"
                  onClick={async () => {
                    const { exportMonthlyClosingToPDF } = await import("@/lib/export-utils");
                    await exportMonthlyClosingToPDF({
                      monthLabel: currentMonthSummary?.monthLabel || currentMonthKey,
                      closing: currentClosing,
                      budgetAnalysis,
                      commitments: currentMonthSummary?.items || [],
                    });
                    toast.success("PDF do fechamento gerado com sucesso.");
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <FileText size={14} />
                  <span>Exportar PDF</span>
                </button>
              )}

              {isMonthClosed ? (
                <button
                  type="button"
                  onClick={() => setReopenModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Unlock size={14} />
                  <span>Reabrir mês</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setClosingModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-[#3157a8] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#25468b] transition-colors"
                >
                  <Lock size={14} />
                  <span>Fechar mês</span>
                </button>
              )}
            </div>
          </div>

          {/* Grid de 4 Cards: O que Gastei, Ainda a Pagar, Planejado, Saldo Livre */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">1. Quanto já gastei?</span>
              <p className="mt-2 text-xl font-bold font-mono text-slate-900">
                {formatCurrency(totalRealized)}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">Despesas pagas no período</span>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">2. Quanto ainda a pagar?</span>
              <p className="mt-2 text-xl font-bold font-mono text-amber-600">
                {formatCurrency(currentMonthSummary?.totalCommitted || 0)}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">Compromissos e faturas deste mês</span>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">3. Quanto planejei gastar?</span>
              <p className="mt-2 text-xl font-bold font-mono text-slate-800">
                {formatCurrency(totalBudgeted)}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Disponível no orçamento: <strong>{formatCurrency(totalBudgetAvailable)}</strong>
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">4. Saldo livre estimado</span>
              <p
                className={`mt-2 text-xl font-bold font-mono ${
                  freeBalance.estimatedFreeBalance < 0 ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                {formatCurrency(freeBalance.estimatedFreeBalance)}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Contas ({formatCurrency(freeBalance.usableAccountBalance)}) - Obrigações e Reservas
              </span>
            </div>
          </div>

          {/* Detalhamento dos Compromissos e Histórico */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Lista dos Compromissos do Mês */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <h3 className="text-sm font-bold text-slate-800">
                  Obrigações e Faturas ({currentMonthSummary?.monthLabel})
                </h3>
                <span className="font-mono text-xs font-bold text-slate-700">
                  Total: {formatCurrency(currentMonthSummary?.totalCommitted || 0)}
                </span>
              </div>

              {!currentMonthSummary?.items.length ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  Nenhuma obrigação registrada para este mês.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
                  {currentMonthSummary.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2.5 text-xs">
                      <div>
                        <p className="font-semibold text-slate-800">{item.title}</p>
                        <span className="text-[11px] text-slate-400">
                          {item.detail} • Vence: {formatDate(item.dueDate)}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slate-800">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Versões e Histórico de Fechamento */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <h3 className="text-sm font-bold text-slate-800">Histórico de Fechamento</h3>
                <History size={15} className="text-slate-400" />
              </div>

              {!currentClosing?.history?.length ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Este mês ainda não possui snapshots de fechamento gravados.
                </div>
              ) : (
                <div className="space-y-3">
                  {currentClosing.history.map((ver: any, i: number) => (
                    <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-700">
                        <span>Versão {ver.version}</span>
                        <span className="text-[11px] font-normal text-slate-400">
                          {formatDate(ver.closed_at)}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400">Receitas:</span>
                          <p className="font-mono font-semibold text-emerald-600">
                            {formatCurrency(ver.income_total)}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-400">Despesas:</span>
                          <p className="font-mono font-semibold text-rose-600">
                            {formatCurrency(ver.expense_total)}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-400">Resultado:</span>
                          <p className="font-mono font-semibold text-slate-800">
                            {formatCurrency(ver.result)}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-400">Comprometido:</span>
                          <p className="font-mono font-semibold text-slate-800">
                            {formatCurrency(ver.committed_total)}
                          </p>
                        </div>
                      </div>
                      {ver.reopened_at && (
                        <p className="mt-2 text-[10px] text-amber-600 border-t border-slate-200/60 pt-1.5">
                          Reaberto em {formatDate(ver.reopened_at)} ({ver.reopen_reason})
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          TAB 2: ORÇAMENTOS (ORÇADO X REALIZADO X COMPROMETIDO)
          ===================================================== */}
      {activeTab === "budgets" && (
        <div className="space-y-6">

          {budgetAnalysis.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-8">
              <EmptyState
                icon={Target}
                title="Nenhum orçamento definido"
                description="Planeje limites mensais para suas categorias (ex: Alimentação, Transporte, Lazer) para acompanhar o realizado e o comprometido."
                actionLabel="Definir orçamento"
                onAction={() => handleOpenBudgetModal()}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {budgetAnalysis.map((b) => {
                const isExceeded = b.status === "exceeded";
                const isWarning = b.status === "warning";

                return (
                  <div
                    key={b.categoryId}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: b.categoryColor }}
                          />
                          <h4 className="text-sm font-bold text-slate-800">{b.categoryName}</h4>
                        </div>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                            isExceeded
                              ? "bg-rose-100 text-rose-700"
                              : isWarning
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {Math.round(b.percentage)}%
                        </span>
                      </div>

                      <div className="mt-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Consumido</span>
                          <span className="font-mono font-bold text-slate-800">
                            {formatCurrency(b.consumedAmount)} / {formatCurrency(b.budgetAmount)}
                          </span>
                        </div>

                        {/* Barra de Progresso */}
                        <div className="mt-2 h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isExceeded ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-[#3157a8]"
                            }`}
                            style={{ width: `${Math.min(100, b.percentage)}%` }}
                          />
                        </div>
                      </div>

                      {/* Discriminação: Realizado vs Comprometido */}
                      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400">Pago (Realizado)</span>
                          <p className="font-mono font-semibold text-slate-700">
                            {formatCurrency(b.realizedAmount)}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400">Pendente (Comprometido)</span>
                          <p className="font-mono font-semibold text-amber-600">
                            {formatCurrency(b.committedAmount)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400">
                          {isExceeded ? "Acima do orçamento" : "Disponível"}
                        </span>
                        <p
                          className={`font-mono font-bold ${
                            isExceeded ? "text-rose-600" : "text-emerald-600"
                          }`}
                        >
                          {isExceeded ? formatCurrency(b.exceededAmount) : formatCurrency(b.availableAmount)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const existing = budgets.find((bg) => bg.category_id === b.categoryId);
                          if (existing) removeBudgetRule(existing.id);
                        }}
                        className="text-[11px] text-rose-500 hover:underline"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          TAB 3: RESERVAS FUTURAS (IPVA, SEGURO, REFORMAS)
          ===================================================== */}
      {activeTab === "reserves" && (
        <div className="space-y-6">

          {futureReserves.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-8">
              <EmptyState
                icon={CalendarDays}
                title="Nenhuma reserva futura cadastrada"
                description="Cadastre despesas que acontecerão mais adiante (ex: IPVA, seguro do carro, material escolar) para calcular quanto guardar todo mês."
                actionLabel="Criar reserva"
                onAction={() => handleOpenReserveModal()}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {futureReserves.map((reserve) => {
                const calc = calculateReserveProgress(reserve);

                return (
                  <div
                    key={reserve.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-800">{reserve.name}</h4>
                        {calc.isCompleted ? (
                          <span className="flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            <CheckCircle2 size={12} /> Meta Atingida
                          </span>
                        ) : (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            {calc.percentage}%
                          </span>
                        )}
                      </div>

                      <div className="mt-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Reservado</span>
                          <span className="font-mono font-bold text-slate-800">
                            {formatCurrency(calc.currentAmount)} / {formatCurrency(calc.targetAmount)}
                          </span>
                        </div>

                        {/* Barra de Progresso */}
                        <div className="mt-2 h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              calc.isCompleted ? "bg-emerald-500" : "bg-[#3157a8]"
                            }`}
                            style={{ width: `${Math.min(100, calc.percentage)}%` }}
                          />
                        </div>
                      </div>

                      {/* Métricas: Faltam, Prazo e Sugestão Mensal */}
                      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400">Ainda falta</span>
                          <p className="font-mono font-bold text-slate-800">
                            {formatCurrency(calc.remainingAmount)}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400">Prazo</span>
                          <p className="font-medium text-slate-700">
                            {formatDate(reserve.target_date)}
                          </p>
                        </div>
                      </div>

                      {!calc.isCompleted && (
                        <div className="mt-3 rounded-xl bg-blue-50/50 p-2.5 text-xs border border-blue-100/60">
                          <span className="text-[10px] font-semibold text-[#3157a8] uppercase">
                            Sugestão Mensal ({calc.monthsRemaining} meses)
                          </span>
                          <p className="font-mono text-sm font-bold text-[#3157a8]">
                            {formatCurrency(calc.monthlySuggestion)}/mês
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 border-t border-slate-100 pt-3.5 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenContributeReserve(reserve)}
                        className="flex-1 rounded-xl bg-[#3157a8] py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#25468b] transition-colors"
                      >
                        + Reservar dinheiro
                      </button>

                      <button
                        type="button"
                        onClick={() => removeReserve(reserve.id)}
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 transition-colors"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          TAB 4: METAS FINANCEIRAS (RESERVA DE EMERGÊNCIA, VIAGEM)
          ===================================================== */}
      {activeTab === "goals" && (
        <div className="space-y-6">

          {financialGoals.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-8">
              <EmptyState
                icon={PiggyBank}
                title="Nenhuma meta cadastrada"
                description="Defina metas reais (ex: Reserva de emergência, Viagem, Reforma, Carro novo) e controle o acúmulo financeiro."
                actionLabel="Criar meta"
                onAction={() => handleOpenGoalModal()}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {financialGoals.map((goal) => {
                const calc = calculateGoalProgress(goal);

                return (
                  <div
                    key={goal.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-800">{goal.name}</h4>
                        {calc.isCompleted ? (
                          <span className="flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            <CheckCircle2 size={12} /> Meta Atingida
                          </span>
                        ) : (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            {calc.percentage}%
                          </span>
                        )}
                      </div>

                      <div className="mt-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Acumulado</span>
                          <span className="font-mono font-bold text-slate-800">
                            {formatCurrency(calc.currentAmount)} / {formatCurrency(calc.targetAmount)}
                          </span>
                        </div>

                        {/* Barra de Progresso */}
                        <div className="mt-2 h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              calc.isCompleted ? "bg-emerald-500" : "bg-[#3157a8]"
                            }`}
                            style={{ width: `${Math.min(100, calc.percentage)}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400">Restante</span>
                          <p className="font-mono font-bold text-slate-800">
                            {formatCurrency(calc.remainingAmount)}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400">Prazo</span>
                          <p className="font-medium text-slate-700">
                            {goal.target_date ? formatDate(goal.target_date) : "Sem prazo definido"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-slate-100 pt-3.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenContributeGoal(goal, "deposit")}
                        className="flex-1 rounded-xl bg-[#3157a8] py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#25468b] transition-colors"
                      >
                        + Aportar
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenContributeGoal(goal, "withdraw")}
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        Resgatar
                      </button>

                      <button
                        type="button"
                        onClick={() => removeGoal(goal.id)}
                        className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 transition-colors"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          MODAIS DE CADASTRO E CONTRIBUIÇÃO
          ===================================================== */}

      {/* 1. Modal Cadastro Reserva */}
      {reserveModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">
                {editingReserve ? "Editar Reserva Futura" : "Nova Reserva Futura"}
              </h3>
              <button
                onClick={() => setReserveModalOpen(false)}
                className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveReserve} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-medium text-slate-700">Nome da despesa prevista *</label>
                <input
                  type="text"
                  placeholder="Ex: IPVA 2027, Seguro do Carro, Material Escolar"
                  value={reserveName}
                  onChange={(e) => setReserveName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700">Valor previsto (R$) *</label>
                  <input
                    type="text"
                    placeholder="2.400,00"
                    value={reserveTargetAmount}
                    onChange={(e) => setReserveTargetAmount(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono focus:border-blue-500 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700">Data prevista *</label>
                  <input
                    type="date"
                    value={reserveTargetDate}
                    onChange={(e) => setReserveTargetDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700">Conta de reserva (opcional)</label>
                <select
                  value={reserveAccountId}
                  onChange={(e) => setReserveAccountId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                >
                  <option value="">Controle por alocação interna (sem conta exclusiva)</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.institution || "Conta"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-700">Observações (opcional)</label>
                <textarea
                  rows={2}
                  value={reserveNotes}
                  onChange={(e) => setReserveNotes(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setReserveModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#3157a8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#25468b]"
                >
                  Salvar reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal Aportar em Reserva */}
      {contributeReserveModalOpen && targetReserveForContribution && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Reservar Dinheiro</h3>
                <p className="text-[11px] text-slate-400">
                  Destinar valores reais para: {targetReserveForContribution.name}
                </p>
              </div>
              <button
                onClick={() => setContributeReserveModalOpen(false)}
                className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveContributeReserve} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-medium text-slate-700">Conta de origem *</label>
                <select
                  value={contribReserveFromAccount}
                  onChange={(e) => setContribReserveFromAccount(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                >
                  <option value="">Selecione a conta...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (Saldo: {formatCurrency(accountBalances[acc.id] || 0)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700">Valor a reservar (R$) *</label>
                  <input
                    type="text"
                    placeholder="200,00"
                    value={contribReserveAmount}
                    onChange={(e) => setContribReserveAmount(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono focus:border-blue-500 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700">Data do aporte *</label>
                  <input
                    type="date"
                    value={contribReserveDate}
                    onChange={(e) => setContribReserveDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                Aporte em reserva própria não é contabilizado como despesa. O dinheiro continua seu, mas alocado para esta obrigação futura.
              </p>

              <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setContributeReserveModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#3157a8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#25468b]"
                >
                  Confirmar aporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal Cadastro Orçamento */}
      {budgetModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">Definir Orçamento de Categoria</h3>
              <button
                onClick={() => setBudgetModalOpen(false)}
                className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-medium text-slate-700">Categoria de Despesa *</label>
                <select
                  value={budgetCategoryId}
                  onChange={(e) => setBudgetCategoryId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                  required
                >
                  {categories
                    .filter((c) => c.kind === "expense")
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-700">Valor orçado mensal (R$) *</label>
                <input
                  type="text"
                  placeholder="1.500,00"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono focus:border-blue-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="recBudget"
                  checked={budgetIsRecurring}
                  onChange={(e) => setBudgetIsRecurring(e.target.checked)}
                  className="h-4 w-4 rounded-sm border-slate-300 text-[#3157a8]"
                />
                <label htmlFor="recBudget" className="text-xs text-slate-700">
                  Repetir mensalmente como regra padrão
                </label>
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setBudgetModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#3157a8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#25468b]"
                >
                  Salvar orçamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal Cadastro Meta */}
      {goalModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">
                {editingGoal ? "Editar Meta Financeira" : "Nova Meta Financeira"}
              </h3>
              <button
                onClick={() => setGoalModalOpen(false)}
                className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-medium text-slate-700">Nome da meta *</label>
                <input
                  type="text"
                  placeholder="Ex: Reserva de emergência, Viagem, Reforma"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700">Valor objetivo (R$) *</label>
                  <input
                    type="text"
                    placeholder="20.000,00"
                    value={goalTargetAmount}
                    onChange={(e) => setGoalTargetAmount(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono focus:border-blue-500 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700">Prazo (opcional)</label>
                  <input
                    type="date"
                    value={goalTargetDate}
                    onChange={(e) => setGoalTargetDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700">Conta vinculada (opcional)</label>
                <select
                  value={goalAccountId}
                  onChange={(e) => setGoalAccountId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                >
                  <option value="">Sem conta exclusiva (alocação interna)</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.institution || "Conta"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-700">Observações (opcional)</label>
                <textarea
                  rows={2}
                  value={goalNotes}
                  onChange={(e) => setGoalNotes(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setGoalModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#3157a8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#25468b]"
                >
                  Salvar meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal Aporte/Resgate Meta */}
      {contributeGoalModalOpen && targetGoalForContribution && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  {contribGoalType === "deposit" ? "Adicionar Dinheiro à Meta" : "Retirar da Meta"}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {targetGoalForContribution.name} • Saldo atual:{" "}
                  {formatCurrency(targetGoalForContribution.current_amount)}
                </p>
              </div>
              <button
                onClick={() => setContributeGoalModalOpen(false)}
                className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveContributeGoal} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-medium text-slate-700">
                  {contribGoalType === "deposit" ? "Conta de origem *" : "Conta de destino *"}
                </label>
                <select
                  value={contribGoalFromAccount}
                  onChange={(e) => setContribGoalFromAccount(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                >
                  <option value="">Selecione a conta...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (Saldo: {formatCurrency(accountBalances[acc.id] || 0)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700">Valor (R$) *</label>
                  <input
                    type="text"
                    placeholder="500,00"
                    value={contribGoalAmount}
                    onChange={(e) => setContribGoalAmount(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono focus:border-blue-500 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700">Data *</label>
                  <input
                    type="date"
                    value={contribGoalDate}
                    onChange={(e) => setContribGoalDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setContributeGoalModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#3157a8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#25468b]"
                >
                  Confirmar {contribGoalType === "deposit" ? "aporte" : "resgate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal Confirmar Fechamento Mensal */}
      {closingModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">
                Fechar Período: {currentMonthSummary?.monthLabel || currentMonthKey}
              </h3>
              <button
                onClick={() => setClosingModalOpen(false)}
                className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600">
              <p>
                O fechamento registrará uma fotografia imutável (snapshot) dos resultados consolidados deste período.
              </p>

              <div className="rounded-xl bg-slate-50 p-3 space-y-2 border border-slate-100">
                <div className="flex justify-between">
                  <span>Despesas pagas:</span>
                  <strong className="font-mono text-slate-800">{formatCurrency(totalRealized)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Comprometido em faturas/obrigações:</span>
                  <strong className="font-mono text-amber-600">
                    {formatCurrency(currentMonthSummary?.totalCommitted || 0)}
                  </strong>
                </div>
                {totalPendingAmount > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Despesas ainda pendentes:</span>
                    <strong className="font-mono">{formatCurrency(totalPendingAmount)}</strong>
                  </div>
                )}
              </div>

              {totalPendingAmount > 0 && (
                <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-2.5 text-[11px] text-amber-700 border border-amber-200/60">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                  <span>
                    Existem {formatCurrency(totalPendingAmount)} em despesas pendentes. Você pode fechar o mês normalmente; esses valores permanecerão registrados como pendências.
                  </span>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setClosingModalOpen(false)}
                className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmCloseMonth}
                className="rounded-xl bg-[#3157a8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#25468b]"
              >
                Confirmar e fechar mês
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal Reabrir Mês Fechado */}
      {reopenModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">
                Reabrir Período: {currentMonthSummary?.monthLabel || currentMonthKey}
              </h3>
              <button
                onClick={() => setReopenModalOpen(false)}
                className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600">
              <p>
                Este período já havia sido fechado. Ao reabrir, você poderá realizar correções e gerar um novo fechamento mantendo o histórico de versões.
              </p>

              <div>
                <label className="font-medium text-slate-700">Motivo da reabertura (opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Correção de lançamento de despesa esquecida"
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setReopenModalOpen(false)}
                className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReopenMonth}
                className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700"
              >
                Confirmar reabertura
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
