import React from "react";
import { getBankVisual } from "@/lib/card-brand-visuals";
import { BankLogo, CardBrandLogo } from "./bank-logos";

interface CreditCardPreviewProps {
  bankCode?: string | null;
  bankName?: string | null;
  cardName?: string | null;
  cardBrand?: string | null;
  lastDigits?: string | null;
  customColor?: string | null;
  useAutoColor?: boolean;
}

export function CreditCardPreview({
  bankCode,
  bankName,
  cardName,
  cardBrand = "mastercard",
  lastDigits = "4582",
  customColor,
  useAutoColor = true,
}: CreditCardPreviewProps) {
  const visual = getBankVisual(bankCode, useAutoColor ? undefined : customColor);
  const displayName = cardName?.trim() || "MEU CARTÃO";
  const displayDigits = (lastDigits?.trim() || "4582").padStart(4, "•").slice(-4);

  return (
    <div
      className="relative aspect-[1.586/1] w-full max-w-[340px] mx-auto rounded-2xl p-5 shadow-md overflow-hidden transition-all duration-300 flex flex-col justify-between select-none"
      style={{
        background: visual.gradient,
        color: visual.textColor,
        border: `1px solid ${visual.border}`,
      }}
    >
      {/* Detalhe de iluminação suave de fundo */}
      <div
        className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full opacity-20 blur-xl"
        style={{ background: visual.secondaryColor }}
      />
      <div
        className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full opacity-10 blur-xl"
        style={{ background: "#ffffff" }}
      />

      {/* Topo do Cartão: Logo do Banco + Chip */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BankLogo code={bankCode} />
        </div>

        {/* Chip EMV Simulado elegante */}
        <div className="w-8 h-6 rounded-md bg-amber-200/90 border border-amber-300/80 shadow-2xs relative flex flex-col justify-around px-1 py-0.5 opacity-90">
          <div className="w-full h-px bg-amber-400/80" />
          <div className="w-full h-px bg-amber-400/80" />
        </div>
      </div>

      {/* Meio: Dígitos do Cartão */}
      <div className="relative z-10 my-auto py-2">
        <div className="font-mono text-sm tracking-[0.25em] opacity-90 drop-shadow-xs flex items-center gap-2.5">
          <span>••••</span>
          <span>••••</span>
          <span>••••</span>
          <span className="font-bold">{displayDigits}</span>
        </div>
      </div>

      {/* Base: Nome do Titular / Cartão + Bandeira */}
      <div className="relative z-10 flex items-end justify-between">
        <div className="max-w-[70%]">
          <span className="block text-[9px] uppercase tracking-wider opacity-60 font-medium">
            Cartão
          </span>
          <p className="text-xs font-semibold tracking-wide uppercase truncate drop-shadow-xs">
            {displayName}
          </p>
        </div>

        <div className="flex items-center justify-end">
          <CardBrandLogo brand={cardBrand} />
        </div>
      </div>
    </div>
  );
}
