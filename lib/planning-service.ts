import type {
  FutureReserve,
  ReserveContribution,
  Budget,
  FinancialGoal,
  GoalContribution,
  MonthlyClosing,
  MonthlyClosingVersion,
  FinancialAlert,
  FinancialAlertPriority,
  Transaction,
  CreditCardInvoice,
  MonthlyCommitmentSummary,
  Account,
} from "./types";
import { formatCurrency } from "./formatters";

// ==========================================
// 1. CÁLCULO DE RESERVAS FUTURAS
// ==========================================

export interface ReserveCalculationResult {
  reserve: FutureReserve;
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  percentage: number;
  monthsRemaining: number;
  monthlySuggestion: number;
  isCompleted: boolean;
}

export function calculateReserveProgress(
  reserve: FutureReserve,
  referenceDate = new Date()
): ReserveCalculationResult {
  const target = Math.max(0, Number(reserve.target_amount) || 0);
  const current = Math.max(0, Number(reserve.current_amount) || 0);
  const remaining = Math.max(0, target - current);
  const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 10000) / 100) : 0;
  const isCompleted = current >= target && target > 0;

  // Cálculo dos meses restantes
  let monthsRemaining = 1;
  if (reserve.target_date) {
    const targetDate = new Date(reserve.target_date + "T00:00:00");
    const diffYears = targetDate.getFullYear() - referenceDate.getFullYear();
    const diffMonths = targetDate.getMonth() - referenceDate.getMonth();
    const totalMonths = diffYears * 12 + diffMonths;
    monthsRemaining = Math.max(1, totalMonths);
  }

  // Sugestão mensal: valor restante / meses restantes
  const monthlySuggestion = isCompleted ? 0 : Math.round((remaining / monthsRemaining) * 100) / 100;

  return {
    reserve,
    targetAmount: target,
    currentAmount: current,
    remainingAmount: remaining,
    percentage,
    monthsRemaining,
    monthlySuggestion,
    isCompleted,
  };
}

// ==========================================
// 2. ORÇADO X REALIZADO X COMPROMETIDO
// ==========================================

export interface CategoryBudgetAnalysis {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  budgetAmount: number; // Orçado
  realizedAmount: number; // Realizado (efetivamente pago)
  committedAmount: number; // Comprometido (pendente ou compras no cartão a vencer)
  consumedAmount: number; // Realizado + Comprometido
  availableAmount: number; // Orçado - Realizado - Comprometido
  percentage: number; // Consumido / Orçado * 100
  status: "normal" | "warning" | "exceeded"; // normal (<80%), warning (80-99%), exceeded (>=100%)
  exceededAmount: number; // Se ultrapassou o orçamento
}

export function analyzeBudgetForMonth(params: {
  monthKey: string; // "YYYY-MM"
  budgets: Budget[];
  categories: { id: string; name: string; color?: string | null }[];
  transactions: Transaction[];
}): CategoryBudgetAnalysis[] {
  const { monthKey, budgets, categories, transactions } = params;

  // Filtrar orçamentos aplicáveis ao mês:
  // Se existir um específico para month_key, prevalece. Se não, usa o recorrente (month_key === null || is_recurring)
  const categoryBudgetMap = new Map<string, number>();

  for (const b of budgets) {
    if (b.month_key === monthKey) {
      categoryBudgetMap.set(b.category_id, b.amount);
    } else if (!b.month_key && b.is_recurring && !categoryBudgetMap.has(b.category_id)) {
      categoryBudgetMap.set(b.category_id, b.amount);
    }
  }

  // Agrupar transações de despesa do mês (pela data da transação ou competência)
  const realizedMap = new Map<string, number>();
  const committedMap = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.type !== "expense") continue;
    const catId = tx.category_id || "uncategorized";
    const txDate = tx.transaction_date || "";

    // Considera transações pertencentes a esse monthKey
    if (txDate.startsWith(monthKey)) {
      const amt = Number(tx.amount) || 0;
      if (tx.status === "paid") {
        realizedMap.set(catId, (realizedMap.get(catId) || 0) + amt);
      } else if (tx.status === "pending" || tx.status === "to_receive" || tx.status === "in_invoice") {
        committedMap.set(catId, (committedMap.get(catId) || 0) + amt);
      }
    }
  }

  const results: CategoryBudgetAnalysis[] = [];

  // Analisar cada categoria que possui orçamento cadastrado ou gastos
  const allCategoryIds = new Set<string>([
    ...Array.from(categoryBudgetMap.keys()),
  ]);

  for (const catId of allCategoryIds) {
    const budgetAmount = categoryBudgetMap.get(catId) || 0;
    const realizedAmount = Math.round((realizedMap.get(catId) || 0) * 100) / 100;
    const committedAmount = Math.round((committedMap.get(catId) || 0) * 100) / 100;
    const consumedAmount = Math.round((realizedAmount + committedAmount) * 100) / 100;
    const availableAmount = Math.round((budgetAmount - consumedAmount) * 100) / 100;
    const percentage = budgetAmount > 0 ? Math.round((consumedAmount / budgetAmount) * 10000) / 100 : 100;

    let status: "normal" | "warning" | "exceeded" = "normal";
    if (percentage >= 100) status = "exceeded";
    else if (percentage >= 80) status = "warning";

    const exceededAmount = consumedAmount > budgetAmount ? Math.round((consumedAmount - budgetAmount) * 100) / 100 : 0;
    const cat = categories.find((c) => c.id === catId);

    results.push({
      categoryId: catId,
      categoryName: cat?.name || "Sem categoria",
      categoryColor: cat?.color || "#64748b",
      budgetAmount,
      realizedAmount,
      committedAmount,
      consumedAmount,
      availableAmount,
      percentage,
      status,
      exceededAmount,
    });
  }

  return results.sort((a, b) => b.budgetAmount - a.budgetAmount);
}

// ==========================================
// 3. CÁLCULO DE METAS FINANCEIRAS
// ==========================================

export interface GoalCalculationResult {
  goal: FinancialGoal;
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  percentage: number;
  isCompleted: boolean;
}

export function calculateGoalProgress(goal: FinancialGoal): GoalCalculationResult {
  const target = Math.max(0, Number(goal.target_amount) || 0);
  const current = Math.max(0, Number(goal.current_amount) || 0);
  const remaining = Math.max(0, target - current);
  const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 10000) / 100) : 0;
  const isCompleted = current >= target && target > 0;

  return {
    goal,
    targetAmount: target,
    currentAmount: current,
    remainingAmount: remaining,
    percentage,
    isCompleted,
  };
}

// ==========================================
// 4. SALDO LIVRE ESTIMADO
// ==========================================

export interface FreeBalanceAnalysis {
  usableAccountBalance: number;
  knownCommitments: number;
  reservedFunds: number;
  estimatedFreeBalance: number;
  nextKnownIncome?: {
    description: string;
    date: string;
    amount: number;
  } | null;
  hasRisk: boolean;
}

export function calculateFreeBalance(params: {
  accounts: Account[];
  accountBalances: { [id: string]: number };
  monthlyCommitments: MonthlyCommitmentSummary[];
  reserves: FutureReserve[];
  goals: FinancialGoal[];
  transactions: Transaction[];
  todayString: string; // "YYYY-MM-DD"
}): FreeBalanceAnalysis {
  const {
    accounts,
    accountBalances,
    monthlyCommitments,
    reserves,
    goals,
    transactions,
    todayString,
  } = params;

  // 1. Saldo disponível em contas ativas (excluindo investimentos se houver regra, mas somando contas líquidas)
  let usableAccountBalance = 0;
  for (const acc of accounts) {
    if (acc.is_active) {
      usableAccountBalance += accountBalances[acc.id] || 0;
    }
  }

  // 2. Compromissos do mês corrente
  const currentMonthKey = todayString.slice(0, 7);
  const currentMonthSummary = monthlyCommitments.find((m) => m.monthKey === currentMonthKey);
  const knownCommitments = currentMonthSummary?.totalCommitted || 0;

  // 3. Valores alocados em reservas e metas (fundos guardados que não devem ser gastos)
  let reservedFunds = 0;
  for (const r of reserves) {
    if (r.status === "active") {
      reservedFunds += Number(r.current_amount) || 0;
    }
  }
  for (const g of goals) {
    if (g.status === "active") {
      reservedFunds += Number(g.current_amount) || 0;
    }
  }

  // Saldo livre = Saldo em contas - Compromissos do período - Valores reservados
  const estimatedFreeBalance = Math.round((usableAccountBalance - knownCommitments - reservedFunds) * 100) / 100;

  // 4. Buscar próxima receita futura real cadastrada (se houver)
  const futureIncomes = transactions
    .filter(
      (t) =>
        t.type === "income" &&
        (t.status === "pending" || t.status === "to_receive") &&
        t.due_date &&
        t.due_date >= todayString
    )
    .sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""));

  const nextIncome = futureIncomes[0]
    ? {
        description: futureIncomes[0].description,
        date: futureIncomes[0].due_date!,
        amount: Number(futureIncomes[0].amount) || 0,
      }
    : null;

  return {
    usableAccountBalance: Math.round(usableAccountBalance * 100) / 100,
    knownCommitments: Math.round(knownCommitments * 100) / 100,
    reservedFunds: Math.round(reservedFunds * 100) / 100,
    estimatedFreeBalance,
    nextKnownIncome: nextIncome,
    hasRisk: estimatedFreeBalance < 0,
  };
}

// ==========================================
// 5. GERADOR DE ALERTAS FINANCEIROS REAIS
// ==========================================

export function generateFinancialAlerts(params: {
  transactions: Transaction[];
  invoices: CreditCardInvoice[];
  budgets: Budget[];
  categories: { id: string; name: string; color?: string | null }[];
  reserves: FutureReserve[];
  goals: FinancialGoal[];
  freeBalance: FreeBalanceAnalysis;
  todayString: string; // "YYYY-MM-DD"
  dismissedAlertIds?: string[];
}): FinancialAlert[] {
  const {
    transactions,
    invoices,
    budgets,
    categories,
    reserves,
    goals,
    freeBalance,
    todayString,
    dismissedAlertIds = [],
  } = params;

  const dismissedSet = new Set(dismissedAlertIds);
  const alerts: FinancialAlert[] = [];

  // Regra 1: Contas vencidas (Crítico)
  const overdueExpenses = transactions.filter(
    (t) =>
      t.type === "expense" &&
      (t.status === "pending" || t.status === "to_receive") &&
      t.due_date &&
      t.due_date < todayString
  );

  for (const exp of overdueExpenses) {
    const id = `overdue-expense-${exp.id}`;
    if (!dismissedSet.has(id)) {
      alerts.push({
        id,
        title: "Conta vencida",
        description: `${exp.description} venceu em ${exp.due_date}. Valor: ${formatCurrency(exp.amount)}.`,
        priority: "critical",
        category: "overdue",
        amount: exp.amount,
        actionLabel: "Ver lançamentos",
        linkTab: "Lançamentos",
      });
    }
  }

  // Regra 2: Faturas vencidas ou próximas do vencimento (<= 3 dias)
  const today = new Date(todayString + "T00:00:00");
  for (const inv of invoices) {
    if (inv.status === "paid" || inv.total_amount <= 0) continue;

    const dueDate = new Date(inv.due_date + "T00:00:00");
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const id = `overdue-invoice-${inv.id}`;
      if (!dismissedSet.has(id)) {
        alerts.push({
          id,
          title: "Fatura de cartão vencida",
          description: `Fatura vencida em ${inv.due_date}. Total: ${formatCurrency(inv.total_amount)}.`,
          priority: "critical",
          category: "invoice_due",
          amount: inv.total_amount,
          actionLabel: "Pagar fatura",
          linkTab: "Cartões",
        });
      }
    } else if (diffDays <= 3) {
      const id = `invoice-due-soon-${inv.id}-${inv.due_date}`;
      if (!dismissedSet.has(id)) {
        alerts.push({
          id,
          title: "Fatura próxima do vencimento",
          description: `Fatura vence em ${diffDays === 0 ? "hoje" : `${diffDays} dia(s)`}. Total: ${formatCurrency(inv.total_amount)}.`,
          priority: "warning",
          category: "invoice_due",
          amount: inv.total_amount,
          actionLabel: "Pagar fatura",
          linkTab: "Cartões",
        });
      }
    }
  }

  // Regra 3: Orçamento estourado ou acima de 80% (Atenção)
  const currentMonthKey = todayString.slice(0, 7);
  const budgetAnalysis = analyzeBudgetForMonth({
    monthKey: currentMonthKey,
    budgets,
    categories,
    transactions,
  });

  for (const b of budgetAnalysis) {
    if (b.status === "exceeded") {
      const id = `budget-exceeded-${b.categoryId}-${currentMonthKey}`;
      if (!dismissedSet.has(id)) {
        alerts.push({
          id,
          title: "Orçamento estourado",
          description: `${b.categoryName} ultrapassou o teto planejado em ${formatCurrency(b.exceededAmount)} (${b.percentage}% utilizado).`,
          priority: "warning",
          category: "budget",
          actionLabel: "Ver orçamentos",
          linkTab: "Planejamento",
        });
      }
    } else if (b.status === "warning") {
      const id = `budget-warning-${b.categoryId}-${currentMonthKey}`;
      if (!dismissedSet.has(id)) {
        alerts.push({
          id,
          title: "Atenção ao orçamento",
          description: `${b.categoryName} atingiu ${Math.round(b.percentage)}% do teto mensal (${formatCurrency(b.consumedAmount)} de ${formatCurrency(b.budgetAmount)}).`,
          priority: "warning",
          category: "budget",
          actionLabel: "Ver orçamentos",
          linkTab: "Planejamento",
        });
      }
    }
  }

  // Regra 4: Saldo livre negativo / sob risco (Atenção)
  if (freeBalance.hasRisk) {
    const id = `free-balance-risk-${currentMonthKey}`;
    if (!dismissedSet.has(id)) {
      alerts.push({
        id,
        title: "Saldo livre sob pressão",
        description: `Os compromissos e reservas atuais excedem o saldo disponível em contas por ${formatCurrency(Math.abs(freeBalance.estimatedFreeBalance))}.`,
        priority: "warning",
        category: "free_balance",
        actionLabel: "Ver compromissos",
        linkTab: "Planejamento",
      });
    }
  }

  // Regra 5: Meta atingida (Informativo)
  for (const g of goals) {
    if (g.status === "active" && g.current_amount >= g.target_amount && g.target_amount > 0) {
      const id = `goal-achieved-${g.id}`;
      if (!dismissedSet.has(id)) {
        alerts.push({
          id,
          title: "Meta atingida",
          description: `Parabéns! Você alcançou o objetivo de ${formatCurrency(g.target_amount)} para "${g.name}".`,
          priority: "info",
          category: "goal",
          actionLabel: "Ver metas",
          linkTab: "Planejamento",
        });
      }
    }
  }

  // Ordenar: Críticos primeiro, depois Avisos, depois Informativos
  const priorityOrder: Record<FinancialAlertPriority, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };

  return alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}
