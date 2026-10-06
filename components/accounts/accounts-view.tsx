"use client";

import React, { useState } from "react";
import { Plus, Landmark, Wallet, Edit2, Trash2 } from "lucide-react";
import { useFinance } from "@/lib/finance-context";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { toast } from "sonner";
import type { Account, AccountType } from "@/lib/types";

export function AccountsView() {
  const { accounts, accountBalances, addAccount, updateAccount, removeAccount } = useFinance();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [type, setType] = useState<AccountType>("checking");
  const [openingBalance, setOpeningBalance] = useState("");
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);

  const handleOpenModal = (acc?: Account) => {
    if (acc) {
      setEditingAccount(acc);
      setName(acc.name);
      setInstitution(acc.institution || "");
      setType(acc.type);
      setOpeningBalance(String(acc.opening_balance));
    } else {
      setEditingAccount(null);
      setName("");
      setInstitution("");
      setType("checking");
      setOpeningBalance("0");
    }
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Informe o nome da conta.");
      return;
    }
    const val = parseFloat(openingBalance.replace(",", ".")) || 0;

    if (editingAccount) {
      updateAccount({
        id: editingAccount.id,
        name: name.trim(),
        institution: institution.trim() || null,
        type,
        opening_balance: val,
        is_active: true,
      });
      toast.success("Conta atualizada com sucesso.");
    } else {
      addAccount({
        name: name.trim(),
        institution: institution.trim() || null,
        type,
        opening_balance: val,
        is_active: true,
      });
      toast.success("Conta criada com sucesso.");
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (accountToDelete) {
      removeAccount(accountToDelete.id);
      toast.success("Conta removida com sucesso.");
      setAccountToDelete(null);
    }
  };

  const typeLabels: Record<AccountType, string> = {
    checking: "Conta Corrente",
    savings: "Poupança",
    cash: "Dinheiro / Espécie",
    digital_wallet: "Carteira Digital",
    investment: "Investimento",
    other: "Outro",
  };

  return (
    <div className="space-y-5">
      {/* Cabeçalho Contextual */}
      <PageHeader
        title="Contas"
        description="Gerencie suas contas e saldos."
        actionLabel="Nova conta"
        onAction={() => handleOpenModal()}
      />

      {/* Grid de Contas */}
      {accounts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <EmptyState
            icon={Landmark}
            title="Nenhuma conta cadastrada"
            description="Cadastre sua primeira conta para começar a organizar e acompanhar seus saldos."
            actionLabel="Adicionar conta"
            onAction={() => handleOpenModal()}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((acc) => {
            const currentBal = accountBalances[acc.id] ?? Number(acc.opening_balance);

            return (
              <div
                key={acc.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#3157a8]">
                        <Landmark size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{acc.name}</h4>
                        <span className="text-[11px] text-slate-400">
                          {acc.institution ? `${acc.institution} • ` : ""}
                          {typeLabels[acc.type]}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        title="Editar"
                        onClick={() => handleOpenModal(acc)}
                        className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        title="Excluir"
                        onClick={() => setAccountToDelete(acc)}
                        className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-5">
                    <span className="text-[11px] font-medium text-slate-400">Saldo atual</span>
                    <p
                      className={`text-2xl font-bold tracking-tight font-mono ${
                        currentBal >= 0 ? "text-slate-900" : "text-rose-600"
                      }`}
                    >
                      {formatCurrency(currentBal)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-400 flex justify-between">
                  <span>Saldo inicial:</span>
                  <span className="font-medium text-slate-600">{formatCurrency(acc.opening_balance)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Criar / Editar Conta */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-800">
              {editingAccount ? "Editar conta" : "Nova conta"}
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Preencha os dados da conta ou carteira financeira.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-medium text-slate-700">Nome da conta *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex.: Nubank Principal, Carteira"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Instituição bancária</label>
                <input
                  type="text"
                  placeholder="Ex.: Nubank, Itaú, Bradesco"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Tipo de conta</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AccountType)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                >
                  <option value="checking">Conta Corrente</option>
                  <option value="savings">Poupança</option>
                  <option value="digital_wallet">Carteira Digital</option>
                  <option value="investment">Investimento</option>
                  <option value="cash">Dinheiro em Espécie</option>
                  <option value="other">Outro</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Saldo inicial (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:border-blue-500 focus:outline-hidden"
                />
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
                  Salvar conta
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmação de Exclusão */}
      <ConfirmDialog
        isOpen={!!accountToDelete}
        title="Excluir conta?"
        description="Esta operação removerá a conta do seu painel financeiro."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setAccountToDelete(null)}
      />
    </div>
  );
}
