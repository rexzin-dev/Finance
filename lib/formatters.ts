import { format, parseISO, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { PeriodFilterOption } from "./types";

export function formatCurrency(amount: number | null | undefined): string {
  const value = amount ?? 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    const d = parseISO(dateStr.slice(0, 10));
    return format(d, "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

export function formatShortDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    const d = parseISO(dateStr.slice(0, 10));
    return format(d, "dd MMM", { locale: ptBR }).toUpperCase();
  } catch {
    return dateStr;
  }
}

export function formatPercent(value: number): string {
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

export function getDateRangeForPeriod(
  period: PeriodFilterOption,
  customStart?: string,
  customEnd?: string
): { startDate: string; endDate: string } {
  const now = new Date();

  switch (period) {
    case "this_month": {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      return {
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
      };
    }
    case "last_month": {
      const prevMonth = subMonths(now, 1);
      const start = startOfMonth(prevMonth);
      const end = endOfMonth(prevMonth);
      return {
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
      };
    }
    case "last_3_months": {
      const start = startOfMonth(subMonths(now, 2));
      const end = endOfMonth(now);
      return {
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
      };
    }
    case "last_6_months": {
      const start = startOfMonth(subMonths(now, 5));
      const end = endOfMonth(now);
      return {
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
      };
    }
    case "this_year": {
      const start = startOfYear(now);
      const end = endOfYear(now);
      return {
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
      };
    }
    case "custom": {
      return {
        startDate: customStart || format(startOfMonth(now), "yyyy-MM-dd"),
        endDate: customEnd || format(endOfMonth(now), "yyyy-MM-dd"),
      };
    }
    default: {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      return {
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
      };
    }
  }
}
