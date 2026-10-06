"use client";

import React from "react";
import {
  LayoutDashboard,
  ReceiptText,
  Landmark,
  CreditCard,
  HandCoins,
  BarChart2,
  CalendarDays,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItemKey =
  | "Dashboard"
  | "Lançamentos"
  | "Planejamento"
  | "Contas"
  | "Cartões"
  | "Empréstimos"
  | "Relatórios"
  | "Configurações";

interface SidebarProps {
  current: NavItemKey;
  onSelect: (item: NavItemKey) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onLogout?: () => void;
}

const mainItems: [NavItemKey, React.ComponentType<{ size: number; className?: string }>][] = [
  ["Dashboard", LayoutDashboard],
  ["Lançamentos", ReceiptText],
  ["Planejamento", CalendarDays],
  ["Contas", Landmark],
  ["Cartões", CreditCard],
  ["Empréstimos", HandCoins],
  ["Relatórios", BarChart2],
];

export function Sidebar({
  current,
  onSelect,
  collapsed,
  onToggleCollapse,
  onLogout,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex flex-col justify-between border-r border-slate-200/80 bg-white transition-all duration-200 ease-in-out",
        collapsed ? "w-[70px]" : "w-[230px]"
      )}
    >
      {/* Topo / Logo */}
      <div>
        <div className="flex h-14 items-center justify-between px-5 border-b border-slate-100">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-[#3157a8]">fluxo</span>
            </div>
          ) : (
            <span className="mx-auto text-lg font-bold tracking-tight text-[#3157a8]">f</span>
          )}

          <button
            onClick={onToggleCollapse}
            title={collapsed ? "Expandir menu" : "Recolher menu"}
            className="hidden md:grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Menu Principal */}
        <nav className="mt-3 px-2.5 space-y-0.5">
          {mainItems.map(([key, Icon]) => {
            const isActive = current === key;
            return (
              <button
                key={key}
                onClick={() => onSelect(key)}
                title={collapsed ? key : undefined}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg py-2 text-xs font-medium transition-colors",
                  collapsed ? "justify-center px-0" : "px-3",
                  isActive
                    ? "bg-[#edf2ff] text-[#3157a8] font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon size={16} className={isActive ? "text-[#3157a8]" : "text-slate-400"} />
                {!collapsed && <span>{key}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Rodapé / Configurações & Sair */}
      <div className="p-2.5 border-t border-slate-100 space-y-0.5">
        <button
          onClick={() => onSelect("Configurações")}
          title={collapsed ? "Configurações" : undefined}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg py-2 text-xs font-medium transition-colors",
            collapsed ? "justify-center px-0" : "px-3",
            current === "Configurações"
              ? "bg-[#edf2ff] text-[#3157a8] font-semibold"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <Settings
            size={16}
            className={current === "Configurações" ? "text-[#3157a8]" : "text-slate-400"}
          />
          {!collapsed && <span>Configurações</span>}
        </button>

        {onLogout && (
          <button
            onClick={onLogout}
            title={collapsed ? "Sair" : undefined}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors",
              collapsed ? "justify-center px-0" : "px-3"
            )}
          >
            <LogOut size={16} className="text-rose-500" />
            {!collapsed && <span>Sair</span>}
          </button>
        )}
      </div>
    </aside>
  );
}
