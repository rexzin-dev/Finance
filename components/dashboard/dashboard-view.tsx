"use client";

import React, { useMemo } from "react";
import { Wallet, TrendingUp, TrendingDown, Scale, Clock, AlertCircle } from "lucide-react";
import { useFinance } from "@/lib/finance-context";
import { MetricCard } from "./metric-card";
import { IncomeExpenseChart } from "./income-expense-chart";
import { BalanceEvolutionChart } from "./balance-evolution-chart";
import { CategoryExpensesChart } from "./category-expenses-chart";
import { UpcomingBills } from "./upcoming-bills";
import { RecentTransactions } from "./recent-transactions";
import { CommitmentsForecast } from "./commitments-forecast";
import { DashboardPlanningSummary } from "./dashboard-planning-summary";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { formatCurrency } from "@/lib/formatters";
import { analyzeBudgetForMonth, calculateFreeBalance } from "@/lib/planning-service";
import type { Transaction } from "@/lib/types";

interface DashboardViewProps {
  onNewTransaction: () => void;
  onNavigateToTransactions: () => void;
  onNavigateToPlanning?: () => void;
  onEditTransaction?: (tx: Transaction) => void;
}

export function DashboardView({
  onNewTransaction,
  onNavigateToTransactions,
  onNavigateToPlanning,
  onEditTransaction,
}: DashboardViewProps) {
  const {
    accounts,
    accountBalances,
    transactions,
    monthlyCommitments,
    dateRange,
    loading,
    budgets,
    categories,
    futureReserves,
    financialGoals,
    monthlyClosings,
  } = useFinance();

  // Transações dentro do período selecionado
  const periodTransactions = useMemo(() => {
    return transactions.filter(
      (t) => t.transaction_date >= dateRange.startDate && t.transaction_date <= dateRange.endDate
    );
  }, [transactions, dateRange]);

  // Cálculos matemáticos reais
  const { totalBalance, income, expense, result, initialBalance, currentMonthCommitted } =
    useMemo(() => {
      let sumAccountBalance = accounts.reduce(
        (acc, a) => acc + (Number(a.opening_balance) || 0),
        0
      );

      for (const t of transactions) {
        const amt = Number(t.amount) || 0;
        const isPaid = t.status === "paid" || t.status === "received";
        if (!isPaid) continue;

        if (t.type === "income") sumAccountBalance += amt;
        else if (t.type === "expense") sumAccountBalance -= amt;
      }

      let periodIncome = 0;
      let periodExpense = 0;

      for (const t of periodTransactions) {
        const amt = Number(t.amount) || 0;
        const isPaid = t.status === "paid" || t.status === "received";
        if (!isPaid) continue;

        if (t.type === "income") periodIncome += amt;
        else if (t.type === "expense") periodExpense += amt;
      }

      const firstMonth = monthlyCommitments[0];
      const committed = firstMonth ? firstMonth.totalCommitted : 0;

      return {
        totalBalance: sumAccountBalance,
        income: periodIncome,
        expense: periodExpense,
        result: periodIncome - periodExpense,
        initialBalance: accounts.reduce((acc, a) => acc + (Number(a.opening_balance) || 0), 0),
        currentMonthCommitted: committed,
      };
    }, [accounts, transactions, periodTransactions, monthlyCommitments]);

  const todayString = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const currentMonthKey = useMemo(() => todayString.slice(0, 7), [todayString]);

  const freeBalanceData = useMemo(() => {
    return calculateFreeBalance({
      accounts,
      accountBalances,
      monthlyCommitments,
      reserves: futureReserves,
      goals: financialGoals,
      transactions,
      todayString,
    });
  }, [accounts, accountBalances, monthlyCommitments, futureReserves, financialGoals, transactions, todayString]);

  const budgetAnalysis = useMemo(() => {
    return analyzeBudgetForMonth({
      monthKey: currentMonthKey,
      budgets,
      categories,
      transactions,
    });
  }, [currentMonthKey, budgets, categories, transactions]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho Contextual */}
      <PageHeader
        title="Dashboard"
        description="Acompanhe suas receitas, despesas e saldo no período."
        actionLabel="Novo lançamento"
        onAction={onNewTransaction}
      >
        {currentMonthCommitted > 0 && (
          <div className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-1.5 text-xs text-amber-800">
            <Clock size={14} className="text-amber-600" />
            <span>
              Já comprometido este mês: <strong>{formatCurrency(currentMonthCommitted)}</strong>
            </span>
          </div>
        )}
      </PageHeader>

      {/* Linha 1: 4 Cards de Indicadores (Saldo atual, Receitas, Ainda a Pagar, Saldo Livre) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Saldo atual"
          value={totalBalance}
          icon={Wallet}
          variant="default"
          subtitle="Somatório real das contas"
          loading={loading}
        />
        <MetricCard
          title="Receitas"
          value={income}
          icon={TrendingUp}
          variant="income"
          subtitle="Recebidas no período"
          loading={loading}
        />
        <MetricCard
          title="Ainda a pagar"
          value={currentMonthCommitted}
          icon={TrendingDown}
          variant="expense"
          subtitle="Compromissos do mês"
          loading={loading}
        />
        <MetricCard
          title="Saldo livre estimado"
          value={freeBalanceData.estimatedFreeBalance}
          icon={Scale}
          variant={freeBalanceData.estimatedFreeBalance >= 0 ? "default" : "expense"}
          subtitle="Disponível pós-obrigações e reservas"
          loading={loading}
        />
      </div>

      {/* Linha de Compromissos Futuros (Previsão de Pagamentos) */}
      <div>
        <CommitmentsForecast onNewTransaction={onNewTransaction} />
      </div>

      {/* Resumo do Planejamento do Mês (Orçamento, Reservas e Metas) */}
      <div>
        <DashboardPlanningSummary
          budgetAnalysis={budgetAnalysis}
          reserves={futureReserves}
          goals={financialGoals}
          onNavigateToPlanning={onNavigateToPlanning}
        />
      </div>

      {/* Linha 2: Receitas x Despesas (60-65%) e Evolução do Saldo (35-40%) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7 xl:col-span-8">
          <IncomeExpenseChart
            transactions={periodTransactions}
            onNewTransaction={onNewTransaction}
            loading={loading}
          />
        </div>
        <div className="lg:col-span-5 xl:col-span-4">
          <BalanceEvolutionChart
            transactions={transactions}
            initialBalance={initialBalance}
            onNewTransaction={onNewTransaction}
            loading={loading}
          />
        </div>
      </div>

      {/* Linha 3: Despesas por Categoria (60-65%) e Próximos Vencimentos (35-40%) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7 xl:col-span-7">
          <CategoryExpensesChart
            transactions={periodTransactions}
            onNewTransaction={onNewTransaction}
          />
        </div>
        <div className="lg:col-span-5 xl:col-span-5">
          <UpcomingBills
            transactions={transactions}
            onSelectTransaction={onEditTransaction}
          />
        </div>
      </div>

      {/* Linha 4: Últimas Movimentações */}
      <div>
        <RecentTransactions
          transactions={transactions}
          onViewAll={onNavigateToTransactions}
          onSelectTransaction={onEditTransaction}
        />
      </div>
    </div>
  );
}
