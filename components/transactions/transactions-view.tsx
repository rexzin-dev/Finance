"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Download,
} from "lucide-react";
import { useFinance } from "@/lib/finance-context";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { toast } from "sonner";
import type { Transaction, TransactionType } from "@/lib/types";

interface TransactionsViewProps {
  onNewTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
}

export function TransactionsView({
  onNewTransaction,
  onEditTransaction,
}: TransactionsViewProps) {
  const { transactions, accounts, categories, removeTransaction } = useFinance();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterAccount, setFilterAccount] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Exclusão
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  // Filtragem
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (filterType !== "all" && tx.type !== filterType) return false;
      if (filterAccount !== "all" && tx.account_id !== filterAccount) return false;
      if (filterCategory !== "all" && tx.category_id !== filterCategory) return false;
      if (filterStatus !== "all" && tx.status !== filterStatus) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const descMatch = tx.description.toLowerCase().includes(term);
        const catMatch = (tx.category_name || "").toLowerCase().includes(term);
        const accMatch = (tx.account_name || "").toLowerCase().includes(term);
        if (!descMatch && !catMatch && !accMatch) return false;
      }
      return true;
    });
  }, [transactions, filterType, filterAccount, filterCategory, filterStatus, searchTerm]);

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    filterType !== "all" ||
    filterAccount !== "all" ||
    filterCategory !== "all" ||
    filterStatus !== "all";

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setFilterAccount("all");
    setFilterCategory("all");
    setFilterStatus("all");
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const handleDelete = () => {
    if (txToDelete) {
      removeTransaction(txToDelete.id);
      toast.success("Registro removido com sucesso.");
      setTxToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho Contextual */}
      <PageHeader
        title="Lançamentos"
        description="Gerencie receitas, despesas e transferências."
        actionLabel="Novo lançamento"
        onAction={onNewTransaction}
      />

      {/* Barra de Filtros Compacta */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/70 bg-white p-2.5">
        {/* Busca: ~28% */}
        <div className="relative min-w-[200px] flex-1 lg:max-w-[28%]">
          <Search className="pointer-events-none absolute left-3 top-2.5 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Buscar descrição..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="h-8 w-full rounded-lg border border-slate-200 bg-white py-1 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden"
          />
        </div>

        {/* Tipo: ~17% */}
        <div className="min-w-[130px] flex-1 lg:max-w-[17%]">
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPage(1);
            }}
            className="h-8 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-hidden"
          >
            <option value="all">Todos os tipos</option>
            <option value="income">Receita</option>
            <option value="expense">Despesa</option>
            <option value="transfer">Transferência</option>
          </select>
        </div>

        {/* Conta: ~18% */}
        <div className="min-w-[140px] flex-1 lg:max-w-[18%]">
          <select
            value={filterAccount}
            onChange={(e) => {
              setFilterAccount(e.target.value);
              setPage(1);
            }}
            className="h-8 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-hidden"
          >
            <option value="all">Todas as contas</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Categoria: ~20% */}
        <div className="min-w-[150px] flex-1 lg:max-w-[20%]">
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setPage(1);
            }}
            className="h-8 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-hidden"
          >
            <option value="all">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status: ~17% */}
        <div className="min-w-[130px] flex-1 lg:max-w-[17%]">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="h-8 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-hidden"
          >
            <option value="all">Todos os status</option>
            <option value="paid">Pago / Concluído</option>
            <option value="received">Recebido</option>
            <option value="pending">Pendente</option>
            <option value="to_receive">A receber</option>
          </select>
        </div>

        {/* Botão Limpar Filtros: visível somente se algum filtro ativo */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="h-8 whitespace-nowrap rounded-lg px-2.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Tabela de Lançamentos Compacta */}
      <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2.5">Data</th>
                <th className="px-4 py-2.5">Descrição</th>
                <th className="px-4 py-2.5">Categoria</th>
                <th className="px-4 py-2.5">Conta</th>
                <th className="px-4 py-2.5">Tipo</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Valor</th>
                <th className="px-4 py-2.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <p className="text-xs text-slate-400">
                      {transactions.length === 0
                        ? "Nenhum lançamento por enquanto."
                        : "Nenhum lançamento encontrado com estes filtros."}
                    </p>
                  </td>
                </tr>
              ) : (
                paginated.map((tx) => {
                  const isIncome = tx.type === "income";
                  const isExpense = tx.type === "expense";

                  return (
                    <tr key={tx.id} className="transition-colors hover:bg-slate-50/50">
                      <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[11px] text-slate-500">
                        {formatDate(tx.transaction_date)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-medium text-slate-800">{tx.description}</span>
                        {tx.notes && <p className="text-[10px] text-slate-400">{tx.notes}</p>}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {tx.category_name ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                            {tx.category_color && (
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: tx.category_color }}
                              />
                            )}
                            {tx.category_name}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">{tx.account_name || "-"}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                            isIncome
                              ? "bg-emerald-50 text-emerald-700"
                              : isExpense
                              ? "bg-rose-50 text-rose-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {isIncome && <ArrowDownLeft size={11} />}
                          {isExpense && <ArrowUpRight size={11} />}
                          {tx.type === "transfer" && <ArrowLeftRight size={11} />}
                          {isIncome ? "Receita" : isExpense ? "Despesa" : "Transferência"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                            tx.status === "paid" || tx.status === "received"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {tx.status === "paid"
                            ? "Pago"
                            : tx.status === "received"
                            ? "Recebido"
                            : tx.status === "to_receive"
                            ? "A receber"
                            : "Pendente"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-xs font-semibold">
                        <span
                          className={
                            isIncome
                              ? "text-emerald-600"
                              : isExpense
                              ? "text-rose-600"
                              : "text-slate-700"
                          }
                        >
                          {isIncome ? "+ " : isExpense ? "- " : ""}
                          {formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            title="Editar"
                            onClick={() => onEditTransaction(tx)}
                            className="grid h-6 w-6 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            title="Excluir"
                            onClick={() => setTxToDelete(tx)}
                            className="grid h-6 w-6 place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé: Contador & Paginação (apenas quando > 1 página) */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">
          <span>
            {filtered.length === 0
              ? "0 lançamentos"
              : `${(currentPage - 1) * pageSize + 1}–${Math.min(
                  currentPage * pageSize,
                  filtered.length
                )} de ${filtered.length} lançamentos`}
          </span>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-7 rounded-lg px-2 text-xs"
              >
                Anterior
              </Button>
              <span className="px-2 text-xs font-medium">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-7 rounded-lg px-2 text-xs"
              >
                Próxima
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmação de Exclusão */}
      <ConfirmDialog
        isOpen={!!txToDelete}
        title="Excluir lançamento?"
        description="Esta operação removerá permanentemente este lançamento e atualizará seus saldos e relatórios."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setTxToDelete(null)}
      />
    </div>
  );
}
