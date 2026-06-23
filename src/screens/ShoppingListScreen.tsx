// File: src/screens/ShoppingListScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { db } from '../services/firebase';
import { collection, query, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useCurrency } from '../context/CurrencyContext';

// Import fungsi pembuat invoice dan library print
import { generateInvoiceHTML } from '../utils/generateInvoiceHTML';
import * as Print from 'expo-print'; 

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  bg:           '#0A0F1E',
  surface:      'rgba(255,255,255,0.04)',
  surfaceSolid: '#111827',       // untuk footer — perlu solid agar tidak tembus
  border:       'rgba(255,255,255,0.08)',
  borderFocus:  'rgba(59,130,246,0.45)',
  textPrimary:  '#E2E8F0',
  textMuted:    '#64748B',
  textDim:      '#475569',
  accent:       '#2563EB',
  accentSoft:   'rgba(37,99,235,0.12)',
  accentBorder: 'rgba(37,99,235,0.28)',
  accentText:   '#60A5FA',
  price:        '#F97316',
  success:      '#10B981',
  successSoft:  'rgba(16,185,129,0.1)',
  successBorder:'rgba(16,185,129,0.25)',
  danger:       '#EF4444',
  dangerSoft:   'rgba(239,68,68,0.1)',
};

export default function ShoppingListScreen() {
  const [shoppingList,      setShoppingList]      = useState<any[]>([]);
  const [isModalVisible,    setIsModalVisible]    = useState(false);
  const [currencySearch,    setCurrencySearch]    = useState('');
  const [promoInput,        setPromoInput]        = useState('');
  const [discountPct,       setDiscountPct]       = useState(0);
  const [appliedPromo,      setAppliedPromo]      = useState('');

  const {
    selectedCurrency,
    setSelectedCurrency,
    currencyList,
    formatDynamicPrice,
    getFlagUrl,
  } = useCurrency();

  useEffect(() => {
    const q           = query(collection(db, 'shopping_lists'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setShoppingList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  const updateQuantity = async (id: string, cur: number, delta: number) => {
    const next = cur + delta;
    if (next < 1) return;
    await updateDoc(doc(db, 'shopping_lists', id), { quantity: next });
  };

  const handleApplyPromo = () => {
    const code = promoInput.trim().toUpperCase();

    if (code.startsWith('AMZN-')) {
      const parts    = code.split('-');
      const val      = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(val) && val > 0 && val <= 100) {
        setDiscountPct(val);
        setAppliedPromo(`${code} (${val}%)`);
        Alert.alert('Promo diterapkan', `Diskon ${val}% berhasil dipakai.`);
        setPromoInput('');
        return;
      }
    }

    const CODES: Record<string, number> = { ENTERPRISE10: 10, SUPERDEAL: 20 };
    if (CODES[code]) {
      setDiscountPct(CODES[code]);
      setAppliedPromo(`${code} (${CODES[code]}%)`);
      Alert.alert('Promo diterapkan', `Diskon ${CODES[code]}% berhasil dipakai.`);
    } else {
      Alert.alert('Kode tidak valid', 'Silakan periksa kembali kode promo.');
    }
    setPromoInput('');
  };

  const handleRemovePromo = () => { setDiscountPct(0); setAppliedPromo(''); };

  const grandTotal    = shoppingList.reduce((t, i) => t + (i.priceUSD || 0) * (i.quantity || 1), 0);
  const discountAmt   = grandTotal * (discountPct / 100);
  const finalTotal    = grandTotal - discountAmt;

  const filteredCurrencies = currencyList.filter((c) =>
    c.toLowerCase().includes(currencySearch.toLowerCase())
  );

  // ─── Handler Cetak Invoice ───────────────────────────────────────────────────
  const handleLanjutkanPembayaran = async () => {
    if (shoppingList.length === 0) {
      Alert.alert('Keranjang Kosong', 'Silakan tambahkan barang terlebih dahulu.');
      return;
    }

    try {
      // 1. Persiapkan struktur data
      const formattedItems = shoppingList.map((item) => ({
        title: item.title,
        priceUSD: item.priceUSD || 0,
        quantity: item.quantity || 1,
      }));

      // 2. Generate HTML struk
      const htmlContent = generateInvoiceHTML({
        items: formattedItems,
        grandTotalUSD: grandTotal,
        discountPct: discountPct,
        discountAmtUSD: discountAmt,
        finalTotalUSD: finalTotal,
        appliedPromo: appliedPromo || '-',
        selectedCurrency: selectedCurrency,
        formatPrice: (usd) => formatDynamicPrice(usd),
      });

      // 3. Pisahkan logika untuk Web dan Mobile (Android/iOS)
      if (Platform.OS === 'web') {
        // Logika khusus Web: Buka tab baru dan cetak
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          // Beri jeda sedikit agar browser merender HTML sebelum dialog print muncul
          setTimeout(() => {
            printWindow.print();
          }, 300);
        } else {
          alert('Gagal mencetak. Pastikan browser kamu mengizinkan pop-up.');
        }
      } else {
        // Logika Mobile (Android/iOS) menggunakan expo-print
        await Print.printAsync({
          html: htmlContent,
        });
      }

    } catch (error) {
      console.error('Gagal mencetak e-invoice:', error);
      Alert.alert('Error', 'Gagal memproses e-invoice.');
    }
  };

  return (
    <View style={s.container}>

      {/* ── Page Header ── */}
      <View style={s.pageHeader}>
        <View>
          <Text style={s.pageTitle}>Inventory</Text>
          <Text style={s.pageSubtitle}>{shoppingList.length} item ditambahkan</Text>
        </View>
        {/* Currency quick-select */}
        <TouchableOpacity
          style={s.currencyChip}
          onPress={() => { setCurrencySearch(''); setIsModalVisible(true); }}
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: getFlagUrl(selectedCurrency) }}
            style={s.chipFlag}
            resizeMode="cover"
          />
          <Text style={s.chipCode}>{selectedCurrency}</Text>
          <Text style={s.chipChevron}>▾</Text>
        </TouchableOpacity>
      </View>

      {/* ── Currency Modal ── */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={s.modalBackdrop}>
          <View style={s.modalSheet}>
            <View style={s.sheetHandle} />
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Pilih Mata Uang</Text>
              <TouchableOpacity
                style={s.modalCloseBtn}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={s.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={s.modalSearchWrap}>
              <TextInput
                style={s.modalSearchInput}
                placeholder="Cari kode (IDR, USD, EUR)..."
                placeholderTextColor={C.textDim}
                value={currencySearch}
                onChangeText={setCurrencySearch}
                autoCapitalize="characters"
                selectionColor={C.accent}
              />
            </View>
            <FlatList
              data={filteredCurrencies}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={s.modalList}
              renderItem={({ item: currency }) => {
                const active = selectedCurrency === currency;
                return (
                  <TouchableOpacity
                    style={[s.modalRow, active && s.modalRowActive]}
                    onPress={() => { setSelectedCurrency(currency); setIsModalVisible(false); }}
                    activeOpacity={0.7}
                  >
                    <View style={s.modalRowLeft}>
                      <Image
                        source={{ uri: getFlagUrl(currency) }}
                        style={s.modalFlag}
                        resizeMode="cover"
                      />
                      <Text style={[s.modalCode, active && s.modalCodeActive]}>
                        {currency}
                      </Text>
                    </View>
                    {active && <Text style={s.checkMark}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* ── Item List ── */}
      <FlatList
        data={shoppingList}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.listContent}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>⬡</Text>
            <Text style={s.emptyText}>Inventaris kosong</Text>
            <Text style={s.emptySub}>Tambahkan produk dari halaman pencarian.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.itemCard}>
            <View style={s.itemImgWrap}>
              <Image
                source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
                style={s.itemImg}
                resizeMode="contain"
              />
            </View>
            <View style={s.itemMeta}>
              <Text style={s.itemName} numberOfLines={2}>{item.title}</Text>
              <Text style={s.itemUnit}>
                ${item.priceUSD?.toFixed(2) || '0.00'} / unit
              </Text>

              <View style={s.itemFooter}>
                <Text style={s.itemSubtotal}>
                  {formatDynamicPrice((item.priceUSD || 0) * (item.quantity || 1))}
                </Text>

                <View style={s.itemControls}>
                  {/* Qty stepper */}
                  <View style={s.stepper}>
                    <TouchableOpacity
                      style={s.stepBtn}
                      onPress={() => updateQuantity(item.id, item.quantity || 1, -1)}
                      activeOpacity={0.7}
                    >
                      <Text style={s.stepBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={s.stepValue}>{item.quantity || 1}</Text>
                    <TouchableOpacity
                      style={s.stepBtn}
                      onPress={() => updateQuantity(item.id, item.quantity || 1, 1)}
                      activeOpacity={0.7}
                    >
                      <Text style={s.stepBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Delete */}
                  <TouchableOpacity
                    style={s.deleteBtn}
                    onPress={() => deleteDoc(doc(db, 'shopping_lists', item.id))}
                    activeOpacity={0.7}
                  >
                    <Text style={s.deleteIcon}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      />

      {/* ── Checkout Footer ── */}
      <View style={s.footer}>
        {/* Promo input */}
        {!appliedPromo ? (
          <View style={s.promoRow}>
            <TextInput
              style={s.promoInput}
              placeholder="Kode promo..."
              placeholderTextColor={C.textDim}
              value={promoInput}
              onChangeText={setPromoInput}
              autoCapitalize="characters"
              selectionColor={C.accent}
            />
            <TouchableOpacity
              style={[s.promoBtn, !promoInput && s.promoBtnDisabled]}
              onPress={handleApplyPromo}
              disabled={!promoInput}
              activeOpacity={0.8}
            >
              <Text style={s.promoBtnText}>Gunakan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.promoApplied}>
            <View style={s.promoAppliedLeft}>
              <View style={s.promoAppliedDot} />
              <Text style={s.promoAppliedText}>{appliedPromo}</Text>
            </View>
            <TouchableOpacity onPress={handleRemovePromo} activeOpacity={0.7}>
              <Text style={s.promoCancelText}>Batalkan</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Total */}
        <View style={s.totalRow}>
          <View>
            <Text style={s.totalLabel}>Total tagihan</Text>
            {discountPct > 0 && (
              <Text style={s.totalStrike}>{formatDynamicPrice(grandTotal)}</Text>
            )}
          </View>
          <Text style={s.totalAmount}>{formatDynamicPrice(finalTotal)}</Text>
        </View>

        {/* Checkout CTA */}
        <TouchableOpacity 
          style={s.checkoutBtn} 
          activeOpacity={0.85}
          onPress={handleLanjutkanPembayaran}
        >
          <Text style={s.checkoutBtnText}>Lanjutkan pembayaran</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Header
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: C.textPrimary,
    letterSpacing: -0.5,
    ...Platform.select({
      ios:     { fontFamily: 'SF Pro Display' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  pageSubtitle: {
    fontSize: 13,
    color: C.textMuted,
    marginTop: 2,
  },
  currencyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.surface,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipFlag: {
    width: 24,
    height: 17,
    borderRadius: 2,
    backgroundColor: '#1E3A5F',
  },
  chipCode: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textPrimary,
  },
  chipChevron: {
    fontSize: 11,
    color: C.textDim,
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 290,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyIcon: {
    fontSize: 40,
    color: C.textDim,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: C.textMuted,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: C.textDim,
  },

  // Item card
  itemCard: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  itemImgWrap: {
    width: 76,
    height: 76,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  itemImg: {
    width: 60,
    height: 60,
  },
  itemMeta: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textPrimary,
    lineHeight: 20,
    marginBottom: 3,
  },
  itemUnit: {
    fontSize: 12,
    color: C.textDim,
    marginBottom: 10,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemSubtotal: {
    fontSize: 16,
    fontWeight: '700',
    color: C.price,
    ...Platform.select({
      ios:     { fontFamily: 'Courier New' },
      android: { fontFamily: 'monospace' },
    }),
  },
  itemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  stepBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.textPrimary,
    lineHeight: 18,
  },
  stepValue: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textPrimary,
    minWidth: 26,
    textAlign: 'center',
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.dangerSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 11,
    color: C.danger,
    fontWeight: '700',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.surfaceSolid,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  promoRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  promoInput: {
    flex: 1,
    height: 46,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 13,
    color: C.textPrimary,
  },
  promoBtn: {
    backgroundColor: C.accent,
    paddingHorizontal: 18,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoBtnDisabled: {
    backgroundColor: 'rgba(37,99,235,0.3)',
  },
  promoBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  promoApplied: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.successSoft,
    borderWidth: 0.5,
    borderColor: C.successBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
  },
  promoAppliedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  promoAppliedDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: C.success,
  },
  promoAppliedText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.success,
  },
  promoCancelText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.danger,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 13,
    color: C.textMuted,
    marginBottom: 3,
  },
  totalStrike: {
    fontSize: 13,
    color: C.textDim,
    textDecorationLine: 'line-through',
  },
  totalAmount: {
    fontSize: 26,
    fontWeight: '700',
    color: C.textPrimary,
    letterSpacing: -0.5,
    ...Platform.select({
      ios:     { fontFamily: 'Courier New' },
      android: { fontFamily: 'monospace' },
    }),
  },
  checkoutBtn: {
    height: 50,
    backgroundColor: C.accent,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '78%',
    paddingBottom: 32,
    borderTopWidth: 0.5,
    borderColor: C.border,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginTop: 14,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderColor: C.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.textPrimary,
  },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.07)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 12,
    color: C.textMuted,
    fontWeight: '700',
  },
  modalSearchWrap: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  modalSearchInput: {
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: C.textPrimary,
  },
  modalList: {
    paddingHorizontal: 24,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 2,
  },
  modalRowActive: {
    backgroundColor: C.accentSoft,
  },
  modalRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  modalFlag: {
    width: 30,
    height: 22,
    borderRadius: 3,
    backgroundColor: '#1E3A5F',
  },
  modalCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  modalCodeActive: {
    color: C.accentText,
    fontWeight: '700',
  },
  checkMark: {
    fontSize: 15,
    color: C.accent,
    fontWeight: '700',
  },
});