export const Theme = {
  colors: {
    primary: '#1E3A8A',     // Deep Navy
    secondary: '#3B82F6',   // Accent Blue
    background: '#F8FAFC',  // Light Gray Slate
    surface: '#FFFFFF',     // Pure White
    textPrimary: '#0F172A', // Dark Slate (Kuat untuk membaca)
    textSecondary: '#64748B',// Muted Slate
    border: '#E2E8F0',      // Soft Border
    error: '#EF4444',       // Coral Red
    success: '#10B981',     // Emerald Green
    warning: '#F59E0B',     // Amber
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  roundness: {
    sm: 6,
    md: 12,
    lg: 16,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 4,
    },
  }
};