"use client";

import React, { useState, Suspense, lazy } from "react";
import { Toaster } from "sonner";
import { FinanceProvider, useFinance } from "@/lib/finance-context";
import { Sidebar, type NavItemKey } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import type { Transaction } from "@/lib/types";

// Dynamic loading of secondary views to avoid heavy initial bundle
const TransactionsView = lazy(() =>
  import("@/components/transactions/transactions-view").then((m) => ({ default: m.TransactionsView }))
);
const AccountsView = lazy(() =>
  import("@/components/accounts/accounts-view").then((m) => ({ default: m.AccountsView }))
);
const CreditCardsView = lazy(() =>
  import("@/components/cards/credit-cards-view").then((m) => ({ default: m.CreditCardsView }))
);
const LoansView = lazy(() =>
  import("@/components/loans/loans-view").then((m) => ({ default: m.LoansView }))
);
const ReportsView = lazy(() =>
  import("@/components/reports/reports-view").then((m) => ({ default: m.ReportsView }))
);
const SettingsView = lazy(() =>
  import("@/components/settings/settings-view").then((m) => ({ default: m.SettingsView }))
);
const PlanningView = lazy(() =>
  import("@/components/planning/planning-view").then((m) => ({ default: m.PlanningView }))
);
const TransactionModal = lazy(() =>
  import("@/components/transactions/transaction-modal").then((m) => ({ default: m.TransactionModal }))
);

function MainApp() {
  const [activePage, setActivePage] = useState<NavItemKey>("Dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const { user, loading, logout } = useFinance();

  const handleOpenNewTransaction = () => {
    setEditingTransaction(null);
    setTransactionModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setTransactionModalOpen(true);
  };

  // Prevenir flash de conteúdo não autenticado enquanto a sessão do Supabase é verificada
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3157a8] border-t-transparent" />
          <span className="text-xs font-medium text-slate-500">Iniciando ambiente seguro...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          current={activePage}
          onSelect={(item) => setActivePage(item)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onLogout={logout}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-50 h-full w-[240px]">
            <Sidebar
              current={activePage}
              onSelect={(item) => {
                setActivePage(item);
                setMobileMenuOpen(false);
              }}
              collapsed={false}
              onToggleCollapse={() => setMobileMenuOpen(false)}
              onLogout={logout}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-200 ${
          sidebarCollapsed ? "md:pl-[70px]" : "md:pl-[230px]"
        }`}
      >
        <Topbar
          title={activePage}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onNavigateToSettings={() => setActivePage("Configurações")}
          onNavigateTab={(tab) => setActivePage(tab as NavItemKey)}
        />

        <main className="flex-1 p-5 lg:p-7 max-w-[1600px] w-full mx-auto">
          {activePage === "Dashboard" && (
            <DashboardView
              onNewTransaction={handleOpenNewTransaction}
              onNavigateToTransactions={() => setActivePage("Lançamentos")}
              onNavigateToPlanning={() => setActivePage("Planejamento")}
              onEditTransaction={handleEditTransaction}
            />
          )}

          <Suspense fallback={<DashboardSkeleton />}>
            {activePage === "Lançamentos" && (
              <TransactionsView
                onNewTransaction={handleOpenNewTransaction}
                onEditTransaction={handleEditTransaction}
              />
            )}

            {activePage === "Planejamento" && (
              <PlanningView onNewTransaction={handleOpenNewTransaction} />
            )}

            {activePage === "Contas" && <AccountsView />}

            {activePage === "Cartões" && <CreditCardsView />}

            {activePage === "Empréstimos" && <LoansView />}

            {activePage === "Relatórios" && (
              <ReportsView onNewTransaction={handleOpenNewTransaction} />
            )}

            {activePage === "Configurações" && <SettingsView />}
          </Suspense>
        </main>
      </div>

      {/* Modal de Lançamentos (carregado dinamicamente somente quando acionado) */}
      {transactionModalOpen && (
        <Suspense fallback={null}>
          <TransactionModal
            isOpen={transactionModalOpen}
            onClose={() => setTransactionModalOpen(false)}
            transactionToEdit={editingTransaction}
          />
        </Suspense>
      )}

      {/* Notificações Toast */}
      <Toaster richColors position="top-right" />
    </div>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <MainApp />
    </FinanceProvider>
  );
}
