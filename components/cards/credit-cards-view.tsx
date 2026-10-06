"use client";

import React, { useState } from "react";
import { Plus, CreditCard as CardIcon, Edit2, Trash2, CheckCircle2, ChevronRight, X } from "lucide-react";
import { useFinance } from "@/lib/finance-context";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { formatMonthNameYear } from "@/lib/credit-card-utils";
import { BANK_VISUALS, CARD_BRANDS, getBankVisual } from "@/lib/card-brand-visuals";
import { CreditCardPreview } from "./credit-card-preview";
import { BankLogo, CardBrandLogo } from "./bank-logos";
import { toast } from "sonner";
import type { CreditCard, CreditCardInvoice } from "@/lib/types";

export function CreditCardsView() {
  const {
    creditCards,
    invoices,
    installments,
    accounts,
    addCreditCard,
    updateCreditCard,
    removeCreditCard,
    payInvoice,
  } = useFinance();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [name, setName] = useState("");
  const [bank, setBank] = useState("");
  const [bankCode, setBankCode] = useState("nubank");
  const [cardBrand, setCardBrand] = useState("mastercard");
  const [cardLastDigits, setCardLastDigits] = useState("4582");
  const [useAutoColor, setUseAutoColor] = useState(true);
  const [customColor, setCustomColor] = useState("#1e293b");
  const [creditLimit, setCreditLimit] = useState("");
  const [closingDay, setClosingDay] = useState("5");
  const [dueDay, setDueDay] = useState("12");
  const [cardToDelete, setCardToDelete] = useState<CreditCard | null>(null);

  // Pagamento de fatura
  const [payingInvoice, setPayingInvoice] = useState<CreditCardInvoice | null>(null);
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));

  // Detalhes das faturas de um cartão
  const [selectedCardInvoices, setSelectedCardInvoices] = useState<CreditCard | null>(null);

  const handleOpenModal = (card?: CreditCard) => {
    if (card) {
      setEditingCard(card);
      setName(card.name);
      setBank(card.bank || "");
      setBankCode(card.bank_code || "other");
      setCardBrand(card.card_brand || "mastercard");
      setCardLastDigits(card.card_last_digits || "");
      setUseAutoColor(card.use_auto_color ?? true);
      setCustomColor(card.custom_color || card.color || "#1e293b");
      setCreditLimit(String(card.credit_limit));
      setClosingDay(String(card.closing_day));
      setDueDay(String(card.due_day));
    } else {
      setEditingCard(null);
      setName("");
      setBank("");
      setBankCode("nubank");
      setCardBrand("mastercard");
      setCardLastDigits("");
      setUseAutoColor(true);
      setCustomColor("#1e293b");
      setCreditLimit("1000");
      setClosingDay("5");
      setDueDay("12");
    }
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Informe o nome do cartão.");
      return;
    }
    const limit = parseFloat(creditLimit.replace(",", ".")) || 0;
    const closing = parseInt(closingDay, 10);
    const due = parseInt(dueDay, 10);

    const bankNameFormatted = bankCode !== "other" && BANK_VISUALS[bankCode]
      ? BANK_VISUALS[bankCode].name
      : bank.trim() || "Cartão";

    if (editingCard) {
      updateCreditCard({
        id: editingCard.id,
        name: name.trim(),
        bank: bankNameFormatted,
        bank_code: bankCode,
        card_brand: cardBrand,
        card_last_digits: cardLastDigits.trim() || null,
        use_auto_color: useAutoColor,
        custom_color: customColor,
        color: useAutoColor ? null : customColor,
        credit_limit: limit,
        closing_day: closing,
        due_day: due,
        is_active: true,
      });
      toast.success("Cartão atualizado com sucesso.");
    } else {
      addCreditCard({
        name: name.trim(),
        bank: bankNameFormatted,
        bank_code: bankCode,
        card_brand: cardBrand,
        card_last_digits: cardLastDigits.trim() || null,
        use_auto_color: useAutoColor,
        custom_color: customColor,
        color: useAutoColor ? null : customColor,
        credit_limit: limit,
        closing_day: closing,
        due_day: due,
        is_active: true,
      });
      toast.success("Cartão cadastrado com sucesso.");
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (cardToDelete) {
      removeCreditCard(cardToDelete.id);
      toast.success("Cartão removido com sucesso.");
      setCardToDelete(null);
    }
  };

  const handleConfirmPayInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;
    if (!paymentAccountId) {
      toast.error("Selecione a conta utilizada para pagamento da fatura.");
      return;
    }

    try {
      payInvoice(payingInvoice.id, {
        payment_account_id: paymentAccountId,
        payment_date: paymentDate,
      });
      toast.success("Fatura liquidada com sucesso! O valor foi deduzido da conta bancária.");
      setPayingInvoice(null);
    } catch (err: any) {
      toast.error(err.message || "Erro ao pagar fatura.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho Contextual */}
      <PageHeader
        title="Cartões"
        description="Gerencie cartões, limites e faturas."
        actionLabel="Novo cartão"
        onAction={() => handleOpenModal()}
      />

      {/* Grid de Cartões */}
      {creditCards.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <EmptyState
            icon={CardIcon}
            title="Nenhum cartão cadastrado"
            description="Cadastre seus cartões de crédito para monitorar limites e faturas reais."
            actionLabel="Adicionar cartão"
            onAction={() => handleOpenModal()}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {creditCards.map((card) => {
            // Faturas reais do cartão
            const cardInvoices = invoices.filter((i) => i.credit_card_id === card.id);
            const openInvoices = cardInvoices.filter((i) => i.status !== "paid");

            // Fatura atual (a primeira aberta ou com vencimento mais próximo)
            const sortedOpen = [...openInvoices].sort((a, b) => a.due_date.localeCompare(b.due_date));
            const currentInvoice = sortedOpen[0];
            const nextInvoice = sortedOpen[1];

            // Limite consumido = soma de todas as faturas abertas e parcelas futuras não pagas
            const totalCommittedOnCard = openInvoices.reduce((acc, i) => acc + (Number(i.total_amount) || 0), 0);
            const availableLimit = Math.max(0, card.credit_limit - totalCommittedOnCard);

            const visual = getBankVisual(
              card.bank_code || card.bank,
              card.use_auto_color === false ? card.custom_color || card.color : undefined
            );

            return (
              <div
                key={card.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/70 bg-white shadow-xs transition-all hover:shadow-sm overflow-hidden"
              >
                <div>
                  {/* Topo do Cartão com Identidade Visual */}
                  <div
                    className="p-4 flex items-center justify-between transition-colors relative"
                    style={{
                      background: visual.gradient,
                      color: visual.textColor,
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <BankLogo code={card.bank_code || card.bank} />
                    </div>

                    <div className="flex items-center gap-2">
                      <CardBrandLogo brand={card.card_brand || "mastercard"} />

                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 bg-black/25 backdrop-blur-xs rounded-lg p-0.5 ml-1">
                        <button
                          title="Editar"
                          onClick={() => handleOpenModal(card)}
                          className="grid h-6 w-6 place-items-center rounded-md text-white/80 hover:bg-white/20 hover:text-white"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          title="Excluir"
                          onClick={() => setCardToDelete(card)}
                          className="grid h-6 w-6 place-items-center rounded-md text-white/80 hover:bg-rose-500 hover:text-white"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Informações Básicas do Cartão */}
                  <div className="px-5 pt-3.5 pb-2">
                    <div className="flex items-baseline justify-between">
                      <h4 className="text-sm font-bold text-slate-800">{card.name}</h4>
                      <span className="font-mono text-xs font-medium text-slate-400">
                        {card.card_last_digits ? `•••• ${card.card_last_digits}` : (card.bank || visual.name)}
                      </span>
                    </div>
                  </div>

                  {/* Fatura Atual e Próxima */}
                  <div className="mt-5 grid grid-cols-2 gap-3 border-y border-slate-100 py-3">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Fatura atual</span>
                      <p className="text-lg font-bold font-mono text-slate-900">
                        {currentInvoice ? formatCurrency(currentInvoice.total_amount) : "R$ 0,00"}
                      </p>
                      {currentInvoice && (
                        <span className="text-[10px] text-slate-400">
                          Vence: {formatDate(currentInvoice.due_date)}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Próxima fatura</span>
                      <p className="text-lg font-bold font-mono text-slate-600">
                        {nextInvoice ? formatCurrency(nextInvoice.total_amount) : "R$ 0,00"}
                      </p>
                      {nextInvoice && (
                        <span className="text-[10px] text-slate-400">
                          Vence: {formatDate(nextInvoice.due_date)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Limites */}
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400">Limite disponível:</span>
                      <p className="font-bold font-mono text-emerald-600">
                        {formatCurrency(availableLimit)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400">Limite total:</span>
                      <p className="font-bold font-mono text-slate-700">
                        {formatCurrency(card.credit_limit)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rodapé do Card */}
                <div className="mt-5 border-t border-slate-100 pt-3 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    Fecha dia {card.closing_day} • Vence dia {card.due_day}
                  </span>

                  <button
                    onClick={() => setSelectedCardInvoices(card)}
                    className="flex items-center gap-1 font-semibold text-[#3157a8] hover:text-[#203c7a]"
                  >
                    Ver faturas <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Detalhes das Faturas do Cartão Selecionado */}
      {selectedCardInvoices && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-base font-bold text-slate-800">
                  Faturas — {selectedCardInvoices.name}
                </h4>
                <p className="text-xs text-slate-400">
                  Histórico e faturas futuras calculadas a partir das compras cadastradas
                </p>
              </div>
              <button
                onClick={() => setSelectedCardInvoices(null)}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="my-4 flex-1 overflow-y-auto divide-y divide-slate-100 pr-1">
              {invoices.filter((i) => i.credit_card_id === selectedCardInvoices.id).length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  Nenhuma fatura com compras lançadas neste cartão.
                </p>
              ) : (
                invoices
                  .filter((i) => i.credit_card_id === selectedCardInvoices.id)
                  .sort((a, b) => a.reference_month.localeCompare(b.reference_month))
                  .map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between py-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 uppercase font-mono">
                            {formatMonthNameYear(inv.reference_month)}
                          </span>
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                              inv.status === "paid"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {inv.status === "paid" ? "Paga" : "Aberta"}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Fecha em: {formatDate(inv.closing_date)} • Vence em: {formatDate(inv.due_date)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold font-mono text-sm text-slate-800">
                          {formatCurrency(inv.total_amount)}
                        </span>
                        {inv.status !== "paid" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setPaymentAccountId(accounts[0]?.id || "");
                              setPayingInvoice(inv);
                            }}
                            className="h-7 gap-1 rounded-lg bg-[#3157a8] px-2.5 text-[11px] font-semibold text-white hover:bg-[#25468b]"
                          >
                            Pagar fatura
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCardInvoices(null)}
                className="rounded-xl text-xs"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pagamento de Fatura */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h4 className="text-base font-bold text-slate-800">Pagar fatura do cartão</h4>
            <p className="mt-1 text-xs text-slate-400">
              Valor a pagar:{" "}
              <strong className="text-slate-700 font-mono">
                {formatCurrency(payingInvoice.total_amount)}
              </strong>
            </p>

            <form onSubmit={handleConfirmPayInvoice} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-medium text-slate-700">Conta de pagamento *</label>
                <select
                  required
                  value={paymentAccountId}
                  onChange={(e) => setPaymentAccountId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                >
                  <option value="">Selecione a conta...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  O saldo desta conta será reduzido imediatamente após o pagamento.
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Data do pagamento *</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPayingInvoice(null)}
                  className="rounded-xl text-xs text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-xl bg-[#3157a8] text-xs font-semibold text-white hover:bg-[#25468b]"
                >
                  Confirmar pagamento
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Criar / Editar Cartão com Preview em Tempo Real */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl my-6">
            <h3 className="text-base font-bold text-slate-800">
              {editingCard ? "Editar cartão de crédito" : "Novo cartão de crédito"}
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Defina a instituição financeira, bandeira e limites com identidade visual automática.
            </p>

            {/* PREVIEW EM TEMPO REAL */}
            <div className="mt-4 mb-5 rounded-2xl bg-slate-50 p-4 border border-slate-100 flex flex-col items-center">
              <span className="text-[10px] font-semibold uppercase text-slate-400 mb-2.5 tracking-wider">
                Preview em tempo real
              </span>
              <CreditCardPreview
                bankCode={bankCode}
                bankName={bank}
                cardName={name}
                cardBrand={cardBrand}
                lastDigits={cardLastDigits}
                customColor={customColor}
                useAutoColor={useAutoColor}
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Instituição financeira */}
                <div>
                  <label className="text-xs font-medium text-slate-700">Instituição financeira *</label>
                  <select
                    value={bankCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      setBankCode(code);
                      if (code !== "other" && BANK_VISUALS[code]) {
                        setBank(BANK_VISUALS[code].name);
                      }
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                  >
                    {Object.values(BANK_VISUALS).map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bandeira */}
                <div>
                  <label className="text-xs font-medium text-slate-700">Bandeira do cartão *</label>
                  <select
                    value={cardBrand}
                    onChange={(e) => setCardBrand(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                  >
                    {CARD_BRANDS.map((brand) => (
                      <option key={brand.code} value={brand.code}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Se selecionar outros, permite digitar nome */}
              {bankCode === "other" && (
                <div>
                  <label className="text-xs font-medium text-slate-700">Nome do banco / instituição</label>
                  <input
                    type="text"
                    placeholder="Ex.: Cooperativa de Crédito, Wise, Revolut"
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Nome / Apelido */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-700">Nome do cartão *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex.: Nubank Principal, Itaú Black"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Últimos 4 dígitos */}
                <div>
                  <label className="text-xs font-medium text-slate-700">Últimos dígitos</label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="Ex.: 4582"
                    value={cardLastDigits}
                    onChange={(e) => setCardLastDigits(e.target.value.replace(/\D/g, ""))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Opção Identidade Automática */}
              <div className="rounded-xl border border-slate-200/80 p-3 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-slate-700">Identidade visual automática</span>
                    <p className="text-[11px] text-slate-400">
                      Usa o esquema de cores e logo oficial da instituição selecionada.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useAutoColor}
                      onChange={(e) => setUseAutoColor(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3157a8]"></div>
                  </label>
                </div>

                {!useAutoColor && (
                  <div className="pt-2 border-t border-slate-200/60 flex items-center gap-3">
                    <label className="text-xs font-medium text-slate-600">Cor personalizada:</label>
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="h-7 w-12 rounded border border-slate-300 cursor-pointer bg-white"
                    />
                    <span className="font-mono text-xs text-slate-500 uppercase">{customColor}</span>
                  </div>
                )}
              </div>

              {/* Limite de crédito */}
              <div>
                <label className="text-xs font-medium text-slate-700">Limite de crédito (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0,00"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Dia de fechamento *</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={closingDay}
                    onChange={(e) => setClosingDay(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Dia de vencimento *</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
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
                  Salvar cartão
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmação de Exclusão */}
      <ConfirmDialog
        isOpen={!!cardToDelete}
        title="Excluir cartão?"
        description="Esta operação removerá o cartão cadastrado e suas faturas abertas."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setCardToDelete(null)}
      />
    </div>
  );
}
