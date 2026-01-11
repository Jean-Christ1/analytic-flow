import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Taux de change par rapport à l'EUR (base)
const exchangeRates: Record<string, number> = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.86,
  CHF: 0.94,
  JPY: 162.5,
  CNY: 7.82,
  CAD: 1.47,
  AUD: 1.65,
  INR: 90.2,
  BRL: 5.35,
  MXN: 18.5,
  KRW: 1420,
  SGD: 1.45,
  HKD: 8.45,
  SEK: 11.2,
  NOK: 11.5,
  DKK: 7.46,
  PLN: 4.32,
  CZK: 25.2,
  HUF: 395,
  RUB: 98.5,
  TRY: 35.2,
  ZAR: 19.8,
  AED: 3.97,
  SAR: 4.05,
  THB: 38.5,
  MYR: 5.1,
  IDR: 16800,
  PHP: 60.5,
  VND: 26500,
  TWD: 34.2,
  NZD: 1.78,
  ILS: 3.95,
  EGP: 33.5,
  NGN: 1650,
  KES: 165,
  MAD: 10.8,
  COP: 4250,
  CLP: 985,
  ARS: 950,
  PEN: 4.05,
};

const currencySymbols: Record<string, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  CHF: "CHF",
  JPY: "¥",
  CNY: "¥",
  CAD: "C$",
  AUD: "A$",
  INR: "₹",
  BRL: "R$",
  MXN: "MX$",
  KRW: "₩",
  SGD: "S$",
  HKD: "HK$",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  PLN: "zł",
  CZK: "Kč",
  HUF: "Ft",
  RUB: "₽",
  TRY: "₺",
  ZAR: "R",
  AED: "د.إ",
  SAR: "﷼",
  THB: "฿",
  MYR: "RM",
  IDR: "Rp",
  PHP: "₱",
  VND: "₫",
  TWD: "NT$",
  NZD: "NZ$",
  ILS: "₪",
  EGP: "E£",
  NGN: "₦",
  KES: "KSh",
  MAD: "MAD",
  COP: "COP",
  CLP: "CLP",
  ARS: "ARS",
  PEN: "S/",
};

const currencyNames: Record<string, string> = {
  EUR: "Euro",
  USD: "US Dollar",
  GBP: "British Pound",
  CHF: "Swiss Franc",
  JPY: "Japanese Yen",
  CNY: "Chinese Yuan",
  CAD: "Canadian Dollar",
  AUD: "Australian Dollar",
  INR: "Indian Rupee",
  BRL: "Brazilian Real",
  MXN: "Mexican Peso",
  KRW: "South Korean Won",
  SGD: "Singapore Dollar",
  HKD: "Hong Kong Dollar",
  SEK: "Swedish Krona",
  NOK: "Norwegian Krone",
  DKK: "Danish Krone",
  PLN: "Polish Zloty",
  CZK: "Czech Koruna",
  HUF: "Hungarian Forint",
  RUB: "Russian Ruble",
  TRY: "Turkish Lira",
  ZAR: "South African Rand",
  AED: "UAE Dirham",
  SAR: "Saudi Riyal",
  THB: "Thai Baht",
  MYR: "Malaysian Ringgit",
  IDR: "Indonesian Rupiah",
  PHP: "Philippine Peso",
  VND: "Vietnamese Dong",
  TWD: "Taiwan Dollar",
  NZD: "New Zealand Dollar",
  ILS: "Israeli Shekel",
  EGP: "Egyptian Pound",
  NGN: "Nigerian Naira",
  KES: "Kenyan Shilling",
  MAD: "Moroccan Dirham",
  COP: "Colombian Peso",
  CLP: "Chilean Peso",
  ARS: "Argentine Peso",
  PEN: "Peruvian Sol",
};

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  formatCurrency: (amountInEUR: number, options?: FormatOptions) => string;
  convertFromEUR: (amountInEUR: number) => number;
  convertToEUR: (amount: number) => number;
  currencies: { code: string; name: string; symbol: string }[];
  getSymbol: () => string;
}

interface FormatOptions {
  compact?: boolean;
  decimals?: number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<string>(() => {
    const saved = localStorage.getItem("preferred_currency");
    return saved || "EUR";
  });

  useEffect(() => {
    localStorage.setItem("preferred_currency", currency);
  }, [currency]);

  const setCurrency = (newCurrency: string) => {
    if (exchangeRates[newCurrency]) {
      setCurrencyState(newCurrency);
    }
  };

  const convertFromEUR = (amountInEUR: number): number => {
    const rate = exchangeRates[currency] || 1;
    return amountInEUR * rate;
  };

  const convertToEUR = (amount: number): number => {
    const rate = exchangeRates[currency] || 1;
    return amount / rate;
  };

  const getSymbol = (): string => {
    return currencySymbols[currency] || currency;
  };

  const formatCurrency = (amountInEUR: number, options?: FormatOptions): string => {
    const converted = convertFromEUR(amountInEUR);
    const symbol = getSymbol();
    const decimals = options?.decimals ?? (currency === "JPY" || currency === "KRW" ? 0 : 2);
    
    if (options?.compact) {
      if (converted >= 1000000) {
        return `${symbol}${(converted / 1000000).toFixed(1)}M`;
      }
      if (converted >= 1000) {
        return `${symbol}${(converted / 1000).toFixed(1)}K`;
      }
    }
    
    return `${symbol}${converted.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  };

  const currencies = Object.keys(exchangeRates).map(code => ({
    code,
    name: currencyNames[code] || code,
    symbol: currencySymbols[code] || code,
  })).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatCurrency,
        convertFromEUR,
        convertToEUR,
        currencies,
        getSymbol,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
