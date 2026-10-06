import { formatCurrency, formatDate } from "./formatters";
import type { Transaction } from "./types";

export function exportTransactionsToCSV(transactions: Transaction[], filename = "fluxo_lancamentos.csv") {
  const headers = ["Data", "Descricao", "Tipo", "Categoria", "Conta", "Status", "Valor (R$)"];
  const rows = transactions.map((t) => [
    formatDate(t.transaction_date),
    `"${(t.description || "").replace(/"/g, '""')}"`,
    t.type === "income" ? "Receita" : t.type === "expense" ? "Despesa" : "Transferência",
    `"${(t.category_name || "-").replace(/"/g, '""')}"`,
    `"${(t.account_name || "-").replace(/"/g, '""')}"`,
    t.status,
    t.amount.toFixed(2).replace(".", ","),
  ]);

  const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportTransactionsToXLSX(transactions: Transaction[], filename = "fluxo_lancamentos.xlsx") {
  const XLSX = await import("xlsx");
  const rows = transactions.map((t) => ({
    Data: formatDate(t.transaction_date),
    Descrição: t.description,
    Tipo: t.type === "income" ? "Receita" : t.type === "expense" ? "Despesa" : "Transferência",
    Categoria: t.category_name || "-",
    Conta: t.account_name || "-",
    Situação: t.status === "paid" ? "Pago" : t.status === "received" ? "Recebido" : "Pendente",
    "Valor (R$)": Number(t.amount) || 0,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Lançamentos");
  XLSX.writeFile(workbook, filename);
}

export async function exportTransactionsToPDF(
  transactions: Transaction[],
  periodLabel: string,
  summary: { totalIncome: number; totalExpense: number; result: number },
  filename = "fluxo_relatorio.pdf"
) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF();

  // Cabeçalho
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(49, 87, 168);
  doc.text("fluxo", 14, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("Relatório Financeiro Pessoal", 35, 18);

  doc.setFontSize(9);
  doc.text(`Período: ${periodLabel} | Gerado em: ${formatDate(new Date().toISOString())}`, 14, 26);

  // Resumo Financeiro
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 30, 182, 16, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  doc.text(`Receitas: ${formatCurrency(summary.totalIncome)}`, 20, 40);
  doc.text(`Despesas: ${formatCurrency(summary.totalExpense)}`, 80, 40);
  doc.text(`Resultado: ${formatCurrency(summary.result)}`, 140, 40);

  // Tabela
  const body = transactions.map((t) => [
    formatDate(t.transaction_date),
    t.description,
    t.category_name || "-",
    t.account_name || "-",
    t.type === "income" ? "Receita" : t.type === "expense" ? "Despesa" : "Transferência",
    t.status === "paid" || t.status === "received" ? "Realizado" : "Pendente",
    (t.type === "income" ? "+ " : t.type === "expense" ? "- " : "") + formatCurrency(t.amount),
  ]);

  autoTable(doc, {
    startY: 52,
    head: [["Data", "Descrição", "Categoria", "Conta", "Tipo", "Status", "Valor"]],
    body,
    styles: { fontSize: 8, font: "helvetica" },
    headStyles: { fillColor: [49, 87, 168], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  doc.save(filename);
}

export async function exportMonthlyClosingToPDF(params: {
  monthLabel: string;
  closing: any;
  budgetAnalysis: any[];
  commitments: any[];
  filename?: string;
}) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF();

  const { monthLabel, closing, budgetAnalysis, commitments, filename = `fechamento_${monthLabel.replace("/", "_")}.pdf` } = params;

  // Cabeçalho
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(49, 87, 168);
  doc.text("fluxo", 14, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  doc.text(`Fechamento Consolidado: ${monthLabel}`, 35, 18);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Fotografia registrada em: ${formatDate(closing.closed_at || new Date().toISOString())} por ${closing.closed_by || "Usuário"}`, 14, 26);

  // Cards Resumo
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 30, 182, 22, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  doc.text(`Receitas: ${formatCurrency(closing.income_total)}`, 20, 39);
  doc.text(`Despesas pagas: ${formatCurrency(closing.expense_total)}`, 75, 39);
  doc.text(`Resultado: ${formatCurrency(closing.result)}`, 135, 39);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Faturas / Compromissos do período: ${formatCurrency(closing.committed_total)}`, 20, 47);
  doc.text(`Pendências no fechamento: ${formatCurrency(closing.pending_expenses)}`, 110, 47);

  // Tabela Orçado vs Realizado
  const budgetRows = budgetAnalysis.map((b) => [
    b.categoryName,
    formatCurrency(b.budgetAmount),
    formatCurrency(b.realizedAmount),
    formatCurrency(b.committedAmount),
    formatCurrency(b.availableAmount),
    `${Math.round(b.percentage)}%`,
  ]);

  autoTable(doc, {
    startY: 58,
    head: [["Categoria", "Orçado", "Realizado (Pago)", "Comprometido", "Disponível", "%"]],
    body: budgetRows,
    styles: { fontSize: 8, font: "helvetica" },
    headStyles: { fillColor: [49, 87, 168], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  doc.save(filename);
}
