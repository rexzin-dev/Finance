"use client";

import React from "react";
import { Plus, User, Calendar, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertsCenter } from "./alerts-center";
import { useFinance } from "@/lib/finance-context";
import type { PeriodFilterOption } from "@/lib/types";

interface TopbarProps {
  title: string;
  onOpenMobileMenu?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateTab?: (tab: string) => void;
}

const periodOptions: { label: string; value: PeriodFilterOption }[] = [
  { label: "Este mês", value: "this_month" },
  { label: "Mês anterior", value: "last_month" },
  { label: "Últimos 3 meses", value: "last_3_months" },
  { label: "Últimos 6 meses", value: "last_6_months" },
  { label: "Este ano", value: "this_year" },
];

export function Topbar({
  title,
  onOpenMobileMenu,
  onNavigateToSettings,
  onNavigateTab,
}: TopbarProps) {
  const { period, setPeriod, user, loading, logout } = useFinance();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Fechar menu ao clicar fora
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200/60 bg-white/95 px-5 backdrop-blur-xs lg:px-8">
      {/* Esquerda: Botão Mobile (Sem título duplicado) */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenMobileMenu}
          aria-label="Abrir menu"
          className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Direita: Período (apenas Dashboard e Relatórios) + Novo Lançamento Global + Menu Perfil */}
      <div className="flex items-center gap-3">
        {/* Filtro de Período */}
        {(title === "Dashboard" || title === "Relatórios") && (
          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodFilterOption)}
              className="h-8 cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-1 pl-2.5 pr-7 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 focus:border-blue-500 focus:outline-hidden"
            >
              {periodOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-2 top-2 text-slate-400">
              <Calendar size={13} />
            </div>
          </div>
        )}

        {/* Central de Alertas Reais */}
        <AlertsCenter onNavigateTab={onNavigateTab} />

        {/* Menu do Perfil do Usuário */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Menu do usuário"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 focus:outline-hidden transition-colors"
          >
            {!loading ? (user?.full_name || user?.email || "U")[0].toUpperCase() : "U"}
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-lg shadow-slate-900/5 z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {user?.full_name || "Usuário"}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onNavigateToSettings?.();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User size={14} className="text-slate-400" />
                  Meu perfil
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onNavigateToSettings?.();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Configurações & Segurança
                </button>

                {/* Exibir Administração de usuários somente se Admin */}
                {user?.role === "admin" && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onNavigateToSettings?.();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#3157a8] hover:bg-blue-50/60 transition-colors"
                  >
                    Administração de usuários
                  </button>
                )}
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
