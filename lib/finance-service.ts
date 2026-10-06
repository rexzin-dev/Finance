import type {
  Account,
  Category,
  CreditCard,
  Transaction,
  Loan,
  UserProfile,
  CreditCardPurchase,
  Installment,
  CreditCardInvoice,
  RecurringTransaction,
  MonthlyCommitmentSummary,
  MonthlyCommitmentItem,
} from "./types";
import {
  calculateInvoiceSchedule,
  splitInstallmentAmounts,
  formatMonthNameYear,
} from "./credit-card-utils";
import { addMonths, format } from "date-fns";
import { getSupabaseBrowserClient } from "./supabase/client";
export { getSupabaseBrowserClient };

const STORAGE_KEY_PREFIX = "fluxo_app_v1_";

function getStorageKey(key: string, userId: string) {
  return `${STORAGE_KEY_PREFIX}${userId}_${key}`;
}

export function getCurrentUser(): UserProfile {
  if (typeof window === "undefined") {
    return { id: "user_default", email: "usuario@fluxo.app", full_name: "Usuário Fluxo", role: "admin" };
  }
  try {
    const raw = localStorage.getItem("fluxo_current_user");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { id: "user_default", email: "usuario@fluxo.app", full_name: "Usuário Fluxo", role: "admin" };
}

export function setCurrentUser(user: UserProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem("fluxo_current_user", JSON.stringify(user));
}

function loadItems<T>(collection: string, userId: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(collection, userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems<T>(collection: string, userId: string, items: T[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(collection, userId), JSON.stringify(items));
}

// ----------------- ACCOUNTS -----------------
export function getAccounts(userId: string): Account[] {
  return loadItems<Account>("accounts", userId);
}

export function saveAccount(
  userId: string,
  data: Omit<Account, "id" | "user_id" | "created_at"> & { id?: string }
): Account {
  const current = getAccounts(userId);
  if (data.id) {
    const updated = current.map((a) => (a.id === data.id ? { ...a, ...data } : a));
    saveItems("accounts", userId, updated);
    return updated.find((a) => a.id === data.id)!;
  }
  const newAccount: Account = {
    ...data,
    id: crypto.randomUUID ? crypto.randomUUID() : `acc_${Date.now()}`,
    user_id: userId,
    created_at: new Date().toISOString(),
  };
  saveItems("accounts", userId, [...current, newAccount]);
  return newAccount;
}

export function deleteAccount(userId: string, id: string): boolean {
  const current = getAccounts(userId);
  const filtered = current.filter((a) => a.id !== id);
  saveItems("accounts", userId, filtered);
  return true;
}

// ----------------- CATEGORIES -----------------
export function getCategories(userId: string): Category[] {
  const custom = loadItems<Category>("categories", userId);
  if (custom.length > 0) return custom;
  const defaults: Category[] = [
    { id: "cat_salario", user_id: userId, name: "Salário", kind: "income", color: "#16a34a", icon: "Wallet", created_at: new Date().toISOString() },
    { id: "cat_investimentos", user_id: userId, name: "Rendimentos", kind: "income", color: "#0d9488", icon: "TrendingUp", created_at: new Date().toISOString() },
    { id: "cat_alimentacao", user_id: userId, name: "Alimentação", kind: "expense", color: "#ea580c", icon: "Utensils", created_at: new Date().toISOString() },
    { id: "cat_moradia", user_id: userId, name: "Moradia", kind: "expense", color: "#2563eb", icon: "Home", created_at: new Date().toISOString() },
    { id: "cat_transporte", user_id: userId, name: "Transporte", kind: "expense", color: "#0891b2", icon: "Car", created_at: new Date().toISOString() },
    { id: "cat_lazer", user_id: userId, name: "Lazer & Cultura", kind: "expense", color: "#8b5cf6", icon: "Film", created_at: new Date().toISOString() },
    { id: "cat_saude", user_id: userId, name: "Saúde & Cuidados", kind: "expense", color: "#e11d48", icon: "HeartPulse", created_at: new Date().toISOString() },
    { id: "cat_educacao", user_id: userId, name: "Educação", kind: "expense", color: "#4f46e5", icon: "GraduationCap", created_at: new Date().toISOString() },
    { id: "cat_fatura", user_id: userId, name: "Fatura de Cartão", kind: "expense", color: "#3157a8", icon: "CreditCard", created_at: new Date().toISOString() },
    { id: "cat_outros", user_id: userId, name: "Outros", kind: null, color: "#64748b", icon: "Tag", created_at: new Date().toISOString() },
  ];
  saveItems("categories", userId, defaults);
  return defaults;
}

export function saveCategory(
  userId: string,
  data: Omit<Category, "id" | "user_id" | "created_at"> & { id?: string }
): Category {
  const current = getCategories(userId);
  if (data.id) {
    const updated = current.map((c) => (c.id === data.id ? { ...c, ...data } : c));
    saveItems("categories", userId, updated);
    return updated.find((c) => c.id === data.id)!;
  }
  const newCat: Category = {
    ...data,
    id: crypto.randomUUID ? crypto.randomUUID() : `cat_${Date.now()}`,
    user_id: userId,
    created_at: new Date().toISOString(),
  };
  saveItems("categories", userId, [...current, newCat]);
  return newCat;
}

export function deleteCategory(userId: string, id: string): boolean {
  const current = getCategories(userId);
  const filtered = current.filter((c) => c.id !== id);
  saveItems("categories", userId, filtered);
  return true;
}

// ----------------- CREDIT CARDS -----------------
export function getCreditCards(userId: string): CreditCard[] {
  return loadItems<CreditCard>("credit_cards", userId);
}

export function saveCreditCard(
  userId: string,
  data: Omit<CreditCard, "id" | "user_id" | "created_at"> & { id?: string }
): CreditCard {
  const current = getCreditCards(userId);
  if (data.id) {
    const updated = current.map((c) => (c.id === data.id ? { ...c, ...data } : c));
    saveItems("credit_cards", userId, updated);
    return updated.find((c) => c.id === data.id)!;
  }
  const newCard: CreditCard = {
    ...data,
    id: crypto.randomUUID ? crypto.randomUUID() : `card_${Date.now()}`,
    user_id: userId,
    created_at: new Date().toISOString(),
  };
  saveItems("credit_cards", userId, [...current, newCard]);
  return newCard;
}

export function deleteCreditCard(userId: string, id: string): boolean {
  const current = getCreditCards(userId);
  const filtered = current.filter((c) => c.id !== id);
  saveItems("credit_cards", userId, filtered);
  return true;
}

// ----------------- CREDIT CARD PURCHASES & INSTALLMENTS -----------------
export function getCreditCardPurchases(userId: string): CreditCardPurchase[] {
  return loadItems<CreditCardPurchase>("credit_card_purchases", userId);
}

export function getInstallments(userId: string): Installment[] {
  return loadItems<Installment>("installments", userId);
}

export function getCreditCardInvoices(userId: string): CreditCardInvoice[] {
  return loadItems<CreditCardInvoice>("credit_card_invoices", userId);
}

/**
 * Cria ou atualiza uma compra com cartão de crédito,
 * calculando todas as parcelas e relacionando às faturas.
 */
export function recordCreditCardPurchase(
  userId: string,
  params: {
    credit_card_id: string;
    description: string;
    category_id?: string | null;
    purchase_date: string;
    total_amount: number;
    payment_type: "cash" | "installment";
    installments_count: number;
    notes?: string | null;
  }
) {
  const cards = getCreditCards(userId);
  const card = cards.find((c) => c.id === params.credit_card_id);
  if (!card) throw new Error("Cartão de crédito não encontrado.");

  const purchaseId = crypto.randomUUID ? crypto.randomUUID() : `pur_${Date.now()}`;
  const now = new Date().toISOString();

  const purchase: CreditCardPurchase = {
    id: purchaseId,
    user_id: userId,
    credit_card_id: card.id,
    description: params.description,
    category_id: params.category_id || null,
    purchase_date: params.purchase_date,
    total_amount: params.total_amount,
    payment_type: params.payment_type,
    installments_count: params.payment_type === "cash" ? 1 : Math.max(1, params.installments_count),
    notes: params.notes || null,
    created_at: now,
  };

  const count = purchase.installments_count;
  const amounts = splitInstallmentAmounts(purchase.total_amount, count);

  const existingInstallments = getInstallments(userId);
  const newInstallments: Installment[] = [];

  for (let i = 0; i < count; i++) {
    const schedule = calculateInvoiceSchedule(
      purchase.purchase_date,
      card.closing_day,
      card.due_day,
      i
    );

    newInstallments.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `inst_${Date.now()}_${i}`,
      user_id: userId,
      purchase_id: purchase.id,
      credit_card_id: card.id,
      installment_number: i + 1,
      total_installments: count,
      amount: amounts[i],
      competence_month: schedule.referenceMonth,
      due_date: schedule.dueDate,
      description:
        count > 1
          ? `${purchase.description} (${String(i + 1).padStart(2, "0")}/${String(count).padStart(2, "0")})`
          : purchase.description,
      category_id: purchase.category_id,
      created_at: now,
    });
  }

  // Salvar compra e parcelas
  const purchases = getCreditCardPurchases(userId);
  saveItems("credit_card_purchases", userId, [purchase, ...purchases]);
  saveItems("installments", userId, [...newInstallments, ...existingInstallments]);

  // Sincronizar faturas do cartão
  syncCardInvoices(userId, card.id);

  return { purchase, installments: newInstallments };
}

export function deleteCreditCardPurchase(userId: string, purchaseId: string) {
  const purchases = getCreditCardPurchases(userId);
  const currentPurchase = purchases.find((p) => p.id === purchaseId);
  if (!currentPurchase) return false;

  const filteredPurchases = purchases.filter((p) => p.id !== purchaseId);
  saveItems("credit_card_purchases", userId, filteredPurchases);

  const installments = getInstallments(userId).filter((i) => i.purchase_id !== purchaseId);
  saveItems("installments", userId, installments);

  syncCardInvoices(userId, currentPurchase.credit_card_id);
  return true;
}

/**
 * Agrupa as parcelas do cartão em faturas de referência mensal (reference_month)
 */
export function syncCardInvoices(userId: string, cardId: string) {
  const cards = getCreditCards(userId);
  const card = cards.find((c) => c.id === cardId);
  if (!card) return;

  const installments = getInstallments(userId).filter((i) => i.credit_card_id === cardId);
  const existingInvoices = getCreditCardInvoices(userId);

  // Mapear total por mês de competência
  const map = new Map<string, { total: number; dueDate: string; closingDate: string }>();

  for (const inst of installments) {
    const cur = map.get(inst.competence_month) || {
      total: 0,
      dueDate: inst.due_date,
      closingDate: inst.due_date, // calculado abaixo
    };
    cur.total += Number(inst.amount) || 0;
    map.set(inst.competence_month, cur);
  }

  const updatedInvoices: CreditCardInvoice[] = [];
  const cardInvoices = existingInvoices.filter((inv) => inv.credit_card_id === cardId);
  const otherInvoices = existingInvoices.filter((inv) => inv.credit_card_id !== cardId);

  for (const [refMonth, val] of map.entries()) {
    const existing = cardInvoices.find((inv) => inv.reference_month === refMonth);
    // Calcular dia de fechamento real para o mês
    const schedule = calculateInvoiceSchedule(`${refMonth}-01`, card.closing_day, card.due_day, 0);

    if (existing) {
      updatedInvoices.push({
        ...existing,
        total_amount: Math.round(val.total * 100) / 100,
        due_date: schedule.dueDate,
        closing_date: schedule.closingDate,
      });
    } else {
      updatedInvoices.push({
        id: crypto.randomUUID ? crypto.randomUUID() : `inv_${Date.now()}_${refMonth}`,
        user_id: userId,
        credit_card_id: cardId,
        reference_month: refMonth,
        closing_date: schedule.closingDate,
        due_date: schedule.dueDate,
        total_amount: Math.round(val.total * 100) / 100,
        status: "open",
        created_at: new Date().toISOString(),
      });
    }
  }

  saveItems("credit_card_invoices", userId, [...updatedInvoices, ...otherInvoices]);
}

/**
 * Paga uma fatura de cartão de crédito:
 * Deduz da conta bancária especificada e marca a fatura como "paid".
 */
export function payCreditCardInvoice(
  userId: string,
  invoiceId: string,
  params: { payment_account_id: string; payment_date: string; amount?: number }
) {
  const invoices = getCreditCardInvoices(userId);
  const inv = invoices.find((i) => i.id === invoiceId);
  if (!inv) throw new Error("Fatura não encontrada.");

  const payAmount = params.amount ?? inv.total_amount;
  const cards = getCreditCards(userId);
  const card = cards.find((c) => c.id === inv.credit_card_id);
  const cardName = card ? card.name : "Cartão";

  // Atualizar status da fatura
  const updatedInv: CreditCardInvoice = {
    ...inv,
    status: "paid",
    payment_account_id: params.payment_account_id,
    payment_date: params.payment_date,
  };
  saveItems(
    "credit_card_invoices",
    userId,
    invoices.map((i) => (i.id === invoiceId ? updatedInv : i))
  );

  // Registrar a transação de pagamento da fatura na conta (liquidação financeira)
  // Marcada com payment_method = "Boleto" / "Débito" e tipo "expense" para deduzir o saldo
  const accounts = getAccounts(userId);
  const account = accounts.find((a) => a.id === params.payment_account_id);

  saveTransaction(userId, {
    description: `Pagamento fatura ${cardName} (${formatMonthNameYear(inv.reference_month)})`,
    amount: payAmount,
    type: "expense",
    status: "paid",
    transaction_date: params.payment_date,
    due_date: inv.due_date,
    account_id: params.payment_account_id,
    payment_method: "Débito automático",
    credit_card_id: inv.credit_card_id,
    invoice_id: inv.id,
    notes: `Liquidação da fatura referente a ${inv.reference_month}`,
  });

  return updatedInv;
}

// ----------------- RECURRING TRANSACTIONS -----------------
export function getRecurringTransactions(userId: string): RecurringTransaction[] {
  return loadItems<RecurringTransaction>("recurring_transactions", userId);
}

export function saveRecurringTransaction(
  userId: string,
  data: Omit<RecurringTransaction, "id" | "user_id" | "created_at"> & { id?: string }
): RecurringTransaction {
  const current = getRecurringTransactions(userId);
  if (data.id) {
    const updated = current.map((r) => (r.id === data.id ? { ...r, ...data } : r));
    saveItems("recurring_transactions", userId, updated);
    return updated.find((r) => r.id === data.id)!;
  }
  const newRec: RecurringTransaction = {
    ...data,
    id: crypto.randomUUID ? crypto.randomUUID() : `rec_${Date.now()}`,
    user_id: userId,
    created_at: new Date().toISOString(),
  };
  saveItems("recurring_transactions", userId, [...current, newRec]);
  return newRec;
}

export function deleteRecurringTransaction(userId: string, id: string): boolean {
  const current = getRecurringTransactions(userId);
  const filtered = current.filter((r) => r.id !== id);
  saveItems("recurring_transactions", userId, filtered);
  return true;
}

// ----------------- LOANS -----------------
export function getLoans(userId: string): Loan[] {
  return loadItems<Loan>("loans", userId);
}

export function saveLoan(
  userId: string,
  data: Omit<Loan, "id" | "user_id" | "created_at"> & { id?: string }
): Loan {
  const current = getLoans(userId);
  if (data.id) {
    const updated = current.map((l) => (l.id === data.id ? { ...l, ...data } : l));
    saveItems("loans", userId, updated);
    return updated.find((l) => l.id === data.id)!;
  }
  const newLoan: Loan = {
    ...data,
    id: crypto.randomUUID ? crypto.randomUUID() : `loan_${Date.now()}`,
    user_id: userId,
    created_at: new Date().toISOString(),
  };
  saveItems("loans", userId, [...current, newLoan]);
  return newLoan;
}

export function deleteLoan(userId: string, id: string): boolean {
  const current = getLoans(userId);
  const filtered = current.filter((l) => l.id !== id);
  saveItems("loans", userId, filtered);
  return true;
}

export function payLoanInstallment(userId: string, loanId: string): Loan | null {
  const current = getLoans(userId);
  const loan = current.find((l) => l.id === loanId);
  if (!loan) return null;

  const nextPaid = loan.paid_installments + 1;
  const newRemaining = Math.max(0, loan.remaining_amount - loan.installment_value);
  const isCompleted = nextPaid >= loan.total_installments || newRemaining <= 0;

  const updated: Loan = {
    ...loan,
    paid_installments: nextPaid,
    remaining_amount: newRemaining,
    status: isCompleted ? "completed" : "active",
  };

  saveItems("loans", userId, current.map((l) => (l.id === loanId ? updated : l)));
  return updated;
}

// ----------------- TRANSACTIONS -----------------
export function getTransactions(userId: string): Transaction[] {
  const txs = loadItems<Transaction>("transactions", userId);
  const accounts = getAccounts(userId);
  const categories = getCategories(userId);
  const cards = getCreditCards(userId);

  return txs.map((tx) => {
    const acc = accounts.find((a) => a.id === tx.account_id);
    const cat = categories.find((c) => c.id === tx.category_id);
    const card = cards.find((c) => c.id === tx.credit_card_id);
    return {
      ...tx,
      account_name: acc ? acc.name : tx.account_name,
      category_name: cat ? cat.name : tx.category_name,
      category_color: cat ? cat.color ?? undefined : tx.category_color,
      credit_card_name: card ? card.name : tx.credit_card_name,
    };
  });
}

export function saveTransaction(
  userId: string,
  data: Omit<Transaction, "id" | "user_id" | "created_at" | "updated_at"> & { id?: string }
): Transaction {
  const current = getTransactions(userId);
  const now = new Date().toISOString();

  if (data.id) {
    const updated = current.map((t) => (t.id === data.id ? { ...t, ...data, updated_at: now } : t));
    saveItems("transactions", userId, updated);
    return updated.find((t) => t.id === data.id)!;
  }

  const newTx: Transaction = {
    ...data,
    id: crypto.randomUUID ? crypto.randomUUID() : `tx_${Date.now()}`,
    user_id: userId,
    created_at: now,
    updated_at: now,
  };
  saveItems("transactions", userId, [newTx, ...current]);
  return newTx;
}

export function deleteTransaction(userId: string, id: string): boolean {
  const current = getTransactions(userId);
  const tx = current.find((t) => t.id === id);

  // Se a transação estiver associada a uma compra de cartão, remover compra e parcelas
  if (tx && tx.purchase_id) {
    deleteCreditCardPurchase(userId, tx.purchase_id);
  }

  const filtered = current.filter((t) => t.id !== id);
  saveItems("transactions", userId, filtered);
  return true;
}

// ----------------- FINANCIAL BALANCES & CALCULATIONS -----------------
/**
 * Saldo realizado:
 * - Apenas transações com status "paid" ou "received" afetam o saldo bancário.
 * - Compras de cartão de crédito (status "in_invoice") NÃO deduzem a conta bancária imediatamente.
 * - O pagamento da fatura (que possui account_id e status "paid") é quem deduz da conta bancária.
 */
export function calculateAccountBalances(userId: string): { [accountId: string]: number } {
  const accounts = getAccounts(userId);
  const txs = getTransactions(userId);

  const balances: { [accountId: string]: number } = {};
  for (const acc of accounts) {
    balances[acc.id] = Number(acc.opening_balance) || 0;
  }

  for (const tx of txs) {
    const amt = Number(tx.amount) || 0;
    const isRealized = tx.status === "paid" || tx.status === "received";

    if (isRealized && tx.account_id && balances[tx.account_id] !== undefined) {
      if (tx.type === "income") {
        balances[tx.account_id] += amt;
      } else if (tx.type === "expense") {
        balances[tx.account_id] -= amt;
      } else if (tx.type === "transfer") {
        balances[tx.account_id] -= amt;
      }
    }

    if (
      isRealized &&
      tx.type === "transfer" &&
      tx.destination_account_id &&
      balances[tx.destination_account_id] !== undefined
    ) {
      balances[tx.destination_account_id] += amt;
    }
  }

  return balances;
}

export function calculateFinancialSummary(
  userId: string,
  startDate?: string,
  endDate?: string
) {
  const accounts = getAccounts(userId);
  const balances = calculateAccountBalances(userId);
  const totalBalance = accounts.reduce((acc, a) => acc + (balances[a.id] ?? 0), 0);

  const txs = getTransactions(userId);
  const filtered = txs.filter((t) => {
    if (startDate && t.transaction_date < startDate) return false;
    if (endDate && t.transaction_date > endDate) return false;
    return true;
  });

  let totalIncome = 0;
  let totalExpense = 0;

  for (const t of filtered) {
    const amt = Number(t.amount) || 0;
    if (t.type === "income" && (t.status === "paid" || t.status === "received")) {
      totalIncome += amt;
    } else if (t.type === "expense" && (t.status === "paid" || t.status === "received")) {
      totalExpense += amt;
    }
  }

  const result = totalIncome - totalExpense;

  return {
    totalBalance,
    totalIncome,
    totalExpense,
    result,
    transactionsCount: filtered.length,
  };
}

// ----------------- PREVISÃO REAL DE PAGAMENTOS (COMPROMISSOS MENSAIS) -----------------
/**
 * Calcula a previsão mensal REAL para os próximos N meses (padrão 3 ou 6).
 * Agrega estritamente:
 * 1. Parcelas de cartões de crédito pertencentes àquela competência/fatura aberta.
 * 2. Despesas recorrentes conhecidas (valor fixo; se variável sem valor, mostra item pendente sem valor).
 * 3. Parcelas de empréstimos ativos com vencimento no mês.
 * 4. Contas pendentes conhecidas com vencimento no mês (ex: boletos pendentes).
 * ZERO estimativas ou dados fictícios.
 */
export function calculateMonthlyCommitments(
  userId: string,
  monthsCount = 6,
  baseMonth?: string // YYYY-MM
): MonthlyCommitmentSummary[] {
  const baseDate = baseMonth ? new Date(`${baseMonth}-01T12:00:00Z`) : new Date();
  const summaries: MonthlyCommitmentSummary[] = [];

  const installments = getInstallments(userId);
  const invoices = getCreditCardInvoices(userId);
  const cards = getCreditCards(userId);
  const recurrings = getRecurringTransactions(userId).filter((r) => r.is_active);
  const loans = getLoans(userId).filter((l) => l.status === "active");
  const transactions = getTransactions(userId);

  for (let m = 0; m < monthsCount; m++) {
    const targetDate = addMonths(baseDate, m);
    const monthKey = format(targetDate, "yyyy-MM");
    const monthLabel = format(targetDate, "MMM/yy").toUpperCase();

    const items: MonthlyCommitmentItem[] = [];

    // 1. Parcelas de Cartão de Crédito
    // Verificar se a fatura daquele mês já está paga para não duplicar
    const monthInstallments = installments.filter((inst) => inst.competence_month === monthKey);
    let cardTotal = 0;

    for (const inst of monthInstallments) {
      const inv = invoices.find(
        (i) => i.credit_card_id === inst.credit_card_id && i.reference_month === monthKey
      );
      // Se a fatura já foi paga, esse compromisso já foi liquidado
      if (inv && inv.status === "paid") continue;

      const card = cards.find((c) => c.id === inst.credit_card_id);
      const cardName = card ? card.name : "Cartão";
      const amt = Number(inst.amount) || 0;

      cardTotal += amt;
      items.push({
        id: inst.id,
        type: "credit_card",
        title: inst.description,
        detail: `Fatura ${cardName}`,
        dueDate: inst.due_date,
        amount: amt,
        creditCardName: cardName,
      });
    }

    // 2. Despesas Recorrentes (Contas fixas)
    let fixedTotal = 0;
    for (const rec of recurrings) {
      if (rec.type !== "expense") continue;

      const dayStr = String(rec.due_day).padStart(2, "0");
      const dueDate = `${monthKey}-${dayStr}`;

      if (rec.is_variable) {
        // Valor variável sem valor fixo ainda
        items.push({
          id: `${rec.id}_${monthKey}`,
          type: "fixed",
          title: rec.description,
          detail: "Valor variável a confirmar",
          dueDate,
          amount: 0,
          isVariable: true,
        });
      } else {
        const amt = Number(rec.amount) || 0;
        fixedTotal += amt;
        items.push({
          id: `${rec.id}_${monthKey}`,
          type: "fixed",
          title: rec.description,
          detail: "Despesa recorrente",
          dueDate,
          amount: amt,
          isVariable: false,
        });
      }
    }

    // 3. Empréstimos Ativos
    let loanTotal = 0;
    for (const loan of loans) {
      const remainingInstallments = loan.total_installments - loan.paid_installments;
      if (m < remainingInstallments) {
        const amt = Number(loan.installment_value) || 0;
        loanTotal += amt;

        let dueDay = "10";
        if (loan.next_due_date) {
          dueDay = loan.next_due_date.slice(8, 10);
        }

        items.push({
          id: `${loan.id}_${monthKey}`,
          type: "loan",
          title: loan.name,
          detail: loan.lender ? `Credor: ${loan.lender}` : "Parcela de empréstimo",
          dueDate: `${monthKey}-${dueDay}`,
          amount: amt,
        });
      }
    }

    // 4. Outras Contas Pendentes Conhecidas (ex: Boletos pendentes com vencimento neste mês)
    let otherPendingTotal = 0;
    const pendingTxs = transactions.filter(
      (t) =>
        t.type === "expense" &&
        (t.status === "pending" || t.status === "to_receive") &&
        t.due_date &&
        t.due_date.startsWith(monthKey) &&
        !t.purchase_id && // não duplicar com cartão
        !t.invoice_id
    );

    for (const p of pendingTxs) {
      const amt = Number(p.amount) || 0;
      otherPendingTotal += amt;
      items.push({
        id: p.id,
        type: "pending_bill",
        title: p.description,
        detail: p.payment_method ? `Via ${p.payment_method}` : "Conta a pagar",
        dueDate: p.due_date!,
        amount: amt,
      });
    }

    const totalCommitted = cardTotal + fixedTotal + loanTotal + otherPendingTotal;

    summaries.push({
      monthKey,
      monthLabel,
      totalCommitted: Math.round(totalCommitted * 100) / 100,
      fixedTotal: Math.round(fixedTotal * 100) / 100,
      creditCardTotal: Math.round(cardTotal * 100) / 100,
      loanTotal: Math.round(loanTotal * 100) / 100,
      otherPendingTotal: Math.round(otherPendingTotal * 100) / 100,
      items: items.sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    });
  }

  return summaries;
}

// ==========================================
// RESERVAS FUTURAS & APORTES
// ==========================================

export function getFutureReserves(userId: string): any[] {
  return loadItems<any>("future_reserves", userId);
}

export function saveFutureReserve(
  userId: string,
  data: Omit<any, "id" | "user_id" | "created_at" | "current_amount"> & { id?: string; current_amount?: number }
): any {
  const current = getFutureReserves(userId);
  if (data.id) {
    const updated = current.map((r) =>
      r.id === data.id
        ? {
            ...r,
            ...data,
            current_amount: data.current_amount !== undefined ? data.current_amount : r.current_amount,
          }
        : r
    );
    saveItems("future_reserves", userId, updated);
    return updated.find((r) => r.id === data.id)!;
  }
  const newReserve = {
    ...data,
    id: crypto.randomUUID ? crypto.randomUUID() : `res_${Date.now()}`,
    user_id: userId,
    current_amount: data.current_amount || 0,
    status: data.status || "active",
    created_at: new Date().toISOString(),
  };
  saveItems("future_reserves", userId, [...current, newReserve]);
  return newReserve;
}

export function deleteFutureReserve(userId: string, id: string): boolean {
  const current = getFutureReserves(userId);
  saveItems("future_reserves", userId, current.filter((r) => r.id !== id));
  // Limpar alocações associadas
  const contribs = getReserveContributions(userId);
  saveItems("reserve_contributions", userId, contribs.filter((c) => c.reserve_id !== id));
  return true;
}

export function getReserveContributions(userId: string): any[] {
  return loadItems<any>("reserve_contributions", userId);
}

export function addReserveContribution(
  userId: string,
  params: {
    reserve_id: string;
    amount: number;
    date: string;
    from_account_id?: string | null;
    to_account_id?: string | null;
    notes?: string | null;
  }
): { contribution: any; updatedReserve: any } {
  const reserves = getFutureReserves(userId);
  const reserve = reserves.find((r) => r.id === params.reserve_id);
  if (!reserve) throw new Error("Reserva não encontrada.");

  const contribution = {
    id: crypto.randomUUID ? crypto.randomUUID() : `rc_${Date.now()}`,
    user_id: userId,
    reserve_id: params.reserve_id,
    amount: params.amount,
    date: params.date,
    from_account_id: params.from_account_id || null,
    to_account_id: params.to_account_id || null,
    notes: params.notes || null,
    created_at: new Date().toISOString(),
  };

  const contribs = getReserveContributions(userId);
  saveItems("reserve_contributions", userId, [...contribs, contribution]);

  // Se houver conta bancária específica de origem e destino, registrar transferência real entre contas próprias
  if (params.from_account_id && params.to_account_id && params.from_account_id !== params.to_account_id) {
    saveTransaction(userId, {
      type: "transfer",
      description: `Aporte Reserva: ${reserve.name}`,
      amount: Math.abs(params.amount),
      transaction_date: params.date,
      status: "paid",
      account_id: params.from_account_id,
      destination_account_id: params.to_account_id,
      notes: params.notes || null,
    });
  }

  // Recalcular saldo total da reserva
  const allForReserve = [...contribs, contribution].filter((c) => c.reserve_id === params.reserve_id);
  const newCurrentAmount = Math.max(0, allForReserve.reduce((acc, c) => acc + (Number(c.amount) || 0), 0));
  const isCompleted = newCurrentAmount >= reserve.target_amount && reserve.target_amount > 0;

  const updatedReserve = {
    ...reserve,
    current_amount: newCurrentAmount,
    status: isCompleted ? "completed" : "active",
  };

  saveItems(
    "future_reserves",
    userId,
    reserves.map((r) => (r.id === params.reserve_id ? updatedReserve : r))
  );

  return { contribution, updatedReserve };
}

// ==========================================
// ORÇAMENTOS (BUDGETS)
// ==========================================

export function getBudgets(userId: string): any[] {
  return loadItems<any>("budgets", userId);
}

export function saveBudget(
  userId: string,
  data: {
    id?: string;
    category_id: string;
    amount: number;
    month_key?: string | null;
    is_recurring: boolean;
  }
): any {
  const current = getBudgets(userId);
  if (data.id) {
    const updated = current.map((b) => (b.id === data.id ? { ...b, ...data } : b));
    saveItems("budgets", userId, updated);
    return updated.find((b) => b.id === data.id)!;
  }

  // Verificar se já existe orçamento para a mesma categoria e mês
  const existing = current.find(
    (b) => b.category_id === data.category_id && (b.month_key || null) === (data.month_key || null)
  );
  if (existing) {
    const updated = current.map((b) => (b.id === existing.id ? { ...b, ...data } : b));
    saveItems("budgets", userId, updated);
    return updated.find((b) => b.id === existing.id)!;
  }

  const newBudget = {
    ...data,
    id: crypto.randomUUID ? crypto.randomUUID() : `bg_${Date.now()}`,
    user_id: userId,
    created_at: new Date().toISOString(),
  };
  saveItems("budgets", userId, [...current, newBudget]);
  return newBudget;
}

export function deleteBudget(userId: string, id: string): boolean {
  const current = getBudgets(userId);
  saveItems("budgets", userId, current.filter((b) => b.id !== id));
  return true;
}

// ==========================================
// METAS FINANCEIRAS
// ==========================================

export function getFinancialGoals(userId: string): any[] {
  return loadItems<any>("financial_goals", userId);
}

export function saveFinancialGoal(
  userId: string,
  data: Omit<any, "id" | "user_id" | "created_at" | "current_amount"> & { id?: string; current_amount?: number }
): any {
  const current = getFinancialGoals(userId);
  if (data.id) {
    const updated = current.map((g) =>
      g.id === data.id
        ? {
            ...g,
            ...data,
            current_amount: data.current_amount !== undefined ? data.current_amount : g.current_amount,
          }
        : g
    );
    saveItems("financial_goals", userId, updated);
    return updated.find((g) => g.id === data.id)!;
  }
  const newGoal = {
    ...data,
    id: crypto.randomUUID ? crypto.randomUUID() : `goal_${Date.now()}`,
    user_id: userId,
    current_amount: data.current_amount || 0,
    status: data.status || "active",
    created_at: new Date().toISOString(),
  };
  saveItems("financial_goals", userId, [...current, newGoal]);
  return newGoal;
}

export function deleteFinancialGoal(userId: string, id: string): boolean {
  const current = getFinancialGoals(userId);
  saveItems("financial_goals", userId, current.filter((g) => g.id !== id));
  const contribs = getGoalContributions(userId);
  saveItems("goal_contributions", userId, contribs.filter((c) => c.goal_id !== id));
  return true;
}

export function getGoalContributions(userId: string): any[] {
  return loadItems<any>("goal_contributions", userId);
}

export function addGoalContribution(
  userId: string,
  params: {
    goal_id: string;
    type: "deposit" | "withdraw";
    amount: number;
    date: string;
    from_account_id?: string | null;
    to_account_id?: string | null;
    notes?: string | null;
  }
): { contribution: any; updatedGoal: any } {
  const goals = getFinancialGoals(userId);
  const goal = goals.find((g) => g.id === params.goal_id);
  if (!goal) throw new Error("Meta não encontrada.");

  const netAmount = params.type === "deposit" ? Math.abs(params.amount) : -Math.abs(params.amount);
  const currentAmt = Number(goal.current_amount) || 0;

  if (params.type === "withdraw" && Math.abs(params.amount) > currentAmt) {
    throw new Error("O valor de retirada não pode ser superior ao saldo reservado da meta.");
  }

  const contribution = {
    id: crypto.randomUUID ? crypto.randomUUID() : `gc_${Date.now()}`,
    user_id: userId,
    goal_id: params.goal_id,
    type: params.type,
    amount: netAmount,
    date: params.date,
    from_account_id: params.from_account_id || null,
    to_account_id: params.to_account_id || null,
    notes: params.notes || null,
    created_at: new Date().toISOString(),
  };

  const contribs = getGoalContributions(userId);
  saveItems("goal_contributions", userId, [...contribs, contribution]);

  // Se houver contas bancárias distintas, gerar transferência
  if (params.from_account_id && params.to_account_id && params.from_account_id !== params.to_account_id) {
    saveTransaction(userId, {
      type: "transfer",
      description: `${params.type === "deposit" ? "Aporte" : "Resgate"} Meta: ${goal.name}`,
      amount: Math.abs(params.amount),
      transaction_date: params.date,
      status: "paid",
      account_id: params.from_account_id,
      destination_account_id: params.to_account_id,
      notes: params.notes || null,
    });
  }

  const newCurrentAmount = Math.max(0, currentAmt + netAmount);
  const isCompleted = newCurrentAmount >= goal.target_amount && goal.target_amount > 0;

  const updatedGoal = {
    ...goal,
    current_amount: newCurrentAmount,
    status: isCompleted ? "completed" : "active",
  };

  saveItems(
    "financial_goals",
    userId,
    goals.map((g) => (g.id === params.goal_id ? updatedGoal : g))
  );

  return { contribution, updatedGoal };
}

// ==========================================
// FECHAMENTO MENSAL (MONTHLY CLOSING)
// ==========================================

export function getMonthlyClosings(userId: string): any[] {
  return loadItems<any>("monthly_closings", userId);
}

export function closeMonth(
  userId: string,
  params: {
    month_key: string; // "YYYY-MM"
    closed_by?: string;
  }
): any {
  const closings = getMonthlyClosings(userId);
  const txs = getTransactions(userId);
  const invs = getCreditCardInvoices(userId);
  const commitments = calculateMonthlyCommitments(userId, 12);
  const monthCommitment = commitments.find((c) => c.monthKey === params.month_key);

  // Calcular valores consolidados do período
  let incomeTotal = 0;
  let expenseTotal = 0;
  let pendingExpenses = 0;

  for (const t of txs) {
    const d = t.transaction_date || "";
    if (d.startsWith(params.month_key)) {
      const amt = Number(t.amount) || 0;
      if (t.type === "income" && (t.status === "paid" || t.status === "received")) {
        incomeTotal += amt;
      } else if (t.type === "expense") {
        if (t.status === "paid") {
          expenseTotal += amt;
        } else if (t.status === "pending" || t.status === "to_receive") {
          pendingExpenses += amt;
        }
      }
    }
  }

  // Faturas do mês
  let creditCardTotal = 0;
  let pendingInvoices = 0;
  for (const inv of invs) {
    if (inv.reference_month === params.month_key) {
      creditCardTotal += Number(inv.total_amount) || 0;
      if (inv.status !== "paid") {
        pendingInvoices += Number(inv.total_amount) || 0;
      }
    }
  }

  const openingBalance = 0; // Calculado relativo
  const closingBalance = incomeTotal - expenseTotal;
  const result = incomeTotal - expenseTotal;
  const committedTotal = monthCommitment?.totalCommitted || (pendingExpenses + pendingInvoices);

  const existingClosing = closings.find((c) => c.month_key === params.month_key);
  const now = new Date().toISOString();
  const userName = params.closed_by || "Usuário";

  const snapshotVersion = {
    version: existingClosing ? (existingClosing.history?.length || 0) + 1 : 1,
    closed_at: now,
    closed_by: userName,
    opening_balance: openingBalance,
    income_total: Math.round(incomeTotal * 100) / 100,
    expense_total: Math.round(expenseTotal * 100) / 100,
    pending_expenses: Math.round(pendingExpenses * 100) / 100,
    credit_card_total: Math.round(creditCardTotal * 100) / 100,
    pending_invoices: Math.round(pendingInvoices * 100) / 100,
    committed_total: Math.round(committedTotal * 100) / 100,
    closing_balance: Math.round(closingBalance * 100) / 100,
    result: Math.round(result * 100) / 100,
  };

  let newClosing: any;
  if (existingClosing) {
    newClosing = {
      ...existingClosing,
      status: "closed",
      closed_at: now,
      closed_by: userName,
      opening_balance: snapshotVersion.opening_balance,
      income_total: snapshotVersion.income_total,
      expense_total: snapshotVersion.expense_total,
      pending_expenses: snapshotVersion.pending_expenses,
      credit_card_total: snapshotVersion.credit_card_total,
      pending_invoices: snapshotVersion.pending_invoices,
      committed_total: snapshotVersion.committed_total,
      closing_balance: snapshotVersion.closing_balance,
      result: snapshotVersion.result,
      history: [...(existingClosing.history || []), snapshotVersion],
      updated_at: now,
    };
    saveItems(
      "monthly_closings",
      userId,
      closings.map((c) => (c.month_key === params.month_key ? newClosing : c))
    );
  } else {
    newClosing = {
      id: crypto.randomUUID ? crypto.randomUUID() : `close_${Date.now()}`,
      user_id: userId,
      month_key: params.month_key,
      status: "closed",
      ...snapshotVersion,
      history: [snapshotVersion],
      created_at: now,
      updated_at: now,
    };
    saveItems("monthly_closings", userId, [...closings, newClosing]);
  }

  return newClosing;
}

export function reopenMonth(
  userId: string,
  params: {
    month_key: string;
    reopened_by?: string;
    reason?: string;
  }
): any {
  const closings = getMonthlyClosings(userId);
  const closing = closings.find((c) => c.month_key === params.month_key);
  if (!closing) throw new Error("Fechamento não encontrado.");

  const now = new Date().toISOString();
  const updatedHistory = [...(closing.history || [])];
  if (updatedHistory.length > 0) {
    const lastVersion = { ...updatedHistory[updatedHistory.length - 1] };
    lastVersion.reopened_at = now;
    lastVersion.reopened_by = params.reopened_by || "Usuário";
    lastVersion.reopen_reason = params.reason || "Reaberto para ajustes";
    updatedHistory[updatedHistory.length - 1] = lastVersion;
  }

  const updatedClosing = {
    ...closing,
    status: "open",
    history: updatedHistory,
    updated_at: now,
  };

  saveItems(
    "monthly_closings",
    userId,
    closings.map((c) => (c.month_key === params.month_key ? updatedClosing : c))
  );

  return updatedClosing;
}

