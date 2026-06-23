// File: src/screens/PromoScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import axios from 'axios';

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  bg:          '#0A0F1E',
  surface:     'rgba(255,255,255,0.04)',
  border:      'rgba(255,255,255,0.08)',
  textPrimary: '#E2E8F0',
  textMuted:   '#64748B',
  textDim:     '#475569',
  accent:      '#2563EB',
  accentSoft:  'rgba(37,99,235,0.12)',
  accentBorder:'rgba(37,99,235,0.28)',
  accentText:  '#60A5FA',
};

// Setiap promo punya aksen warna tipis yang berbeda — subtle, bukan pastel terang
const ACCENT_RAMPS = [
  { line: 'rgba(99,102,241,0.5)',  badge: 'rgba(99,102,241,0.1)',  text: '#818CF8' },  // Indigo
  { line: 'rgba(16,185,129,0.5)',  badge: 'rgba(16,185,129,0.1)',  text: '#34D399' },  // Emerald
  { line: 'rgba(249,115,22,0.5)',  badge: 'rgba(249,115,22,0.1)',  text: '#FB923C' },  // Orange
  { line: 'rgba(236,72,153,0.5)',  badge: 'rgba(236,72,153,0.1)',  text: '#F472B6' },  // Pink
  { line: 'rgba(14,165,233,0.5)',  badge: 'rgba(14,165,233,0.1)',  text: '#38BDF8' },  // Sky
];

export default function PromoScreen({ navigation }: any) {
  const [promoData,  setPromoData]  = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPromos = async () => {
    const options = {
      method: 'GET',
      url: 'https://real-time-amazon-data.p.rapidapi.com/product-category-list',
      params: { country: 'US' },
      headers: {
        'x-rapidapi-key':  '337a04733cmshad831c3afa64693p148ff3jsne80ccd3efa00',
        'x-rapidapi-host': 'real-time-amazon-data.p.rapidapi.com',
        'Content-Type':    'application/json',
      },
    };

    try {
      const res        = await axios.request(options);
      const categories = res.data.data || [];

      const vouchers = categories.slice(0, 10).map((item: any, i: number) => {
        const ramp      = ACCENT_RAMPS[i % ACCENT_RAMPS.length];
        const discount  = Math.floor(Math.random() * 40) + 10;
        const cleanName = item.name.replace(/\s+/g, '').toUpperCase().substring(0, 6);

        return {
          id:          item.id || String(i),
          title:       item.name,
          description: `Diskon eksklusif untuk kategori ${item.name}.`,
          code:        `AMZN-${cleanName}-${discount}`,
          discount:    `${discount}%`,
          ramp,
        };
      });

      setPromoData(vouchers);
    } catch (e) {
      console.error('Gagal memuat promo:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchPromos(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchPromos(); };

  const handleUsePromo = (code: string) => {
    Alert.alert(
      'Voucher disalin',
      `Kode: ${code}\n\nMasukkan di halaman keranjang untuk mendapat diskon.`,
      [
        { text: 'Tutup',           style: 'cancel' },
        { text: 'Ke Inventaris',   onPress: () => navigation.navigate('Catatan Belanja') },
      ],
    );
  };

  if (loading) {
    return (
      <View style={[s.container, s.center]}>
        <ActivityIndicator size="large" color={C.accent} />
        <Text style={s.loadingText}>Memuat penawaran...</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <FlatList
        data={promoData}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.accent}
          />
        }
        ListHeaderComponent={
          <View style={s.header}>
            <Text style={s.headerTitle}>Voucher aktif</Text>
            <Text style={s.headerSub}>
              Penawaran eksklusif yang tersedia untuk akun kamu hari ini.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            {/* Accent bar kiri */}
            <View style={[s.accentBar, { backgroundColor: item.ramp.line }]} />

            <View style={s.cardInner}>
              {/* Top section */}
              <View style={s.cardTop}>
                <View style={[s.discountBadge, { backgroundColor: item.ramp.badge }]}>
                  <Text style={[s.discountText, { color: item.ramp.text }]}>
                    {item.discount} OFF
                  </Text>
                </View>
                <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={s.cardDesc}  numberOfLines={2}>{item.description}</Text>
              </View>

              {/* Divider perforated */}
              <View style={s.perfRow}>
                <View style={[s.perfNotch, { left: -20 }]} />
                <View style={s.perfLine} />
                <View style={[s.perfNotch, { right: -20 }]} />
              </View>

              {/* Bottom section */}
              <View style={s.cardBottom}>
                <View>
                  <Text style={s.codeLabel}>KODE PROMO</Text>
                  <Text style={s.codeValue} selectable>{item.code}</Text>
                </View>
                <TouchableOpacity
                  style={[s.copyBtn, { borderColor: item.ramp.line }]}
                  onPress={() => handleUsePromo(item.code)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.copyBtnText, { color: item.ramp.text }]}>Salin</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 14,
    color: C.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  list: {
    padding: 20,
    paddingBottom: 48,
  },

  // Header
  header: {
    marginBottom: 28,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: C.textPrimary,
    letterSpacing: -0.5,
    ...Platform.select({
      ios:     { fontFamily: 'SF Pro Display' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  headerSub: {
    fontSize: 14,
    color: C.textMuted,
    marginTop: 6,
    lineHeight: 21,
  },

  // Card
  card: {
    backgroundColor: C.surface,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  accentBar: {
    width: 3,
    // height fills via flexbox stretch
  },
  cardInner: {
    flex: 1,
    padding: 20,
  },
  cardTop: {
    marginBottom: 16,
  },
  discountBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  cardDesc: {
    fontSize: 13,
    color: C.textMuted,
    lineHeight: 19,
  },

  // Perforated divider
  perfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  perfNotch: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.bg,
  },
  perfLine: {
    flex: 1,
    height: 0.5,
    marginHorizontal: 8,
    borderWidth: 0.5,
    borderColor: C.border,
    borderStyle: 'dashed',
  },

  // Bottom
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textDim,
    letterSpacing: 0.1,
    marginBottom: 4,
  },
  codeValue: {
    fontSize: 15,
    fontWeight: '700',
    color: C.textPrimary,
    letterSpacing: 1.2,
    ...Platform.select({
      ios:     { fontFamily: 'Courier New' },
      android: { fontFamily: 'monospace' },
    }),
  },
  copyBtn: {
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  copyBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});