export type TransactionType = "income" | "expense" | "transfer";
export type TransactionStatus =
  | "pending"
  | "paid"
  | "overdue"
  | "received"
  | "to_receive"
  | "in_invoice"
  | "cancelled";

export type AccountType = "checking" | "savings" | "cash" | "digital_wallet" | "investment" | "other";
export type InvoiceStatus = "open" | "closed" | "paid" | "overdue";

export type PaymentMethod =
  | "Pix"
  | "Dinheiro"
  | "Cartão de débito"
  | "Cartão de crédito"
  | "Boleto"
  | "Transferência bancária"
  | "Débito automático"
  | "Carteira digital"
  | "Outros";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  institution?: string | null;
  type: AccountType;
  opening_balance: number;
  color?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  kind?: TransactionType | null;
  created_at: string;
}

export interface CreditCard {
  id: string;
  user_id: string;
  name: string;
  bank?: string | null;
  bank_code?: string | null;
  card_brand?: string | null;
  card_last_digits?: string | null;
  color?: string | null;
  custom_color?: string | null;
  use_auto_color?: boolean;
  credit_limit: number;
  closing_day: number;
  due_day: number;
  is_active: boolean;
  created_at: string;
}

export interface CreditCardPurchase {
  id: string;
  user_id: string;
  credit_card_id: string;
  description: string;
  category_id?: string | null;
  purchase_date: string;
  total_amount: number;
  payment_type: "cash" | "installment"; // à vista ou parcelado
  installments_count: number;
  notes?: string | null;
  created_at: string;
  // Enriched
  credit_card_name?: string;
  category_name?: string;
}

export interface Installment {
  id: string;
  user_id: string;
  purchase_id: string;
  credit_card_id: string;
  invoice_id?: string | null;
  installment_number: number;
  total_installments: number;
  amount: number;
  competence_month: string; // "YYYY-MM"
  due_date: string; // "YYYY-MM-DD"
  description: string;
  category_id?: string | null;
  created_at: string;
}

export interface CreditCardInvoice {
  id: string;
  user_id: string;
  credit_card_id: string;
  reference_month: string; // "YYYY-MM"
  closing_date: string; // "YYYY-MM-DD"
  due_date: string; // "YYYY-MM-DD"
  total_amount: number;
  status: InvoiceStatus;
  payment_account_id?: string | null;
  payment_date?: string | null;
  created_at: string;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  is_variable: boolean; // se valor variável (ex: energia)
  type: TransactionType;
  frequency: "monthly" | "weekly" | "yearly";
  due_day: number; // dia do mês de vencimento (1 a 31)
  account_id?: string | null;
  category_id?: string | null;
  payment_method: PaymentMethod;
  is_active: boolean;
  notes?: string | null;
  created_at: string;
  // Enriched
  category_name?: string;
  account_name?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  transaction_date: string;
  due_date?: string | null;
  paid_at?: string | null;
  account_id?: string | null;
  destination_account_id?: string | null;
  category_id?: string | null;
  payment_method?: PaymentMethod | string | null;
  is_recurring?: boolean;
  recurring_transaction_id?: string | null;
  // Para pagamento de fatura ou compra com cartão
  credit_card_id?: string | null;
  invoice_id?: string | null;
  purchase_id?: string | null;
  installment_number?: number | null;
  total_installments?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Joins / enriched properties
  account_name?: string;
  category_name?: string;
  category_color?: string;
  credit_card_name?: string;
}

export interface Loan {
  id: string;
  user_id: string;
  name: string;
  lender?: string | null; // Instituição / Credor
  contracted_amount: number;
  remaining_amount: number;
  total_installments: number;
  paid_installments: number;
  installment_value: number;
  next_due_date?: string | null;
  status: "active" | "completed" | "cancelled";
  created_at: string;
}

export type UserRole = "admin" | "user";

export interface UserProfile {
  id: string;
  full_name?: string | null;
  email: string;
  role?: UserRole;
}

export type PeriodFilterOption =
  | "this_month"
  | "last_month"
  | "last_3_months"
  | "last_6_months"
  | "this_year"
  | "custom";

export interface MonthlyCommitmentItem {
  id: string;
  type: "fixed" | "credit_card" | "loan" | "pending_bill";
  title: string;
  detail?: string;
  dueDate: string;
  amount: number;
  isVariable?: boolean;
  creditCardName?: string;
}

export interface MonthlyCommitmentSummary {
  monthKey: string; // "YYYY-MM"
  monthLabel: string; // "OUT/2026"
  totalCommitted: number;
  fixedTotal: number;
  creditCardTotal: number;
  loanTotal: number;
  otherPendingTotal: number;
  items: MonthlyCommitmentItem[];
}

// ==========================================
// PLANEJAMENTO FINANCEIRO PESSOAL (EVOLUÇÃO)
// ==========================================

export interface FutureReserve {
  id: string;
  user_id: string;
  name: string;
  category_id?: string | null;
  target_amount: number;
  target_date: string; // "YYYY-MM-DD"
  current_amount: number;
  account_id?: string | null;
  notes?: string | null;
  status: "active" | "completed" | "cancelled";
  created_at: string;
}

export interface ReserveContribution {
  id: string;
  user_id: string;
  reserve_id: string;
  amount: number; // positivo para aporte, negativo para retirada/uso
  date: string; // "YYYY-MM-DD"
  from_account_id?: string | null;
  to_account_id?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month_key?: string | null; // "YYYY-MM" ou null se for padrão recorrente
  is_recurring: boolean;
  created_at: string;
}

export interface FinancialGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string | null;
  account_id?: string | null;
  notes?: string | null;
  status: "active" | "completed" | "cancelled";
  created_at: string;
}

export interface GoalContribution {
  id: string;
  user_id: string;
  goal_id: string;
  type: "deposit" | "withdraw";
  amount: number;
  date: string;
  from_account_id?: string | null;
  to_account_id?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface MonthlyClosingVersion {
  version: number;
  closed_at: string;
  closed_by: string;
  reopened_at?: string | null;
  reopened_by?: string | null;
  reopen_reason?: string | null;
  opening_balance: number;
  income_total: number;
  expense_total: number;
  pending_expenses: number;
  credit_card_total: number;
  pending_invoices: number;
  committed_total: number;
  closing_balance: number;
  result: number;
}

export interface MonthlyClosing {
  id: string;
  user_id: string;
  month_key: string; // "YYYY-MM"
  status: "open" | "closed";
  opening_balance: number;
  income_total: number;
  expense_total: number;
  pending_expenses: number;
  credit_card_total: number;
  pending_invoices: number;
  committed_total: number;
  closing_balance: number;
  result: number;
  closed_at?: string | null;
  closed_by?: string | null;
  history: MonthlyClosingVersion[];
  created_at: string;
  updated_at: string;
}

export type FinancialAlertPriority = "critical" | "warning" | "info";

export interface FinancialAlert {
  id: string; // chave/regra identificável (ex: overdue-expense-123)
  title: string;
  description: string;
  priority: FinancialAlertPriority;
  category: "overdue" | "invoice_due" | "invoice_closing" | "commitments" | "budget" | "reserve" | "goal" | "free_balance";
  date?: string;
  amount?: number;
  actionLabel?: string;
  linkTab?: string;
  read?: boolean;
}

