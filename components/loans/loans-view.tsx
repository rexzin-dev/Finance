"use client";

import React, { useState } from "react";
import { Plus, HandCoins, CheckCircle2, Edit2, Trash2, Calendar } from "lucide-react";
import { useFinance } from "@/lib/finance-context";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { toast } from "sonner";
import type { Loan } from "@/lib/types";

export function LoansView() {
  const { loans, addLoan, updateLoan, removeLoan, payLoan } = useFinance();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [name, setName] = useState("");
  const [lender, setLender] = useState("");
  const [contractedAmount, setContractedAmount] = useState("");
  const [totalInstallments, setTotalInstallments] = useState("12");
  const [installmentValue, setInstallmentValue] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);

  const handleOpenModal = (loan?: Loan) => {
    if (loan) {
      setEditingLoan(loan);
      setName(loan.name);
      setLender(loan.lender || "");
      setContractedAmount(String(loan.contracted_amount));
      setTotalInstallments(String(loan.total_installments));
      setInstallmentValue(String(loan.installment_value));
      setNextDueDate(loan.next_due_date ? loan.next_due_date.slice(0, 10) : "");
    } else {
      setEditingLoan(null);
      setName("");
      setLender("");
      setContractedAmount("");
      setTotalInstallments("12");
      setInstallmentValue("");
      setNextDueDate(new Date().toISOString().slice(0, 10));
    }
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Informe a descrição/finalidade do empréstimo.");
      return;
    }
    const contracted = parseFloat(contractedAmount.replace(",", ".")) || 0;
    const installments = parseInt(totalInstallments, 10) || 1;
    const val = parseFloat(installmentValue.replace(",", ".")) || (contracted / installments);

    if (editingLoan) {
      updateLoan({
        id: editingLoan.id,
        name: name.trim(),
        lender: lender.trim() || null,
        contracted_amount: contracted,
        remaining_amount: Math.min(editingLoan.remaining_amount, contracted),
        total_installments: installments,
        paid_installments: editingLoan.paid_installments,
        installment_value: val,
        next_due_date: nextDueDate || null,
        status: editingLoan.status,
      });
      toast.success("Empréstimo atualizado com sucesso.");
    } else {
      addLoan({
        name: name.trim(),
        lender: lender.trim() || null,
        contracted_amount: contracted,
        remaining_amount: contracted,
        total_installments: installments,
        paid_installments: 0,
        installment_value: val,
        next_due_date: nextDueDate || null,
        status: "active",
      });
      toast.success("Empréstimo registrado com sucesso.");
    }
    setModalOpen(false);
  };

  const handlePayInstallment = (loanId: string) => {
    const res = payLoan(loanId);
    if (res) {
      toast.success("Pagamento de parcela registrado.");
    }
  };

  const handleDelete = () => {
    if (loanToDelete) {
      removeLoan(loanToDelete.id);
      toast.success("Empréstimo removido com sucesso.");
      setLoanToDelete(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Cabeçalho Contextual */}
      <PageHeader
        title="Empréstimos"
        description="Acompanhe contratos e parcelas."
        actionLabel="Novo empréstimo"
        onAction={() => handleOpenModal()}
      />

      {/* Grid de Empréstimos */}
      {loans.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <EmptyState
            icon={HandCoins}
            title="Nenhum empréstimo registrado"
            description="Cadastre seus contratos e financiamentos para manter as parcelas em dia."
            actionLabel="Registrar empréstimo"
            onAction={() => handleOpenModal()}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loans.map((loan) => {
            const isCompleted = loan.status === "completed" || loan.remaining_amount <= 0;
            const progress = Math.min(
              100,
              loan.total_installments > 0
                ? (loan.paid_installments / loan.total_installments) * 100
                : 100
            );

            return (
              <div
                key={loan.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700">
                        <HandCoins size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{loan.name}</h4>
                        <span className="text-[11px] text-slate-400">
                          {loan.lender ? `${loan.lender} • ` : ""}
                          {isCompleted ? "Quitado" : "Em andamento"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        title="Editar"
                        onClick={() => handleOpenModal(loan)}
                        className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        title="Excluir"
                        onClick={() => setLoanToDelete(loan)}
                        className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] font-medium text-slate-400">Saldo devedor</span>
                      <p className="text-base font-bold text-rose-600 font-mono">
                        {formatCurrency(loan.remaining_amount)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-slate-400">Valor da parcela</span>
                      <p className="text-base font-bold text-slate-800 font-mono">
                        {formatCurrency(loan.installment_value)}
                      </p>
                    </div>
                  </div>

                  {/* Progresso de Parcelas */}
                  <div className="mt-4">
                    <div className="flex justify-between text-[11px] font-medium text-slate-500 mb-1">
                      <span>
                        Parcelas: {loan.paid_installments} de {loan.total_installments}
                      </span>
                      <span>{progress.toFixed(0)}% pago</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full bg-[#3157a8] transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-3 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">
                    {loan.next_due_date ? (
                      <span>Próx. venc: {formatDate(loan.next_due_date)}</span>
                    ) : (
                      <span>Finalizado</span>
                    )}
                  </div>

                  {!isCompleted && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePayInstallment(loan.id)}
                      className="h-7 gap-1 rounded-lg px-2 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      <CheckCircle2 size={12} />
                      Pagar parcela
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Criar / Editar Empréstimo */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-800">
              {editingLoan ? "Editar empréstimo" : "Novo empréstimo"}
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Insira os dados do contrato para acompanhamento de parcelas.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-medium text-slate-700">Nome / Finalidade *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex.: Reforma, Financiamento Veículo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Instituição / Credor</label>
                <input
                  type="text"
                  placeholder="Ex.: Banco do Brasil, Caixa"
                  value={lender}
                  onChange={(e) => setLender(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Valor contratado (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={contractedAmount}
                    onChange={(e) => setContractedAmount(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Parcelas</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={totalInstallments}
                    onChange={(e) => setTotalInstallments(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Valor da parcela (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Calculado auto"
                    value={installmentValue}
                    onChange={(e) => setInstallmentValue(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Próximo vencimento</label>
                  <input
                    type="date"
                    value={nextDueDate}
                    onChange={(e) => setNextDueDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl text-xs text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-xl bg-[#3157a8] text-xs font-semibold text-white hover:bg-[#25468b]"
                >
                  Salvar empréstimo
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmação de Exclusão */}
      <ConfirmDialog
        isOpen={!!loanToDelete}
        title="Excluir empréstimo?"
        description="Esta operação removerá o empréstimo da sua lista."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setLoanToDelete(null)}
      />
    </div>
  );
}
