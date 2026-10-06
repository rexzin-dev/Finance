"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, CreditCard as CardIcon } from "lucide-react";
import { useFinance } from "@/lib/finance-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/formatters";
import {
  calculateInvoiceSchedule,
  splitInstallmentAmounts,
  formatMonthNameYear,
} from "@/lib/credit-card-utils";
import type {
  Transaction,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
} from "@/lib/types";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  "Pix",
  "Dinheiro",
  "Cartão de débito",
  "Cartão de crédito",
  "Boleto",
  "Transferência bancária",
  "Débito automático",
  "Carteira digital",
  "Outros",
];

export function TransactionModal({
  isOpen,
  onClose,
  transactionToEdit,
}: TransactionModalProps) {
  const {
    accounts,
    categories,
    creditCards,
    addTransaction,
    updateTransaction,
    addCreditCardPurchase,
  } = useFinance();

  const [type, setType] = useState<TransactionType>("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Pix");

  // Conta bancária (para Pix, Débito, Dinheiro, Transferência, Débito Automático, Boleto)
  const [accountId, setAccountId] = useState("");
  const [destinationAccountId, setDestinationAccountId] = useState("");

  // Cartão de Crédito
  const [selectedCardId, setSelectedCardId] = useState("");
  const [cardPaymentType, setCardPaymentType] = useState<"cash" | "installment">("cash");
  const [installmentsCount, setInstallmentsCount] = useState<number>(2);

  // Categorias e Datas
  const [categoryId, setCategoryId] = useState("");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<TransactionStatus>("paid");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicialização / Reset
  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setDescription(transactionToEdit.description);
      setAmount(String(transactionToEdit.amount));
      setAccountId(transactionToEdit.account_id || "");
      setDestinationAccountId(transactionToEdit.destination_account_id || "");
      setSelectedCardId(transactionToEdit.credit_card_id || creditCards[0]?.id || "");
      setCategoryId(transactionToEdit.category_id || "");
      setTransactionDate(transactionToEdit.transaction_date.slice(0, 10));
      setDueDate(transactionToEdit.due_date ? transactionToEdit.due_date.slice(0, 10) : "");
      setStatus(transactionToEdit.status);
      setPaymentMethod((transactionToEdit.payment_method as PaymentMethod) || "Pix");
      setNotes(transactionToEdit.notes || "");
    } else {
      setType("expense");
      setDescription("");
      setAmount("");
      setPaymentMethod("Pix");
      setAccountId(accounts[0]?.id || "");
      setDestinationAccountId("");
      setSelectedCardId(creditCards[0]?.id || "");
      setCardPaymentType("cash");
      setInstallmentsCount(2);
      setCategoryId("");
      setTransactionDate(new Date().toISOString().slice(0, 10));
      setDueDate("");
      setStatus("paid");
      setNotes("");
    }
  }, [transactionToEdit, isOpen, accounts, creditCards]);

  // Regra contextual de status padrão ao mudar a forma de pagamento
  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === "Boleto") {
      setStatus("pending");
    } else if (method === "Cartão de crédito") {
      setStatus("in_invoice");
    } else if (method === "Débito automático") {
      setStatus("pending");
    } else {
      setStatus("paid");
    }
  };

  // Cálculo de parcelas e faturas do cartão em tempo real
  const selectedCard = useMemo(() => {
    return creditCards.find((c) => c.id === selectedCardId);
  }, [creditCards, selectedCardId]);

  const installmentPreview = useMemo(() => {
    if (paymentMethod !== "Cartão de crédito" || !selectedCard) return null;
    const total = parseFloat(amount.replace(",", ".")) || 0;
    if (total <= 0) return null;

    const count = cardPaymentType === "cash" ? 1 : Math.max(1, installmentsCount);
    const amounts = splitInstallmentAmounts(total, count);

    const firstSchedule = calculateInvoiceSchedule(
      transactionDate,
      selectedCard.closing_day,
      selectedCard.due_day,
      0
    );

    const lastSchedule = calculateInvoiceSchedule(
      transactionDate,
      selectedCard.closing_day,
      selectedCard.due_day,
      count - 1
    );

    return {
      count,
      approxAmount: amounts[0],
      firstMonth: formatMonthNameYear(firstSchedule.referenceMonth),
      lastMonth: formatMonthNameYear(lastSchedule.referenceMonth),
      firstDueDate: firstSchedule.dueDate,
    };
  }, [
    paymentMethod,
    selectedCard,
    amount,
    cardPaymentType,
    installmentsCount,
    transactionDate,
  ]);

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => !c.kind || c.kind === type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount.replace(",", "."));
    if (isNaN(val) || val <= 0) {
      toast.error("Informe um valor numérico válido maior que zero.");
      return;
    }
    if (!description.trim()) {
      toast.error("Informe a descrição do lançamento.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (type === "expense" && paymentMethod === "Cartão de crédito") {
        if (!selectedCardId) {
          toast.error("Selecione um cartão de crédito.");
          setIsSubmitting(false);
          return;
        }

        // Criar a compra parcelada / à vista no cartão
        addCreditCardPurchase({
          credit_card_id: selectedCardId,
          description: description.trim(),
          category_id: categoryId || null,
          purchase_date: transactionDate,
          total_amount: val,
          payment_type: cardPaymentType,
          installments_count: cardPaymentType === "cash" ? 1 : installmentsCount,
          notes: notes.trim() || null,
        });

        toast.success(
          cardPaymentType === "cash"
            ? "Compra à vista lançada na fatura do cartão."
            : `Compra parcelada em ${installmentsCount}x vinculada às faturas.`
        );
      } else {
        // Transação financeira comum (Pix, Débito, Dinheiro, Boleto, etc.)
        const payload = {
          id: transactionToEdit?.id,
          type,
          description: description.trim(),
          amount: val,
          account_id: accountId || null,
          destination_account_id: type === "transfer" ? destinationAccountId || null : null,
          category_id: type === "transfer" ? null : categoryId || null,
          transaction_date: transactionDate,
          due_date: dueDate || null,
          status,
          payment_method: type === "transfer" ? "Transferência bancária" : paymentMethod,
          notes: notes.trim() || null,
        };

        if (transactionToEdit) {
          updateTransaction(payload);
          toast.success("Lançamento atualizado com sucesso.");
        } else {
          addTransaction(payload);
          toast.success("Lançamento criado com sucesso.");
        }
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Não foi possível salvar o lançamento. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {transactionToEdit ? "Editar lançamento" : "Novo lançamento"}
            </h3>
            <p className="text-xs text-slate-400">
              Preencha os campos abaixo de acordo com a forma de pagamento.
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tipo de Lançamento */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              setType("expense");
              handlePaymentMethodChange("Pix");
            }}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-colors ${
              type === "expense"
                ? "bg-rose-50 text-rose-700 border border-rose-200"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ArrowUpRight size={14} />
            Despesa
          </button>
          <button
            type="button"
            onClick={() => {
              setType("income");
              setStatus("received");
              setPaymentMethod("Pix");
            }}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-colors ${
              type === "income"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ArrowDownLeft size={14} />
            Receita
          </button>
          <button
            type="button"
            onClick={() => {
              setType("transfer");
              setStatus("paid");
              setPaymentMethod("Transferência bancária");
            }}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-colors ${
              type === "transfer"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ArrowLeftRight size={14} />
            Transferência
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Seção 1: Descrição e Valor */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-medium text-slate-700">Descrição *</label>
              <input
                type="text"
                required
                placeholder="Ex.: Supermercado, Aluguel"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-medium text-slate-700">Valor (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Seção 2: Forma de Pagamento (somente em Despesas) */}
          {type === "expense" && (
            <div>
              <label className="text-xs font-medium text-slate-700">Forma de pagamento *</label>
              <select
                value={paymentMethod}
                onChange={(e) => handlePaymentMethodChange(e.target.value as PaymentMethod)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Seção 3: CAMPOS ESPECÍFICOS DE CARTÃO DE CRÉDITO */}
          {type === "expense" && paymentMethod === "Cartão de crédito" && (
            <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/40 p-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#3157a8]">
                <CardIcon size={15} />
                <span>Configurações do Cartão de Crédito</span>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Cartão de Crédito *</label>
                <select
                  required
                  value={selectedCardId}
                  onChange={(e) => setSelectedCardId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                >
                  <option value="">Selecione um cartão...</option>
                  {creditCards.map((card) => {
                    const bankLabel = card.bank || "Cartão";
                    const digitsLabel = card.card_last_digits ? ` •••• ${card.card_last_digits}` : "";
                    return (
                      <option key={card.id} value={card.id}>
                        {card.name} ({bankLabel}{digitsLabel} • Fecha dia {card.closing_day} • Vence dia {card.due_day})
                      </option>
                    );
                  })}
                </select>
                {creditCards.length === 0 && (
                  <p className="mt-1 text-[11px] text-rose-600">
                    Cadastre um cartão no menu &quot;Cartões&quot; para lançar compras no crédito.
                  </p>
                )}
              </div>

              {/* Segmented Control: À vista ou Parcelado */}
              <div>
                <label className="text-xs font-medium text-slate-700">Tipo de compra</label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCardPaymentType("cash")}
                    className={`rounded-xl py-1.5 text-xs font-semibold transition-colors ${
                      cardPaymentType === "cash"
                        ? "bg-[#3157a8] text-white"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    À vista
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardPaymentType("installment")}
                    className={`rounded-xl py-1.5 text-xs font-semibold transition-colors ${
                      cardPaymentType === "installment"
                        ? "bg-[#3157a8] text-white"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Parcelado
                  </button>
                </div>
              </div>

              {/* Quantidade de Parcelas (somente se parcelado) */}
              {cardPaymentType === "installment" && (
                <div>
                  <label className="text-xs font-medium text-slate-700">Quantidade de parcelas</label>
                  <select
                    value={installmentsCount}
                    onChange={(e) => setInstallmentsCount(parseInt(e.target.value, 10))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                  >
                    {Array.from({ length: 23 }, (_, i) => i + 2).map((num) => (
                      <option key={num} value={num}>
                        {num}x
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Visualização e Previsão das Faturas antes de Salvar */}
              {installmentPreview && (
                <div className="rounded-xl border border-slate-200/80 bg-white p-3 text-xs space-y-1.5">
                  <p className="font-semibold text-slate-800">
                    {cardPaymentType === "cash"
                      ? "1x à vista na fatura"
                      : `${installmentPreview.count} parcelas de ${formatCurrency(installmentPreview.approxAmount)}`}
                  </p>
                  <div className="text-[11px] text-slate-500 space-y-0.5">
                    <p>
                      <strong>Primeira cobrança:</strong> {installmentPreview.firstMonth}
                    </p>
                    {cardPaymentType === "installment" && (
                      <p>
                        <strong>Última cobrança:</strong> {installmentPreview.lastMonth}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Seção 4: CONTA BANCÁRIA (apenas quando não é cartão de crédito) */}
          {!(type === "expense" && paymentMethod === "Cartão de crédito") && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700">
                  {type === "transfer" ? "Conta de Origem *" : "Conta Bancária / Carteira"}
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                >
                  <option value="">Selecione a conta...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              {type === "transfer" && (
                <div>
                  <label className="text-xs font-medium text-slate-700">Conta de Destino *</label>
                  <select
                    required
                    value={destinationAccountId}
                    onChange={(e) => setDestinationAccountId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                  >
                    <option value="">Selecione a conta destino...</option>
                    {accounts
                      .filter((a) => a.id !== accountId)
                      .map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {type !== "transfer" && (
                <div>
                  <label className="text-xs font-medium text-slate-700">Categoria</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                  >
                    <option value="">Selecione uma categoria...</option>
                    {filteredCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Seção 5: Categoria no Cartão de Crédito */}
          {type === "expense" && paymentMethod === "Cartão de crédito" && (
            <div>
              <label className="text-xs font-medium text-slate-700">Categoria</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
              >
                <option value="">Selecione uma categoria...</option>
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Seção 6: Datas e Situação */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700">
                {paymentMethod === "Cartão de crédito" ? "Data da compra *" : "Data do lançamento *"}
              </label>
              <input
                type="date"
                required
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Vencimento (apenas para não-cartão) */}
            {!(type === "expense" && paymentMethod === "Cartão de crédito") && (
              <div>
                <label className="text-xs font-medium text-slate-700">
                  {paymentMethod === "Boleto" || paymentMethod === "Débito automático"
                    ? "Vencimento *"
                    : "Vencimento (opcional)"}
                </label>
                <input
                  type="date"
                  required={paymentMethod === "Boleto"}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            )}
          </div>

          {/* Situação para transações que não são de cartão */}
          {!(type === "expense" && paymentMethod === "Cartão de crédito") && (
            <div>
              <label className="text-xs font-medium text-slate-700">Situação</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TransactionStatus)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
              >
                {type === "income" ? (
                  <>
                    <option value="received">Recebido</option>
                    <option value="to_receive">A receber</option>
                  </>
                ) : (
                  <>
                    <option value="paid">Pago</option>
                    <option value="pending">Pendente (Entra na previsão)</option>
                  </>
                )}
              </select>
            </div>
          )}

          {/* Observação */}
          <div>
            <label className="text-xs font-medium text-slate-700">Observações (opcional)</label>
            <textarea
              rows={2}
              placeholder="Detalhes adicionais..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Botões */}
          <div className="mt-5 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-xl text-xs text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              size="sm"
              className="rounded-xl bg-[#3157a8] text-xs font-semibold text-white hover:bg-[#25468b]"
            >
              {isSubmitting ? "Salvando..." : "Salvar lançamento"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
