export const colors = {
  navy: '#0E1B32',
  navy800: '#162A4E',
  gold: '#C9A96E',
  gold600: '#B5955A',
  background: '#FAF9F6',
  foreground: '#1A1A1A',
  card: '#FFFFFF',
  border: '#E5E3DE',
  muted: '#6B7280',
  mutedLight: '#9CA3AF',
  success: '#10B981',
  danger: '#EF4444',
  white: '#FFFFFF',
  black: '#000000',
} as const

export const radii = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 20,
  full: 9999,
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const

export type ThemeColor = keyof typeof colors
