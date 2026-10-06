import React from "react";

export interface BankVisual {
  code: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  gradient: string;
  textColor: string;
  subtextColor: string;
  badgeBg: string;
  badgeText: string;
  border: string;
}

export interface CardBrandVisual {
  code: string;
  name: string;
}

export const BANK_VISUALS: Record<string, BankVisual> = {
  nubank: {
    code: "nubank",
    name: "Nubank",
    primaryColor: "#820ad1",
    secondaryColor: "#4f0580",
    gradient: "linear-gradient(135deg, #8a05be 0%, #530082 100%)",
    textColor: "#ffffff",
    subtextColor: "#e9d5ff",
    badgeBg: "rgba(255, 255, 255, 0.15)",
    badgeText: "#ffffff",
    border: "rgba(255, 255, 255, 0.12)",
  },
  inter: {
    code: "inter",
    name: "Banco Inter",
    primaryColor: "#ff7a00",
    secondaryColor: "#d95700",
    gradient: "linear-gradient(135deg, #ff7a00 0%, #ea580c 100%)",
    textColor: "#ffffff",
    subtextColor: "#fed7aa",
    badgeBg: "rgba(255, 255, 255, 0.18)",
    badgeText: "#ffffff",
    border: "rgba(255, 255, 255, 0.15)",
  },
  itau: {
    code: "itau",
    name: "Itaú",
    primaryColor: "#ec7000",
    secondaryColor: "#003399",
    gradient: "linear-gradient(135deg, #003399 0%, #ec7000 100%)",
    textColor: "#ffffff",
    subtextColor: "#ffedd5",
    badgeBg: "rgba(255, 255, 255, 0.16)",
    badgeText: "#ffffff",
    border: "rgba(255, 255, 255, 0.15)",
  },
  bradesco: {
    code: "bradesco",
    name: "Bradesco",
    primaryColor: "#cc092f",
    secondaryColor: "#8f0621",
    gradient: "linear-gradient(135deg, #cc092f 0%, #8f0621 100%)",
    textColor: "#ffffff",
    subtextColor: "#fecdd3",
    badgeBg: "rgba(255, 255, 255, 0.16)",
    badgeText: "#ffffff",
    border: "rgba(255, 255, 255, 0.15)",
  },
  santander: {
    code: "santander",
    name: "Santander",
    primaryColor: "#ec0000",
    secondaryColor: "#990000",
    gradient: "linear-gradient(135deg, #ec0000 0%, #a30000 100%)",
    textColor: "#ffffff",
    subtextColor: "#fecaca",
    badgeBg: "rgba(255, 255, 255, 0.16)",
    badgeText: "#ffffff",
    border: "rgba(255, 255, 255, 0.15)",
  },
  bb: {
    code: "bb",
    name: "Banco do Brasil",
    primaryColor: "#003882",
    secondaryColor: "#fcf000",
    gradient: "linear-gradient(135deg, #002b66 0%, #004b99 80%, #f4cb00 100%)",
    textColor: "#ffffff",
    subtextColor: "#fef08a",
    badgeBg: "rgba(254, 240, 138, 0.2)",
    badgeText: "#fef08a",
    border: "rgba(255, 255, 255, 0.15)",
  },
  caixa: {
    code: "caixa",
    name: "Caixa Econômica",
    primaryColor: "#0066b3",
    secondaryColor: "#f37021",
    gradient: "linear-gradient(135deg, #005699 0%, #0074cc 85%, #f37021 100%)",
    textColor: "#ffffff",
    subtextColor: "#fed7aa",
    badgeBg: "rgba(255, 255, 255, 0.18)",
    badgeText: "#ffffff",
    border: "rgba(255, 255, 255, 0.15)",
  },
  c6: {
    code: "c6",
    name: "C6 Bank",
    primaryColor: "#1a1a1a",
    secondaryColor: "#2d2d2d",
    gradient: "linear-gradient(135deg, #242424 0%, #0f0f0f 100%)",
    textColor: "#ffffff",
    subtextColor: "#d1d5db",
    badgeBg: "rgba(255, 255, 255, 0.12)",
    badgeText: "#f3f4f6",
    border: "rgba(255, 255, 255, 0.18)",
  },
  btg: {
    code: "btg",
    name: "BTG Pactual",
    primaryColor: "#001e3d",
    secondaryColor: "#0b345e",
    gradient: "linear-gradient(135deg, #031e3b 0%, #001124 100%)",
    textColor: "#ffffff",
    subtextColor: "#cbd5e1",
    badgeBg: "rgba(255, 255, 255, 0.12)",
    badgeText: "#ffffff",
    border: "rgba(255, 255, 255, 0.14)",
  },
  picpay: {
    code: "picpay",
    name: "PicPay",
    primaryColor: "#11c76f",
    secondaryColor: "#0b8a4c",
    gradient: "linear-gradient(135deg, #0a884d 0%, #03522c 100%)",
    textColor: "#ffffff",
    subtextColor: "#bbf7d0",
    badgeBg: "rgba(255, 255, 255, 0.18)",
    badgeText: "#ffffff",
    border: "rgba(255, 255, 255, 0.15)",
  },
  mercadopago: {
    code: "mercadopago",
    name: "Mercado Pago",
    primaryColor: "#009ee3",
    secondaryColor: "#006b99",
    gradient: "linear-gradient(135deg, #009ee3 0%, #006099 100%)",
    textColor: "#ffffff",
    subtextColor: "#bae6fd",
    badgeBg: "rgba(255, 255, 255, 0.16)",
    badgeText: "#ffffff",
    border: "rgba(255, 255, 255, 0.15)",
  },
  neon: {
    code: "neon",
    name: "Neon",
    primaryColor: "#00e5ff",
    secondaryColor: "#0099b8",
    gradient: "linear-gradient(135deg, #002b49 0%, #007099 70%, #00c9e6 100%)",
    textColor: "#ffffff",
    subtextColor: "#a5f3fc",
    badgeBg: "rgba(0, 229, 255, 0.2)",
    badgeText: "#ffffff",
    border: "rgba(255, 255, 255, 0.16)",
  },
  will: {
    code: "will",
    name: "Will Bank",
    primaryColor: "#ffee00",
    secondaryColor: "#222222",
    gradient: "linear-gradient(135deg, #232323 0%, #111111 100%)",
    textColor: "#ffffff",
    subtextColor: "#fef08a",
    badgeBg: "rgba(254, 240, 138, 0.2)",
    badgeText: "#fef08a",
    border: "rgba(254, 240, 138, 0.25)",
  },
  pagbank: {
    code: "pagbank",
    name: "PagBank",
    primaryColor: "#00995c",
    secondaryColor: "#ffc20e",
    gradient: "linear-gradient(135deg, #008744 0%, #005c2e 100%)",
    textColor: "#ffffff",
    subtextColor: "#86efac",
    badgeBg: "rgba(255, 255, 255, 0.15)",
    badgeText: "#ffffff",
    border: "rgba(255, 255, 255, 0.12)",
  },
  sicredi: {
    code: "sicredi",
    name: "Sicredi",
    primaryColor: "#007a33",
    secondaryColor: "#005222",
    gradient: "linear-gradient(135deg, #007a33 0%, #00471b 100%)",
    textColor: "#ffffff",
    subtextColor: "#bbf7d0",
    badgeBg: "rgba(255, 255, 255, 0.16)",
    badgeText: "#ffffff",
    border: "rgba(255, 255, 255, 0.14)",
  },
  sicoob: {
    code: "sicoob",
    name: "Sicoob",
    primaryColor: "#003366",
    secondaryColor: "#009977",
    gradient: "linear-gradient(135deg, #003366 0%, #007a5e 100%)",
    textColor: "#ffffff",
    subtextColor: "#99f6e4",
    badgeBg: "rgba(255, 255, 255, 0.16)",
    badgeText: "#ffffff",
    border: "rgba(255, 255, 255, 0.14)",
  },
  xp: {
    code: "xp",
    name: "XP Investimentos",
    primaryColor: "#000000",
    secondaryColor: "#222222",
    gradient: "linear-gradient(135deg, #1f1f1f 0%, #0a0a0a 100%)",
    textColor: "#ffffff",
    subtextColor: "#cbd5e1",
    badgeBg: "rgba(255, 255, 255, 0.12)",
    badgeText: "#ffffff",
    border: "rgba(255, 255, 255, 0.18)",
  },
  other: {
    code: "other",
    name: "Outros",
    primaryColor: "#1e293b",
    secondaryColor: "#0f172a",
    gradient: "linear-gradient(135deg, #293548 0%, #0f172a 100%)",
    textColor: "#ffffff",
    subtextColor: "#94a3b8",
    badgeBg: "rgba(255, 255, 255, 0.12)",
    badgeText: "#ffffff",
    border: "rgba(255, 255, 255, 0.12)",
  },
};

export const CARD_BRANDS: CardBrandVisual[] = [
  { code: "mastercard", name: "Mastercard" },
  { code: "visa", name: "Visa" },
  { code: "elo", name: "Elo" },
  { code: "amex", name: "American Express" },
  { code: "hipercard", name: "Hipercard" },
  { code: "other", name: "Outra" },
];

export function getBankVisual(bankCode?: string | null, customColor?: string | null): BankVisual {
  if (!bankCode) {
    if (customColor) {
      return {
        ...BANK_VISUALS.other,
        primaryColor: customColor,
        gradient: `linear-gradient(135deg, ${customColor} 0%, #0f172a 100%)`,
      };
    }
    return BANK_VISUALS.other;
  }

  const normalized = bankCode.trim().toLowerCase();
  // Busca direta pela chave
  if (BANK_VISUALS[normalized]) {
    const visual = BANK_VISUALS[normalized];
    if (customColor) {
      return {
        ...visual,
        primaryColor: customColor,
        gradient: `linear-gradient(135deg, ${customColor} 0%, #0f172a 100%)`,
      };
    }
    return visual;
  }

  // Tenta encontrar por correspondência de nome
  for (const key of Object.keys(BANK_VISUALS)) {
    if (BANK_VISUALS[key].name.toLowerCase().includes(normalized) || normalized.includes(key)) {
      const visual = BANK_VISUALS[key];
      if (customColor) {
        return {
          ...visual,
          primaryColor: customColor,
          gradient: `linear-gradient(135deg, ${customColor} 0%, #0f172a 100%)`,
        };
      }
      return visual;
    }
  }

  // Fallback para outros com cor personalizada opcional
  return {
    ...BANK_VISUALS.other,
    name: bankCode,
    primaryColor: customColor || BANK_VISUALS.other.primaryColor,
    gradient: customColor
      ? `linear-gradient(135deg, ${customColor} 0%, #0f172a 100%)`
      : BANK_VISUALS.other.gradient,
  };
}
