// File: src/screens/LoginScreen.tsx
import React, { useState, useContext } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  bg:           '#0A0F1E',
  surface:      '#111827',
  border:       'rgba(255,255,255,0.08)',
  borderFocus:  'rgba(59,130,246,0.5)',
  textPrimary:  '#E2E8F0',
  textMuted:    '#64748B',
  textDim:      '#475569',
  accent:       '#2563EB',
  accentHover:  '#1D4ED8',
};

export default function LoginScreen() {
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) return alert('Harap isi semua kolom!');
    setLocalLoading(true);
    await login(email, password);
    setLocalLoading(false);
  };

  const inputStyle = (field: string) => [
    s.input,
    focusedField === field && s.inputFocused,
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={s.container}
    >
      <View style={s.inner}>
        {/* Brand mark */}
        <View style={s.brandWrap}>
          <View style={s.brandDot} />
          <Text style={s.brandLabel}>GLOBAL PRICING</Text>
        </View>

        {/* Headline */}
        <Text style={s.title}>Welcome back</Text>
        <Text style={s.subtitle}>
          Masuk untuk mengakses enterprise market analytics
        </Text>

        {/* Form */}
        <View style={s.formGroup}>
          <Text style={s.label}>Email address</Text>
          <TextInput
            style={inputStyle('email')}
            placeholder="name@company.com"
            placeholderTextColor={C.textDim}
            value={email}
            onChangeText={setEmail}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
            autoCapitalize="none"
            keyboardType="email-address"
            selectionColor={C.accent}
          />
        </View>

        <View style={s.formGroup}>
          <Text style={s.label}>Password</Text>
          <TextInput
            style={inputStyle('password')}
            placeholder="••••••••"
            placeholderTextColor={C.textDim}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
            secureTextEntry
            selectionColor={C.accent}
          />
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[s.button, localLoading && s.buttonLoading]}
          onPress={handleLogin}
          disabled={localLoading}
          activeOpacity={0.85}
        >
          {localLoading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={s.buttonText}>Sign in</Text>
          }
        </TouchableOpacity>

        {/* Footer note */}
        <Text style={s.footerNote}>
          Akses terbatas untuk pengguna terdaftar.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    justifyContent: 'center',
    padding: 24,
  },
  inner: {
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },

  // Brand
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 40,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.accent,
  },
  brandLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textDim,
    letterSpacing: 0.15,
  },

  // Headline
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: C.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 8,
    ...Platform.select({
      ios:     { fontFamily: 'SF Pro Display' },
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  subtitle: {
    fontSize: 14,
    color: C.textMuted,
    lineHeight: 22,
    marginBottom: 36,
  },

  // Form
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textMuted,
    marginBottom: 8,
    letterSpacing: 0.05,
  },
  input: {
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: C.textPrimary,
    fontSize: 15,
  },
  inputFocused: {
    borderColor: C.borderFocus,
    backgroundColor: 'rgba(59,130,246,0.04)',
  },

  // Button
  button: {
    height: 50,
    backgroundColor: C.accent,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonLoading: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
  },

  // Footer
  footerNote: {
    textAlign: 'center',
    fontSize: 12,
    color: C.textDim,
    marginTop: 24,
  },
});