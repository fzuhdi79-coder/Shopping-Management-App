// File: src/context/CurrencyContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { getGlobalExchangeRates } from '../services/api';

interface CurrencyContextType {
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
  rates: Record<string, number>;
  currencyList: string[];
  loadingRates: boolean;
  formatDynamicPrice: (usdPrice: number) => string;
  getFlagUrl: (currencyCode: string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [rates, setRates] = useState<Record<string, number>>({});
  const [currencyList, setCurrencyList] = useState<string[]>([]);
  const [loadingRates, setLoadingRates] = useState(true);

  // Fetch Forex Rates sekali saja untuk seluruh aplikasi
  useEffect(() => {
    const initForexMatrix = async () => {
      try {
        const data = await getGlobalExchangeRates();
        setRates(data);
        setCurrencyList(Object.keys(data).sort());
      } catch (error) {
        console.error("Gagal memuat data kurs global:", error);
      } finally {
        setLoadingRates(false);
      }
    };
    initForexMatrix();
  }, []);

  const getFlagUrl = (currencyCode: string) => {
    if (!currencyCode) return 'https://flagcdn.com/w160/un.png';
    const code = currencyCode.toUpperCase();
    
    const specialMappings: Record<string, string> = {
        // Mata uang utama & regional yang sudah kamu buat
        USD: 'us', IDR: 'id', EUR: 'eu', GBP: 'gb', AUD: 'au', 
        CAD: 'ca', JPY: 'jp', CNY: 'cn', HKD: 'hk', SGD: 'sg', 
        CHF: 'ch', ZAR: 'za', TRY: 'tr', SAR: 'sa',
        ANG: 'cw', XAF: 'cm', XOF: 'sn', XCD: 'ag',

        // --- TAMBAHAN BARU UNTUK KESEMPURNAAN GLOBAL ---
        XPF: 'pf', // CFP Franc (Menggunakan bendera French Polynesia)
        
        // Proteksi jika API kamu melemparkan data Kripto / Logam Mulia
        // Supaya tidak salah mendeteksi singkatan negara (contoh: BTC terbaca BT = Bhutan)
        BTC: 'un', // Bitcoin -> Flag PBB / Universal
        ETH: 'un', // Ethereum -> Flag PBB / Universal
        XAU: 'un', // Gold/Emas
        XAG: 'un', // Silver/Perak
        XDR: 'un', // Special Drawing Rights (IMF)
    };

    if (specialMappings[code]) {
      return `https://flagcdn.com/w160/${specialMappings[code]}.png`;
    }

    const countryCode = code.substring(0, 2).toLowerCase();
    return `https://flagcdn.com/w160/${countryCode}.png`;
  };

  const formatDynamicPrice = (usdPrice: number) => {
    const rate = rates[selectedCurrency] || 1;
    const finalAmount = usdPrice * rate;
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: selectedCurrency,
        maximumFractionDigits: selectedCurrency === 'IDR' || selectedCurrency === 'JPY' ? 0 : 2,
      }).format(finalAmount);
    } catch (e) {
      return `${selectedCurrency} ${finalAmount.toFixed(2)}`;
    }
  };

  return (
    <CurrencyContext.Provider 
      value={{ 
        selectedCurrency, 
        setSelectedCurrency, 
        rates, 
        currencyList, 
        loadingRates, 
        formatDynamicPrice, 
        getFlagUrl 
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency harus digunakan di dalam CurrencyProvider');
  }
  return context;
};