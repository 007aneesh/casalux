import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0E1B32', 800: '#162A4E' },
        gold: { DEFAULT: '#C9A96E', 600: '#B5955A' },
        background: '#FAF9F6',
        foreground: '#1A1A1A',
        card: '#FFFFFF',
        border: '#E5E3DE',
        muted: '#6B7280',
        success: '#10B981',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter_400Regular'],
        'sans-medium': ['Inter_500Medium'],
        'sans-semibold': ['Inter_600SemiBold'],
        'sans-bold': ['Inter_700Bold'],
        display: ['PlayfairDisplay_600SemiBold'],
        'display-bold': ['PlayfairDisplay_700Bold'],
      },
      borderRadius: {
        DEFAULT: '12px',
        md: '8px',
        sm: '4px',
        xl: '20px',
      },
    },
  },
  plugins: [],
}

export default config
