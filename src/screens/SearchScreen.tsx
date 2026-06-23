// File: src/screens/SearchScreen.tsx
import React, { useState } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { searchProducts, Product } from '../services/api';
import { db } from '../services/firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useCurrency } from '../context/CurrencyContext';

const PROMO_KEYWORDS = [
  'iphone', 'calvin klein', 'mascara', 'eyeshadow', 'powder',
  'lipstick', 'nail polish', 'sarung jempol',
];

// ─── Palette ────────────────────────────────────────────────────────────────
const C = {
  bg:          '#0A0F1E',
  surface:     '#111827',
  surfaceHigh: '#151E30',
  border:      'rgba(255,255,255,0.08)',
  borderFocus: 'rgba(59,130,246,0.45)',
  textPrimary: '#E2E8F0',
  textMuted:   '#64748B',
  textDim:     '#475569',
  accent:      '#2563EB',
  accentSoft:  'rgba(37,99,235,0.12)',
  accentBorder:'rgba(37,99,235,0.28)',
  accentText:  '#60A5FA',
  price:       '#F97316',
  priceSoft:   'rgba(249,115,22,0.12)',
  priceBorder: 'rgba(249,115,22,0.25)',
  danger:      '#EF4444',
  success:     '#10B981',
};

export default function SearchScreen() {
  const [queryInput,        setQueryInput]        = useState('');
  const [products,          setProducts]          = useState<Product[]>([]);
  const [loading,           setLoading]           = useState(false);
  const [isModalVisible,    setIsModalVisible]    = useState(false);
  const [currencySearch,    setCurrencySearch]    = useState('');
  const [page,              setPage]              = useState(1);
  const [isFetchingMore,    setIsFetchingMore]    = useState(false);
  const [hasMoreData,       setHasMoreData]       = useState(true);

  const {
    selectedCurrency,
    setSelectedCurrency,
    currencyList,
    formatDynamicPrice,
    getFlagUrl,
  } = useCurrency();

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleOpenProductUrl = (url: string | undefined) => {
    if (!url) return;
    Linking.openURL(url).catch((err) => console.error('Gagal membuka URL:', err));
  };

  const handleSearch = async () => {
    const q = queryInput.trim();
    if (!q) return;
    setLoading(true);
    setPage(1);
    setHasMoreData(true);
    setProducts([]);
    try {
      const results = await searchProducts(q, 1);
      setProducts(results);
      if (results.length === 0) setHasMoreData(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreData = async () => {
    if (loading || isFetchingMore || !hasMoreData) return;
    setIsFetchingMore(true);
    try {
      const nextPage = page + 1;
      const more = await searchProducts(queryInput.trim(), nextPage);
      if (more.length > 0) {
        setProducts((prev) => [...prev, ...more]);
        setPage(nextPage);
      } else {
        setHasMoreData(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingMore(false);
    }
  };

  const handleAddToInventory = async (item: Product) => {
    try {
      const priceUSD =
        typeof item.price === 'string'
          ? parseFloat((item.price as string).replace(/[^0-9.-]+/g, ''))
          : item.price;

      const q = query(collection(db, 'shopping_lists'), where('title', '==', item.title));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const existing = snap.docs[0];
        await updateDoc(doc(db, 'shopping_lists', existing.id), {
          quantity: (existing.data().quantity || 1) + 1,
        });
      } else {
        await addDoc(collection(db, 'shopping_lists'), {
          title:     item.title,
          priceUSD:  priceUSD || 0,
          imageUrl:  item.imageUrl || '',
          quantity:  1,
          createdAt: new Date(),
        });
      }
      Alert.alert('Sukses', 'Barang berhasil ditambahkan ke inventaris.');
    } catch (e) {
      console.error('Gagal menambahkan ke inventaris:', e);
    }
  };

  const filteredCurrencies = currencyList.filter((c) =>
    c.toLowerCase().includes(currencySearch.toLowerCase())
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={s.container}>

      {/* ── Page Header ── */}
      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>Global Price Analytics</Text>
      </View>

      {/* ── Search Bar ── */}
      <View style={s.searchRow}>
        <TextInput
          style={s.searchInput}
          placeholder="Cari komoditas pasar global..."
          placeholderTextColor={C.textDim}
          value={queryInput}
          onChangeText={setQueryInput}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          selectionColor={C.accent}
        />
        <TouchableOpacity style={s.searchBtn} onPress={handleSearch} activeOpacity={0.8}>
          <Text style={s.searchBtnText}>Cari</Text>
        </TouchableOpacity>
      </View>

      {/* ── Currency Selector ── */}
      <View style={s.sectionBlock}>
        <Text style={s.sectionLabel}>CONVERT MARKET VALUE TO</Text>
        <TouchableOpacity
          style={s.currencySelector}
          onPress={() => { setCurrencySearch(''); setIsModalVisible(true); }}
          activeOpacity={0.7}
        >
          <View style={s.currencyLeft}>
            <Image
              source={{ uri: getFlagUrl(selectedCurrency) }}
              style={s.flagImg}
              resizeMode="cover"
            />
            <Text style={s.currencyCode}>{selectedCurrency}</Text>
            <Text style={s.currencySync}>• Synced</Text>
          </View>
          <Text style={s.chevron}>▾</Text>
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
            {/* Handle */}
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
                        style={s.modalFlagImg}
                        resizeMode="cover"
                      />
                      <Text style={[s.modalCurrencyCode, active && s.modalCurrencyCodeActive]}>
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

      {/* ── Product List ── */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.accent} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item, idx) => `${item.id}-${idx}`}
          contentContainerStyle={{ paddingBottom: 48 }}
          onEndReached={loadMoreData}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingMore ? (
              <ActivityIndicator
                size="small"
                color={C.textMuted}
                style={{ marginVertical: 16 }}
              />
            ) : null
          }
          renderItem={({ item }) => {
            const currentPrice =
              typeof item.price === 'string'
                ? parseFloat((item.price as string).replace(/[^0-9.-]+/g, ''))
                : (item.price || 0);

            const isPromo = PROMO_KEYWORDS.some((kw) =>
              item.title.toLowerCase().includes(kw.toLowerCase())
            );
            const originalPrice =
              (item as any).originalPriceUSD ||
              (isPromo ? currentPrice * 1.45 : currentPrice);
            const discount = Math.round(
              ((originalPrice - currentPrice) / originalPrice) * 100
            );
            const showPromo = discount > 0 && discount < 100;

            return (
              <View style={s.productCard}>
                <View style={s.cardRow}>
                  {/* Thumbnail */}
                  <View style={s.imgWrap}>
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={s.productImg as any}
                      resizeMode="contain"
                    />
                  </View>

                  {/* Info */}
                  <View style={s.productMeta}>
                    <Text style={s.productBrand}>{item.brand}</Text>
                    <Text style={s.productName} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={s.productRating}>
                      {(() => {
                        const r = Math.round(parseFloat(String(item.rating ?? 0)) || 0);
                        return `${'★'.repeat(r)}${'☆'.repeat(5 - r)}  ${item.rating ?? '-'}`;
                      })()}
                    </Text>

                    {item.url ? (
                      <TouchableOpacity
                        onPress={() => handleOpenProductUrl(item.url)}
                        activeOpacity={0.6}
                      >
                        <Text style={s.productLink}>Lihat di toko ↗</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={s.productLinkDisabled}>Tautan tidak tersedia</Text>
                    )}
                  </View>
                </View>

                {/* Price Block */}
                <View style={s.priceBlock}>
                  <Text style={s.priceMain}>{formatDynamicPrice(currentPrice)}</Text>
                  {showPromo && (
                    <View style={s.priceSubRow}>
                      <Text style={s.priceOriginal}>{formatDynamicPrice(originalPrice)}</Text>
                      <View style={s.discountBadge}>
                        <Text style={s.discountText}>–{discount}%</Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Add Button */}
                <TouchableOpacity
                  style={s.addBtn}
                  onPress={() => handleAddToInventory(item)}
                  activeOpacity={0.7}
                >
                  <Text style={s.addBtnText}>+ Tambah ke Inventaris</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  // Header
  pageHeader: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: C.textPrimary,
    letterSpacing: -0.5,
    ...Platform.select({
      ios:     { fontFamily: 'SF Pro Display' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },

  // Search
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: C.textPrimary,
  },
  searchBtn: {
    width: 84,
    height: 48,
    backgroundColor: C.accent,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  // Currency
  sectionBlock: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textDim,
    letterSpacing: 0.1,
    marginBottom: 8,
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  currencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flagImg: {
    width: 30,
    height: 22,
    borderRadius: 3,
    backgroundColor: C.surfaceHigh,
  },
  currencyCode: {
    fontSize: 15,
    fontWeight: '700',
    color: C.textPrimary,
  },
  currencySync: {
    fontSize: 11,
    fontWeight: '600',
    color: C.success,
  },
  chevron: {
    fontSize: 14,
    color: C.textDim,
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
    backgroundColor: 'rgba(37,99,235,0.1)',
  },
  modalRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  modalFlagImg: {
    width: 30,
    height: 22,
    borderRadius: 3,
    backgroundColor: C.surfaceHigh,
  },
  modalCurrencyCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  modalCurrencyCodeActive: {
    color: C.accentText,
    fontWeight: '700',
  },
  checkMark: {
    fontSize: 15,
    color: C.accent,
    fontWeight: '700',
  },

  // Product Card
  productCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 14,
  },
  imgWrap: {
    width: 88,
    height: 88,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  productImg: {
    width: 72,
    height: 72,
  },
  productMeta: {
    flex: 1,
    gap: 3,
  },
  productBrand: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textPrimary,
    lineHeight: 20,
  },
  productRating: {
    fontSize: 11,
    color: '#F59E0B',
    marginTop: 2,
  },
  productLink: {
    fontSize: 12,
    color: C.accentText,
    fontWeight: '600',
    marginTop: 3,
  },
  productLinkDisabled: {
    fontSize: 12,
    color: C.textDim,
    marginTop: 3,
  },

  // Price
  priceBlock: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  priceMain: {
    fontSize: 22,
    fontWeight: '700',
    color: C.price,
    letterSpacing: -0.5,
    ...Platform.select({
      ios:     { fontFamily: 'Courier New' },
      android: { fontFamily: 'monospace' },
    }),
  },
  priceSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  priceOriginal: {
    fontSize: 13,
    color: C.textDim,
    textDecorationLine: 'line-through',
    ...Platform.select({
      ios:     { fontFamily: 'Courier New' },
      android: { fontFamily: 'monospace' },
    }),
  },
  discountBadge: {
    backgroundColor: C.priceSoft,
    borderWidth: 0.5,
    borderColor: C.priceBorder,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.price,
  },

  // Add Button
  addBtn: {
    marginTop: 14,
    height: 42,
    backgroundColor: C.accentSoft,
    borderWidth: 0.5,
    borderColor: C.accentBorder,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: C.accentText,
    fontWeight: '700',
    fontSize: 13,
  },

  // Misc
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});