// File: src/services/api.ts
import axios from 'axios';

export interface Product {
  id: string | number;
  title: string;
  price: number;
  brand: string;
  category: string;
  imageUrl: string;
  rating?: string;   
  url?: string;      
}

const RAPID_API_KEY = '337a04733cmshad831c3afa64693p148ff3jsne80ccd3efa00'; 
const RAPID_API_HOST = 'real-time-amazon-data.p.rapidapi.com';

let cachedGlobalRates: Record<string, number> | null = null;

export const getGlobalExchangeRates = async (): Promise<Record<string, number>> => {
  if (cachedGlobalRates) return cachedGlobalRates;
  
  try {
    console.log("[FX Matrix] Mengunduh data tabel kurs global terbaru...");
    const response = await axios.get('https://open.er-api.com/v6/latest/USD');
    cachedGlobalRates = response.data.rates;
    return cachedGlobalRates || { USD: 1, IDR: 16300 };
  } catch (error) {
    console.error("Gagal sinkronisasi kurs, mengaktifkan sistem cadangan.", error);
    return { USD: 1, IDR: 16350, EUR: 0.92, GBP: 0.78, JPY: 156, SGD: 1.34 };
  }
};

const apiClient = axios.create({
  baseURL: `https://${RAPID_API_HOST}`,
  timeout: 15000, 
  headers: {
    'X-RapidAPI-Key': RAPID_API_KEY,
    'X-RapidAPI-Host': RAPID_API_HOST,
  },
});

export const searchProducts = async (query: string, page: number = 1): Promise<Product[]> => {
  if (!query.trim()) return [];
  
  try {
    const response = await apiClient.get('/search', {
      params: { 
        query: query.trim(),
        page: page.toString(),
        country: 'US', 
        sort_by: 'RELEVANCE'
      }
    });

    const rawAmazonData = response.data.data.products || [];
    
    // PERBAIKAN UTAMA: Mapping data API masuk ke variabel rating dan url
    return rawAmazonData.map((item: any) => ({
      id: item.asin || Math.random().toString(),
      title: item.product_title || 'Unknown Product',
      price: item.product_price ? parseFloat(item.product_price.replace(/[^0-9.-]+/g,"")) : 0,
      brand: 'Amazon Retail', // Dikembalikan ke brand awal
      category: 'Global Market',
      imageUrl: item.product_photo || 'https://via.placeholder.com/150',
      rating: item.product_star_rating ? item.product_star_rating.toString() : '4.1', // Menarik rating asli
      url: item.product_url || undefined, // Menarik link asli produk
    }));
  } catch (error: any) {
    console.error("Amazon Service Interrupted:", error.message);
    throw error;
  }
};