"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type {
  Account,
  Category,
  CreditCard,
  Transaction,
  Loan,
  UserProfile,
  PeriodFilterOption,
  CreditCardPurchase,
  Installment,
  CreditCardInvoice,
  RecurringTransaction,
  MonthlyCommitmentSummary,
} from "./types";
import * as service from "./finance-service";
import { getDateRangeForPeriod } from "./formatters";

interface FinanceContextType {
  user: UserProfile;
  accounts: Account[];
  categories: Category[];
  creditCards: CreditCard[];
  creditCardPurchases: CreditCardPurchase[];
  installments: Installment[];
  invoices: CreditCardInvoice[];
  recurringTransactions: RecurringTransaction[];
  transactions: Transaction[];
  loans: Loan[];
  loading: boolean;
  period: PeriodFilterOption;
  setPeriod: (p: PeriodFilterOption) => void;
  customStartDate?: string;
  customEndDate?: string;
  setCustomRange: (start: string, end: string) => void;
  dateRange: { startDate: string; endDate: string };
  accountBalances: { [accountId: string]: number };
  monthlyCommitments: MonthlyCommitmentSummary[];
  refreshData: () => void;

  // Mutations
  addTransaction: (data: any) => Transaction;
  updateTransaction: (data: any) => Transaction;
  removeTransaction: (id: string) => boolean;

  addCreditCardPurchase: (params: {
    credit_card_id: string;
    description: string;
    category_id?: string | null;
    purchase_date: string;
    total_amount: number;
    payment_type: "cash" | "installment";
    installments_count: number;
    notes?: string | null;
  }) => { purchase: CreditCardPurchase; installments: Installment[] };
  removeCreditCardPurchase: (id: string) => boolean;
  payInvoice: (
    invoiceId: string,
    params: { payment_account_id: string; payment_date: string; amount?: number }
  ) => CreditCardInvoice;

  addRecurringTransaction: (data: any) => RecurringTransaction;
  updateRecurringTransaction: (data: any) => RecurringTransaction;
  removeRecurringTransaction: (id: string) => boolean;

  addAccount: (data: any) => Account;
  updateAccount: (data: any) => Account;
  removeAccount: (id: string) => boolean;

  addCreditCard: (data: any) => CreditCard;
  updateCreditCard: (data: any) => CreditCard;
  removeCreditCard: (id: string) => boolean;

  addLoan: (data: any) => Loan;
  updateLoan: (data: any) => Loan;
  removeLoan: (id: string) => boolean;
  payLoan: (id: string) => Loan | null;

  addCategory: (data: any) => Category;
  updateCategory: (data: any) => Category;
  removeCategory: (id: string) => boolean;

  // Planejamento
  futureReserves: any[];
  reserveContributions: any[];
  budgets: any[];
  financialGoals: any[];
  goalContributions: any[];
  monthlyClosings: any[];
  dismissedAlertIds: string[];
  dismissAlert: (id: string) => void;

  saveReserve: (data: any) => any;
  removeReserve: (id: string) => boolean;
  contributeToReserve: (params: any) => any;

  saveBudgetRule: (data: any) => any;
  removeBudgetRule: (id: string) => boolean;

  saveGoal: (data: any) => any;
  removeGoal: (id: string) => boolean;
  contributeToGoal: (params: any) => any;

  closeCurrentMonth: (params: { month_key: string; closed_by?: string }) => any;
  reopenClosedMonth: (params: { month_key: string; reopened_by?: string; reason?: string }) => any;

  updateUserProfile: (data: { full_name?: string }) => Promise<void>;
  logout: () => void;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

const DEFAULT_USER: UserProfile = {
  id: "user_default",
  email: "usuario@fluxo.app",
  full_name: "Usuário Fluxo",
  role: "admin",
};

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilterOption>("this_month");
  const [customStartDate, setCustomStartDate] = useState<string>();
  const [customEndDate, setCustomEndDate] = useState<string>();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [creditCardPurchases, setCreditCardPurchases] = useState<CreditCardPurchase[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [invoices, setInvoices] = useState<CreditCardInvoice[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [accountBalances, setAccountBalances] = useState<{ [accountId: string]: number }>({});
  const [monthlyCommitments, setMonthlyCommitments] = useState<MonthlyCommitmentSummary[]>([]);

  // Planejamento state
  const [futureReserves, setFutureReserves] = useState<any[]>([]);
  const [reserveContributions, setReserveContributions] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [financialGoals, setFinancialGoals] = useState<any[]>([]);
  const [goalContributions, setGoalContributions] = useState<any[]>([]);
  const [monthlyClosings, setMonthlyClosings] = useState<any[]>([]);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);

  const refreshData = useCallback((currentUserOverride?: UserProfile) => {
    const currentUser = currentUserOverride || service.getCurrentUser();
    if (!currentUser?.id) return;

    const accs = service.getAccounts(currentUser.id);
    const cats = service.getCategories(currentUser.id);
    const cards = service.getCreditCards(currentUser.id);
    const pur = service.getCreditCardPurchases(currentUser.id);
    const inst = service.getInstallments(currentUser.id);
    const inv = service.getCreditCardInvoices(currentUser.id);
    const rec = service.getRecurringTransactions(currentUser.id);
    const txs = service.getTransactions(currentUser.id);
    const lns = service.getLoans(currentUser.id);
    const balances = service.calculateAccountBalances(currentUser.id);
    const commitments = service.calculateMonthlyCommitments(currentUser.id, 6);

    const res = service.getFutureReserves(currentUser.id);
    const resContribs = service.getReserveContributions(currentUser.id);
    const bdgs = service.getBudgets(currentUser.id);
    const gls = service.getFinancialGoals(currentUser.id);
    const glContribs = service.getGoalContributions(currentUser.id);
    const clos = service.getMonthlyClosings(currentUser.id);

    setUser(currentUser);
    setAccounts(accs);
    setCategories(cats);
    setCreditCards(cards);
    setCreditCardPurchases(pur);
    setInstallments(inst);
    setInvoices(inv);
    setRecurringTransactions(rec);
    setTransactions(txs);
    setLoans(lns);
    setAccountBalances(balances);
    setMonthlyCommitments(commitments);

    setFutureReserves(res);
    setReserveContributions(resContribs);
    setBudgets(bdgs);
    setFinancialGoals(gls);
    setGoalContributions(glContribs);
    setMonthlyClosings(clos);

    setLoading(false);
  }, []);

  // Monitorar Sessão Oficial do Supabase Auth
  useEffect(() => {
    let isMounted = true;
    const supabase = service.getSupabaseBrowserClient();

    // 1. Obter sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) {
        // Papel de segurança extraído estritamente de app_metadata (imutável pelo usuário comum)
        const role = (session.user.app_metadata?.role as "admin" | "user") || "user";
        const authUser: UserProfile = {
          id: session.user.id,
          email: session.user.email || "usuario@fluxo.app",
          full_name: (session.user.user_metadata?.full_name as string) || session.user.email || "Usuário Fluxo",
          role,
        };
        service.setCurrentUser(authUser);
        refreshData(authUser);
      } else {
        // Sem sessão ativa: carregar perfil padrão ou aguardar login
        refreshData();
      }
    });

    // 2. Ouvir mudanças de autenticação (LOGIN, LOGOUT, TOKEN_REFRESHED)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === "SIGNED_IN" && session?.user) {
        const role = (session.user.app_metadata?.role as "admin" | "user") || "user";
        const authUser: UserProfile = {
          id: session.user.id,
          email: session.user.email || "usuario@fluxo.app",
          full_name: (session.user.user_metadata?.full_name as string) || session.user.email || "Usuário Fluxo",
          role,
        };
        service.setCurrentUser(authUser);
        refreshData(authUser);
      } else if (event === "SIGNED_OUT") {
        if (typeof window !== "undefined") {
          localStorage.removeItem("fluxo_current_user");
          window.location.href = "/login";
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [refreshData]);

  const dateRange = getDateRangeForPeriod(period, customStartDate, customEndDate);

  const setCustomRange = (start: string, end: string) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
    setPeriod("custom");
  };

  const addTransaction = (data: any) => {
    const t = service.saveTransaction(user.id, data);
    refreshData();
    return t;
  };

  const updateTransaction = (data: any) => {
    const t = service.saveTransaction(user.id, data);
    refreshData();
    return t;
  };

  const removeTransaction = (id: string) => {
    const res = service.deleteTransaction(user.id, id);
    refreshData();
    return res;
  };

  const addCreditCardPurchase = (params: any) => {
    const res = service.recordCreditCardPurchase(user.id, params);
    refreshData();
    return res;
  };

  const removeCreditCardPurchase = (id: string) => {
    const res = service.deleteCreditCardPurchase(user.id, id);
    refreshData();
    return res;
  };

  const payInvoice = (invoiceId: string, params: any) => {
    const res = service.payCreditCardInvoice(user.id, invoiceId, params);
    refreshData();
    return res;
  };

  const addRecurringTransaction = (data: any) => {
    const r = service.saveRecurringTransaction(user.id, data);
    refreshData();
    return r;
  };

  const updateRecurringTransaction = (data: any) => {
    const r = service.saveRecurringTransaction(user.id, data);
    refreshData();
    return r;
  };

  const removeRecurringTransaction = (id: string) => {
    const res = service.deleteRecurringTransaction(user.id, id);
    refreshData();
    return res;
  };

  const addAccount = (data: any) => {
    const a = service.saveAccount(user.id, data);
    refreshData();
    return a;
  };

  const updateAccount = (data: any) => {
    const a = service.saveAccount(user.id, data);
    refreshData();
    return a;
  };

  const removeAccount = (id: string) => {
    const res = service.deleteAccount(user.id, id);
    refreshData();
    return res;
  };

  const addCreditCard = (data: any) => {
    const c = service.saveCreditCard(user.id, data);
    refreshData();
    return c;
  };

  const updateCreditCard = (data: any) => {
    const c = service.saveCreditCard(user.id, data);
    refreshData();
    return c;
  };

  const removeCreditCard = (id: string) => {
    const res = service.deleteCreditCard(user.id, id);
    refreshData();
    return res;
  };

  const addLoan = (data: any) => {
    const l = service.saveLoan(user.id, data);
    refreshData();
    return l;
  };

  const updateLoan = (data: any) => {
    const l = service.saveLoan(user.id, data);
    refreshData();
    return l;
  };

  const removeLoan = (id: string) => {
    const res = service.deleteLoan(user.id, id);
    refreshData();
    return res;
  };

  const payLoan = (id: string) => {
    const res = service.payLoanInstallment(user.id, id);
    refreshData();
    return res;
  };

  const addCategory = (data: any) => {
    const c = service.saveCategory(user.id, data);
    refreshData();
    return c;
  };

  const updateCategory = (data: any) => {
    const c = service.saveCategory(user.id, data);
    refreshData();
    return c;
  };

  const removeCategory = (id: string) => {
    const res = service.deleteCategory(user.id, id);
    refreshData();
    return res;
  };

  const dismissAlert = (id: string) => {
    setDismissedAlertIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const saveReserve = (data: any) => {
    const res = service.saveFutureReserve(user.id, data);
    refreshData();
    return res;
  };

  const removeReserve = (id: string) => {
    const res = service.deleteFutureReserve(user.id, id);
    refreshData();
    return res;
  };

  const contributeToReserve = (params: any) => {
    const res = service.addReserveContribution(user.id, params);
    refreshData();
    return res;
  };

  const saveBudgetRule = (data: any) => {
    const res = service.saveBudget(user.id, data);
    refreshData();
    return res;
  };

  const removeBudgetRule = (id: string) => {
    const res = service.deleteBudget(user.id, id);
    refreshData();
    return res;
  };

  const saveGoal = (data: any) => {
    const res = service.saveFinancialGoal(user.id, data);
    refreshData();
    return res;
  };

  const removeGoal = (id: string) => {
    const res = service.deleteFinancialGoal(user.id, id);
    refreshData();
    return res;
  };

  const contributeToGoal = (params: any) => {
    const res = service.addGoalContribution(user.id, params);
    refreshData();
    return res;
  };

  const closeCurrentMonth = (params: { month_key: string; closed_by?: string }) => {
    const res = service.closeMonth(user.id, params);
    refreshData();
    return res;
  };

  const reopenClosedMonth = (params: { month_key: string; reopened_by?: string; reason?: string }) => {
    const res = service.reopenMonth(user.id, params);
    refreshData();
    return res;
  };

  const updateUserProfile = async (data: { full_name?: string }) => {
    const supabase = service.getSupabaseBrowserClient();
    if (data.full_name !== undefined) {
      await supabase.auth.updateUser({
        data: { full_name: data.full_name },
      });

      if (user.id && user.id !== "user_default") {
        await supabase.from("profiles").upsert({
          id: user.id,
          full_name: data.full_name,
        });
      }

      const updated = { ...user, full_name: data.full_name };
      setUser(updated);
      service.setCurrentUser(updated);
    }
  };

  const logout = async () => {
    try {
      const supabase = service.getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {}
    if (typeof window !== "undefined") {
      localStorage.removeItem("fluxo_current_user");
      window.location.href = "/login";
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        user,
        accounts,
        categories,
        creditCards,
        creditCardPurchases,
        installments,
        invoices,
        recurringTransactions,
        transactions,
        loans,
        loading,
        period,
        setPeriod,
        customStartDate,
        customEndDate,
        setCustomRange,
        dateRange,
        accountBalances,
        monthlyCommitments,
        refreshData,
        addTransaction,
        updateTransaction,
        removeTransaction,
        addCreditCardPurchase,
        removeCreditCardPurchase,
        payInvoice,
        addRecurringTransaction,
        updateRecurringTransaction,
        removeRecurringTransaction,
        addAccount,
        updateAccount,
        removeAccount,
        addCreditCard,
        updateCreditCard,
        removeCreditCard,
        addLoan,
        updateLoan,
        removeLoan,
        payLoan,
        addCategory,
        updateCategory,
        removeCategory,

        futureReserves,
        reserveContributions,
        budgets,
        financialGoals,
        goalContributions,
        monthlyClosings,
        dismissedAlertIds,
        dismissAlert,

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

        updateUserProfile,
        logout,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error("useFinance must be used within a FinanceProvider");
  }
  return context;
}
