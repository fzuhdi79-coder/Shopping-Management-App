// File: src/screens/ExchangeRateScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { getGlobalExchangeRates } from '../services/api';

export default function ExchangeRateScreen() {
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [currencyList, setCurrencyList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      setLoading(true);
      try {
        const data = await getGlobalExchangeRates();
        setRates(data);
        
        // Ambil SEMUA kode mata uang dari API, hilangkan IDR (karena kita menjadikan IDR sebagai patokan), lalu urutkan A-Z
        const allCurrencies = Object.keys(data)
          .filter(code => code !== 'IDR')
          .sort();
          
        setCurrencyList(allCurrencies);
      } catch (error) {
        console.error("Gagal menarik data kurs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRates();
  }, []);

  // MAGIC FUNCTION: Mengubah kode 'USD' menjadi bendera 🇺🇸 secara matematis
  const getFlagEmoji = (currencyCode: string) => {
    // Beberapa kode khusus yang tidak sesuai dengan ISO 2-huruf awal negara
    const specialFlags: Record<string, string> = {
      EUR: '🇪🇺', GBP: '🇬🇧', AUD: '🇦🇺', CAD: '🇨🇦',
      JPY: '🇯🇵', CNY: '🇨🇳', HKD: '🇭🇰', SGD: '🇸🇬', 
      CHF: '🇨🇭', ZAR: '🇿🇦', TRY: '🇹🇷',
    };
    if (specialFlags[currencyCode]) return specialFlags[currencyCode];

    // Jika mata uang kripto/logam mulia (biasanya diawali huruf X, misal XAU untuk Emas)
    if (currencyCode.startsWith('X')) return '🪙';

    // Konversi 2 huruf pertama jadi Emoji Bendera (Standard ISO 3166-1)
    const countryCode = currencyCode.substring(0, 2);
    try {
      return String.fromCodePoint(
        ...countryCode.split('').map(char => 127397 + char.charCodeAt(0))
      );
    } catch (e) {
      return '🏳️'; // Bendera putih jika kode negara tidak dikenali sistem
    }
  };

  // Menghitung nilai tukar mata uang target ke IDR (Cross-rate calculation)
  const calculateRateToIDR = (currencyCode: string) => {
    if (!rates || !rates['IDR'] || !rates[currencyCode]) return 0;
    return rates['IDR'] / rates[currencyCode];
  };

  // Format angka Rupiah
  const formatForexPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: price > 1000 ? 0 : 2,
      maximumFractionDigits: price > 1000 ? 0 : 3,
    }).format(price);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0EA5E9" />
        <Text style={styles.loadingText}>Menyinkronkan 160+ Kurs Global...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nilai Tukar Mata Uang</Text>
      </View>

      {/* SUB-HEADER INFO */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Kurs Sekarang</Text>
        <Text style={styles.infoSubtitle}>
          Aktifkan, beli, atau jual mata uang asing dengan kurs dalam Rupiah (IDR).
        </Text>
      </View>

      {/* TABLE HEADER */}
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>Mata Uang</Text>
        <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'left' }]}>Beli</Text>
        <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'left' }]}>Jual</Text>
        <View style={{ width: 90 }} />
      </View>

      {/* LIST 160+ MATA UANG */}
      <FlatList
        data={currencyList}
        keyExtractor={(item) => item}
        initialNumToRender={15} // Optimasi performa agar tidak lag saat render ratusan item
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item: currencyCode }) => {
          const midRate = calculateRateToIDR(currencyCode);
          
          // Simulasi Spread Valas Bank (Beli = +1%, Jual = -1%)
          const hargaBeli = midRate * 1.01;
          const hargaJual = midRate * 0.99;

          return (
            <View style={styles.row}>
              {/* Kolom Mata Uang (Bendera Otomatis & Kode) */}
              <View style={styles.currencyCol}>
                <Text style={styles.flagIcon}>{getFlagEmoji(currencyCode)}</Text>
                <Text style={styles.currencyCode}>{currencyCode}</Text>
              </View>

              {/* Kolom Harga Beli */}
              <Text style={styles.priceCol}>
                {formatForexPrice(hargaBeli)}
              </Text>

              {/* Kolom Harga Jual */}
              <Text style={styles.priceCol}>
                {formatForexPrice(hargaJual)}
              </Text>

              {/* Kolom Tombol Aktifkan */}
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Aktifkan</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#64748B', fontWeight: '500' },
  
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16 },
  backButton: { marginRight: 16 },
  backArrow: { fontSize: 24, color: '#333', fontWeight: '400' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },

  infoSection: { paddingHorizontal: 20, paddingBottom: 24 },
  infoTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
  infoSubtitle: { fontSize: 14, color: '#64748B', lineHeight: 20 },

  tableHeader: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tableHeaderText: { fontSize: 13, color: '#64748B', fontWeight: '500' },

  listContainer: { paddingVertical: 8, paddingBottom: 30 },
  separator: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 8, marginHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8 },
  
  currencyCol: { flex: 1.2, flexDirection: 'row', alignItems: 'center' },
  flagIcon: { fontSize: 22, marginRight: 8 },
  currencyCode: { fontSize: 15, fontWeight: '600', color: '#333' },
  
  priceCol: { flex: 1, fontSize: 14, color: '#64748B', fontWeight: '500', textAlign: 'left' },
  
  actionButton: { backgroundColor: '#0EA5E9', borderRadius: 6, paddingVertical: 8, paddingHorizontal: 16, width: 90, alignItems: 'center' },
  actionButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' }
});