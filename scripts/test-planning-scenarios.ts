import {
  calculateReserveProgress,
  analyzeBudgetForMonth,
  calculateGoalProgress,
  calculateFreeBalance,
  generateFinancialAlerts,
} from "../lib/planning-service";
import type {
  FutureReserve,
  Budget,
  FinancialGoal,
  Transaction,
  CreditCardInvoice,
  MonthlyCommitmentSummary,
  Account,
} from "../lib/types";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

console.log("=== INICIANDO SUÍTE DE TESTES DETERMINÍSTICOS — PLANEJAMENTO FINANCEIRO ===");

// ==========================================
// 1. CENÁRIO 54: RESERVA FUTURA (IPVA)
// ==========================================
console.log("\n--- TESTE 1: Cenário Reserva Futura (IPVA) ---");
const testReserve: FutureReserve = {
  id: "res_ipva",
  user_id: "user_test",
  name: "IPVA 2027",
  target_amount: 2400,
  target_date: "2027-10-05", // 12 meses à frente de 2026-10-05
  current_amount: 0,
  status: "active",
  created_at: new Date().toISOString(),
};

const refDate = new Date("2026-10-05T00:00:00");
const resCalcInitial = calculateReserveProgress(testReserve, refDate);

assert(resCalcInitial.targetAmount === 2400, "Valor objetivo da reserva deve ser R$ 2.400");
assert(resCalcInitial.monthsRemaining === 12, "Prazo calculado deve ser 12 meses");
assert(resCalcInitial.monthlySuggestion === 200, "Sugestão mensal inicial deve ser R$ 200/mês");
assert(resCalcInitial.percentage === 0, "Percentual inicial deve ser 0%");

// Simular aporte de R$ 400
const testReserveAfter400: FutureReserve = {
  ...testReserve,
  current_amount: 400,
};
const resCalcAfter400 = calculateReserveProgress(testReserveAfter400, refDate);

assert(resCalcAfter400.currentAmount === 400, "Valor reservado após aporte deve ser R$ 400");
assert(resCalcAfter400.remainingAmount === 2000, "Restante deve ser R$ 2.000");
assert(Math.abs(resCalcAfter400.percentage - 16.67) < 0.01, "Percentual deve ser 16,67%");
assert(Math.abs(resCalcAfter400.monthlySuggestion - 166.67) < 0.01, "Sugestão recalculada: R$ 2.000 / 12 = R$ 166,67");

// ==========================================
// 2. CENÁRIO 55: ORÇAMENTO (ALIMENTAÇÃO)
// ==========================================
console.log("\n--- TESTE 2: Cenário Orçado x Realizado x Comprometido (Alimentação) ---");
const testBudgets: Budget[] = [
  {
    id: "bg_food",
    user_id: "user_test",
    category_id: "cat_food",
    amount: 1500,
    month_key: "2026-10",
    is_recurring: true,
    created_at: new Date().toISOString(),
  },
];

const testCategories = [
  { id: "cat_food", name: "Alimentação", color: "#f97316" },
];

const testTransactions: Transaction[] = [
  // R$ 930 pagos
  {
    id: "tx_1",
    user_id: "user_test",
    description: "Supermercado Pago",
    amount: 930,
    type: "expense",
    status: "paid",
    transaction_date: "2026-10-10",
    category_id: "cat_food",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // R$ 220 comprometidos (compra no cartão ou pendente)
  {
    id: "tx_2",
    user_id: "user_test",
    description: "Restaurante no cartão",
    amount: 220,
    type: "expense",
    status: "in_invoice",
    transaction_date: "2026-10-15",
    category_id: "cat_food",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const budgetAnalysis = analyzeBudgetForMonth({
  monthKey: "2026-10",
  budgets: testBudgets,
  categories: testCategories,
  transactions: testTransactions,
});

assert(budgetAnalysis.length === 1, "Deve conter 1 análise de categoria");
const foodAnalysis = budgetAnalysis[0];

assert(foodAnalysis.budgetAmount === 1500, "Orçado deve ser R$ 1.500");
assert(foodAnalysis.realizedAmount === 930, "Realizado (pago) deve ser R$ 930");
assert(foodAnalysis.committedAmount === 220, "Comprometido deve ser R$ 220");
assert(foodAnalysis.consumedAmount === 1150, "Consumido total (930 + 220) deve ser R$ 1.150");
assert(foodAnalysis.availableAmount === 350, "Disponível (1500 - 1150) deve ser R$ 350");
assert(Math.abs(foodAnalysis.percentage - 76.67) < 0.01, "Percentual deve ser 76,67%");
assert(foodAnalysis.status === "normal", "Status deve ser normal (< 80%)");

// ==========================================
// 3. CENÁRIO 56: METAS FINANCEIRAS
// ==========================================
console.log("\n--- TESTE 3: Cenário Metas Financeiras (Reserva de Emergência) ---");
const testGoal: FinancialGoal = {
  id: "goal_emerg",
  user_id: "user_test",
  name: "Reserva de emergência",
  target_amount: 20000,
  current_amount: 8600,
  status: "active",
  created_at: new Date().toISOString(),
};

const goalCalc = calculateGoalProgress(testGoal);

assert(goalCalc.targetAmount === 20000, "Objetivo da meta deve ser R$ 20.000");
assert(goalCalc.currentAmount === 8600, "Reservado acumulado deve ser R$ 8.600");
assert(goalCalc.remainingAmount === 11400, "Restante deve ser R$ 11.400");
assert(goalCalc.percentage === 43, "Progresso deve ser exatamente 43%");
assert(goalCalc.isCompleted === false, "Meta não deve estar concluída");

// ==========================================
// 4. CENÁRIO: SALDO LIVRE ESTIMADO
// ==========================================
console.log("\n--- TESTE 4: Cenário Saldo Livre Estimado ---");
const testAccounts: Account[] = [
  {
    id: "acc_1",
    user_id: "user_test",
    name: "Conta Corrente",
    type: "checking",
    opening_balance: 5000,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "acc_2",
    user_id: "user_test",
    name: "Poupança",
    type: "savings",
    opening_balance: 3430,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const testAccountBalances = {
  acc_1: 5000,
  acc_2: 3430, // Total em contas: R$ 8.430
};

const testCommitments: MonthlyCommitmentSummary[] = [
  {
    monthKey: "2026-10",
    monthLabel: "OUT/2026",
    totalCommitted: 4120, // Compromissos conhecidos: R$ 4.120
    fixedTotal: 1000,
    creditCardTotal: 3120,
    loanTotal: 0,
    otherPendingTotal: 0,
    items: [],
  },
];

const testReservesList: FutureReserve[] = [
  {
    id: "res_1",
    user_id: "user_test",
    name: "Reserva IPVA",
    target_amount: 2400,
    target_date: "2027-01-15",
    current_amount: 1000, // Alocado em reserva: R$ 1.000
    status: "active",
    created_at: new Date().toISOString(),
  },
];

const freeBalanceCalc = calculateFreeBalance({
  accounts: testAccounts,
  accountBalances: testAccountBalances,
  monthlyCommitments: testCommitments,
  reserves: testReservesList,
  goals: [],
  transactions: [],
  todayString: "2026-10-05",
});

assert(freeBalanceCalc.usableAccountBalance === 8430, "Saldo total em contas deve ser R$ 8.430");
assert(freeBalanceCalc.knownCommitments === 4120, "Compromissos conhecidos devem ser R$ 4.120");
assert(freeBalanceCalc.reservedFunds === 1000, "Fundos reservados devem ser R$ 1.000");
assert(freeBalanceCalc.estimatedFreeBalance === 3310, "Saldo livre estimado (8430 - 4120 - 1000) deve ser R$ 3.310");
assert(freeBalanceCalc.hasRisk === false, "Não deve haver risco de liquidez");

// ==========================================
// 5. CENÁRIO: ALERTAS FINANCEIROS REAIS
// ==========================================
console.log("\n--- TESTE 5: Alertas Financeiros Determinísticos ---");
const testOverdueTx: Transaction = {
  id: "tx_overdue",
  user_id: "user_test",
  description: "Conta de Energia",
  amount: 420,
  type: "expense",
  status: "pending",
  transaction_date: "2026-10-01",
  due_date: "2026-10-04", // Venceu ontem (hoje é 2026-10-05)
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const testInvoices: CreditCardInvoice[] = [
  {
    id: "inv_nubank",
    user_id: "user_test",
    credit_card_id: "card_1",
    reference_month: "2026-10",
    closing_date: "2026-10-02",
    due_date: "2026-10-07", // Vence em 2 dias
    total_amount: 1840.5,
    status: "open",
    created_at: new Date().toISOString(),
  },
];

const alerts = generateFinancialAlerts({
  transactions: [testOverdueTx],
  invoices: testInvoices,
  budgets: testBudgets,
  categories: testCategories,
  reserves: testReservesList,
  goals: [testGoal],
  freeBalance: freeBalanceCalc,
  todayString: "2026-10-05",
});

assert(alerts.length >= 2, "Devem ser gerados pelo menos 2 alertas reais");
const critAlert = alerts.find((a) => a.category === "overdue");
const invoiceAlert = alerts.find((a) => a.category === "invoice_due");

assert(!!critAlert && critAlert.priority === "critical", "Conta vencida deve gerar alerta crítico");
assert(!!invoiceAlert && invoiceAlert.priority === "warning", "Fatura em 2 dias deve gerar alerta de atenção");

console.log("\n=======================================================");
console.log("🎉 TODOS OS TESTES DETERMINÍSTICOS PASSARAM COM SUCESSO!");
console.log("=======================================================\n");
