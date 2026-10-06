import {
  parseISO,
  format,
  addMonths,
  getDate,
  setDate,
  getDaysInMonth,
} from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Retorna a competência da fatura ("YYYY-MM") e o dueDate ("YYYY-MM-DD")
 * para uma compra realizada em `purchaseDate` num cartão com `closingDay` e `dueDay`.
 *
 * Regra:
 * Se purchaseDay < closingDay:
 *   Pertence à fatura que fecha no mês da compra.
 * Se purchaseDay >= closingDay:
 *   Pertence à próxima fatura (mês subsequente).
 *
 * Se dueDay <= closingDay, o vencimento cai no mês seguinte ao fechamento.
 */
export function calculateInvoiceSchedule(
  purchaseDateStr: string,
  closingDay: number,
  dueDay: number,
  installmentIndex = 0 // 0 para primeira parcela ou à vista, 1 para segunda, etc.
): {
  referenceMonth: string; // "YYYY-MM"
  dueDate: string; // "YYYY-MM-DD"
  closingDate: string; // "YYYY-MM-DD"
} {
  const purchaseDate = parseISO(purchaseDateStr.slice(0, 10));
  const purchaseDay = getDate(purchaseDate);

  // Mês base de fechamento
  let closingMonthDate = purchaseDate;
  if (purchaseDay >= closingDay) {
    // Ultrapassou ou fechou hoje -> vai para a próxima fatura
    closingMonthDate = addMonths(purchaseDate, 1);
  }

  // Se for uma parcela futura (installmentIndex > 0), adicionamos os meses
  if (installmentIndex > 0) {
    closingMonthDate = addMonths(closingMonthDate, installmentIndex);
  }

  const closingYear = closingMonthDate.getFullYear();
  const closingMonth = closingMonthDate.getMonth(); // 0-indexed

  // Limitar dia ao máximo de dias do mês (ex: fevereiro)
  const maxDaysInClosingMonth = getDaysInMonth(closingMonthDate);
  const actualClosingDay = Math.min(closingDay, maxDaysInClosingMonth);
  const closingDateObj = new Date(closingYear, closingMonth, actualClosingDay);

  // Vencimento: se dueDay <= closingDay, o vencimento é no mês seguinte ao fechamento
  let dueMonthDate = closingMonthDate;
  if (dueDay <= closingDay) {
    dueMonthDate = addMonths(closingMonthDate, 1);
  }

  const maxDaysInDueMonth = getDaysInMonth(dueMonthDate);
  const actualDueDay = Math.min(dueDay, maxDaysInDueMonth);
  const dueDateObj = new Date(
    dueMonthDate.getFullYear(),
    dueMonthDate.getMonth(),
    actualDueDay
  );

  const referenceMonth = format(closingMonthDate, "yyyy-MM");
  const dueDate = format(dueDateObj, "yyyy-MM-dd");
  const closingDate = format(closingDateObj, "yyyy-MM-dd");

  return { referenceMonth, dueDate, closingDate };
}

/**
 * Divide o valor total em parcelas sem perder nenhum centavo.
 * Ex: 1000 / 3 -> [333.34, 333.33, 333.33] ou ajusta a última parcela.
 */
export function splitInstallmentAmounts(
  totalAmount: number,
  count: number
): number[] {
  if (count <= 1) return [Math.round(totalAmount * 100) / 100];

  const totalCents = Math.round(totalAmount * 100);
  const baseCents = Math.floor(totalCents / count);
  const remainderCents = totalCents - baseCents * count;

  const results: number[] = [];
  for (let i = 0; i < count; i++) {
    // Adiciona 1 centavo nas primeiras parcelas para cobrir o resto
    const cents = i < remainderCents ? baseCents + 1 : baseCents;
    results.push(cents / 100);
  }

  return results;
}

/**
 * Retorna o rótulo amigável do mês de competência, ex: "Novembro/2026"
 */
export function formatMonthNameYear(yearMonth: string): string {
  try {
    const [year, month] = yearMonth.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    const m = format(date, "MMMM/yyyy", { locale: ptBR });
    return m.charAt(0).toUpperCase() + m.slice(1);
  } catch {
    return yearMonth;
  }
}
