// File: App.tsx
import React, { useContext } from 'react';
import {
  View,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { CurrencyProvider } from './src/context/CurrencyContext';
import Svg, { Path, Line, Rect } from 'react-native-svg';

// Screens
import LoginScreen     from './src/screens/LoginScreen';
import SearchScreen    from './src/screens/SearchScreen';
import ShoppingListScreen from './src/screens/ShoppingListScreen';
import PromoScreen     from './src/screens/PromoScreen';

// ─── Palette (harus konsisten dengan SearchScreen) ───────────────────────────
const C = {
  bg:          '#0A0F1E',
  border:      'rgba(255,255,255,0.08)',
  textPrimary: '#E2E8F0',
  textMuted:   '#64748B',
  accent:      '#2563EB',
  danger:      '#EF4444',
  dangerSoft:  'rgba(239,68,68,0.12)',
  dangerBorder:'rgba(239,68,68,0.22)',
};

// ─── SVG Icons — pixel-perfect Tabler-style outline ──────────────────────────
// Pastikan sudah terinstall: npx expo install react-native-svg

// Promo / Ticket icon
const TicketIcon = ({ color }: { color: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v1.5a1.5 1.5 0 0 0 0 3V15a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-1.5a1.5 1.5 0 0 0 0-3V9Z"
      stroke={color}
      strokeWidth={1.6}
      strokeLinejoin="round"
    />
    <Line x1="9" y1="8.5" x2="9" y2="15.5" stroke={color} strokeWidth={1.5} strokeDasharray="2 2" strokeLinecap="round" />
  </Svg>
);

// Archive / Inventory icon
const BoxIcon = ({ color }: { color: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="4" rx="1.5" stroke={color} strokeWidth={1.6} />
    <Path
      d="M5 8v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"
      stroke={color}
      strokeWidth={1.6}
      strokeLinejoin="round"
    />
    <Line x1="10" y1="12" x2="14" y2="12" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
  </Svg>
);

// Power / Logout icon
const PowerIcon = ({ color }: { color: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M7 6.5A8 8 0 1 0 17 6.5"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
    />
    <Line x1="12" y1="3" x2="12" y2="12" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
  </Svg>
);

// ─── Navigator ────────────────────────────────────────────────────────────────
const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { user, logout, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="small" color={C.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle:        { backgroundColor: C.bg },
          headerShadowVisible: false,
          headerTintColor:    C.textPrimary,
          headerTitleStyle:   {
            fontWeight: '700',
            fontSize: 16,
            color: C.textPrimary,
            ...Platform.select({
              ios:     { fontFamily: 'SF Pro Display' },
              android: { fontFamily: 'sans-serif-medium' },
            }),
          },
          contentStyle: { backgroundColor: C.bg },
        }}
      >
        {user ? (
          <>
            {/* ── Main: Search / Global Pricing ── */}
            <Stack.Screen
              name="Cek Harga"
              component={SearchScreen}
              options={({ navigation }) => ({
                headerTitle: 'Global Pricing',
                headerRight: () => (
                  <View style={s.headerActions}>
                    {/* Promo */}
                    <TouchableOpacity
                      style={s.iconBtn}
                      onPress={() => navigation.navigate('Promo')}
                      activeOpacity={0.6}
                    >
                      <TicketIcon color={C.textMuted} />
                    </TouchableOpacity>

                    {/* Inventory */}
                    <TouchableOpacity
                      style={s.iconBtn}
                      onPress={() => navigation.navigate('Catatan Belanja')}
                      activeOpacity={0.6}
                    >
                      <BoxIcon color={C.textMuted} />
                    </TouchableOpacity>

                    {/* Logout — diberi warna danger */}
                    <TouchableOpacity
                      style={[s.iconBtn, s.iconBtnDanger]}
                      onPress={logout}
                      activeOpacity={0.6}
                    >
                      <PowerIcon color={C.danger} />
                    </TouchableOpacity>
                  </View>
                ),
              })}
            />

            {/* ── Inventory ── */}
            <Stack.Screen
              name="Catatan Belanja"
              component={ShoppingListScreen}
              options={{
                headerTitle: 'Inventory Control',
                animation:   'slide_from_right',
                headerStyle: { backgroundColor: C.bg },
              }}
            />

            {/* ── Promo — modal overlay ── */}
            <Stack.Screen
              name="Promo"
              component={PromoScreen}
              options={{
                headerTitle:  '',
                presentation: 'transparentModal',
                animation:    'fade_from_bottom',
              }}
            />
          </>
        ) : (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.bg,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: Platform.OS === 'android' ? 4 : 0,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: 0.5,
    borderColor: C.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  iconBtnDanger: {
    backgroundColor: C.dangerSoft,
    borderColor:     C.dangerBorder,
    marginLeft: 8,
  },
});

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <AppNavigator />
      </CurrencyProvider>
    </AuthProvider>
  );
}