import React from "react";

// Inline vector logos for instant, offline, lightweight and sharp rendering at any scale.

export function BankLogo({ code, className = "h-5 w-auto" }: { code?: string | null; className?: string }) {
  const norm = (code || "other").toLowerCase();

  switch (norm) {
    case "nubank":
      return (
        <span className="font-bold tracking-tight text-white text-base lowercase select-none flex items-center gap-0.5">
          <svg className="w-5 h-5 fill-current inline-block" viewBox="0 0 24 24">
            <path d="M5.5 6C4.12 6 3 7.12 3 8.5v7C3 16.88 4.12 18 5.5 18S8 16.88 8 15.5v-5h2.5c1.38 0 2.5 1.12 2.5 2.5v2.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5v-7c0-1.38-1.12-2.5-2.5-2.5S13 7.12 13 8.5V11H10.5C9.12 11 8 9.88 8 8.5 8 7.12 6.88 6 5.5 6z" />
          </svg>
          <span className="text-sm font-semibold tracking-normal lowercase">nu</span>
        </span>
      );

    case "inter":
      return (
        <span className="font-extrabold tracking-tighter text-white text-base lowercase select-none flex items-center gap-0.5">
          <span className="text-white text-base font-black lowercase tracking-tight">inter</span>
          <span className="w-1.5 h-1.5 rounded-full bg-white ml-0.5" />
        </span>
      );

    case "itau":
      return (
        <div className="flex items-center gap-1 select-none">
          <span className="px-1.5 py-0.5 rounded-md bg-[#ec7000] text-white font-extrabold text-xs tracking-tight shadow-xs">
            itaú
          </span>
        </div>
      );

    case "bradesco":
      return (
        <div className="flex items-center gap-1 select-none text-white">
          <svg className="w-4 h-4 fill-current inline-block" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" />
          </svg>
          <span className="text-xs font-bold tracking-tight lowercase">bradesco</span>
        </div>
      );

    case "santander":
      return (
        <div className="flex items-center gap-1 select-none text-white">
          <svg className="w-4 h-4 fill-white inline-block" viewBox="0 0 24 24">
            <path d="M12 2L3 8v8l9 6 9-6V8l-9-6zm0 3.3L18.4 9 12 13.2 5.6 9 12 5.3zm-6.8 5l5.8 3.8v6.4l-5.8-3.9v-6.3zm13.6 0v6.3L13 20.5v-6.4l5.8-3.8z" />
          </svg>
          <span className="text-xs font-bold tracking-tight uppercase">Santander</span>
        </div>
      );

    case "bb":
      return (
        <div className="flex items-center gap-1 select-none">
          <span className="px-1.5 py-0.5 rounded-md bg-[#fcf000] text-[#003882] font-black text-xs tracking-tighter">
            BB
          </span>
          <span className="text-[11px] font-bold text-white tracking-tight">Banco do Brasil</span>
        </div>
      );

    case "caixa":
      return (
        <div className="flex items-center gap-1 select-none text-white font-bold text-xs">
          <span className="tracking-tight uppercase font-black text-white">CAIXA</span>
          <span className="text-[#f37021] font-black text-sm">X</span>
        </div>
      );

    case "c6":
      return (
        <div className="flex items-center gap-1 select-none text-white font-mono">
          <span className="text-xs font-bold tracking-widest uppercase">C6 BANK</span>
        </div>
      );

    case "btg":
      return (
        <div className="flex items-center gap-1 select-none text-white">
          <span className="text-xs font-extrabold tracking-wider uppercase">BTG Pactual</span>
        </div>
      );

    case "picpay":
      return (
        <div className="flex items-center gap-1 select-none text-white">
          <span className="text-xs font-bold tracking-tight lowercase">picpay</span>
        </div>
      );

    case "mercadopago":
      return (
        <div className="flex items-center gap-1 select-none text-white">
          <span className="text-xs font-bold tracking-tight">mercado pago</span>
        </div>
      );

    case "neon":
      return (
        <div className="flex items-center gap-1 select-none text-white">
          <span className="text-xs font-bold tracking-tight uppercase">neon</span>
        </div>
      );

    case "will":
      return (
        <div className="flex items-center gap-1 select-none text-white">
          <span className="px-1 rounded bg-[#ffee00] text-black font-black text-[11px]">will</span>
          <span className="text-xs font-semibold">bank</span>
        </div>
      );

    case "pagbank":
      return (
        <div className="flex items-center gap-1 select-none text-white">
          <span className="text-xs font-bold tracking-tight">PagBank</span>
        </div>
      );

    case "sicredi":
      return (
        <div className="flex items-center gap-1 select-none text-white">
          <span className="text-xs font-bold tracking-tight">Sicredi</span>
        </div>
      );

    case "sicoob":
      return (
        <div className="flex items-center gap-1 select-none text-white">
          <span className="text-xs font-bold tracking-tight">Sicoob</span>
        </div>
      );

    case "xp":
      return (
        <div className="flex items-center gap-1 select-none text-white">
          <span className="text-xs font-black tracking-widest uppercase">XP</span>
        </div>
      );

    default:
      return (
        <div className="flex items-center gap-1.5 select-none text-white/90">
          <svg className="w-4 h-4 fill-current opacity-70" viewBox="0 0 24 24">
            <rect x="2" y="5" width="20" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
            <line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span className="text-xs font-semibold tracking-tight uppercase truncate max-w-[120px]">
            {code || "Cartão"}
          </span>
        </div>
      );
  }
}

export function CardBrandLogo({ brand, className = "h-5 w-auto" }: { brand?: string | null; className?: string }) {
  const norm = (brand || "mastercard").toLowerCase();

  switch (norm) {
    case "mastercard":
      return (
        <div className="flex items-center select-none" title="Mastercard">
          <div className="relative flex items-center">
            <span className="w-5 h-5 rounded-full bg-[#eb001b] inline-block shadow-2xs" />
            <span className="w-5 h-5 rounded-full bg-[#f79e1b] -ml-2.5 inline-block opacity-90 shadow-2xs" />
          </div>
        </div>
      );

    case "visa":
      return (
        <div className="flex items-center select-none text-white italic font-black text-sm tracking-tighter" title="Visa">
          <span className="drop-shadow-xs">VISA</span>
        </div>
      );

    case "elo":
      return (
        <div className="flex items-center gap-0.5 select-none" title="Elo">
          <div className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00a4e4] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef3e42] inline-block -ml-0.5" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffcb05] inline-block -ml-0.5" />
          </div>
          <span className="text-[10px] font-black text-white ml-0.5 tracking-tight">elo</span>
        </div>
      );

    case "amex":
      return (
        <div className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-extrabold text-[9px] tracking-widest uppercase select-none" title="American Express">
          AMEX
        </div>
      );

    case "hipercard":
      return (
        <div className="px-1.5 py-0.5 rounded bg-rose-700 text-white font-bold text-[9px] tracking-tight uppercase select-none" title="Hipercard">
          HIPER
        </div>
      );

    default:
      return (
        <div className="flex items-center gap-1 text-white/70 select-none text-[10px] uppercase font-semibold">
          <span>{brand || "Card"}</span>
        </div>
      );
  }
}
