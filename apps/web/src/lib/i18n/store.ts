import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getTranslations, LANGUAGES } from './index'
import type { Locale, TranslationKeys } from './types'

interface LanguageState {
  locale: Locale
  t: TranslationKeys
  isRTL: boolean
  setLocale: (locale: Locale) => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      locale: 'en',
      t: getTranslations('en'),
      isRTL: false,
      setLocale: (locale: Locale) => {
        const lang = LANGUAGES.find((l) => l.code === locale)
        const isRTL = lang?.rtl ?? false
        if (typeof document !== 'undefined') {
          document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
          document.documentElement.lang = locale
        }
        set({ locale, t: getTranslations(locale), isRTL })
      },
    }),
    {
      name: 'casalux-language',
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== 'undefined') {
          document.documentElement.dir = state.isRTL ? 'rtl' : 'ltr'
          document.documentElement.lang = state.locale
        }
      },
    }
  )
)

export const useTranslation = () => {
  const { t, locale, isRTL } = useLanguageStore()
  return { t, locale, isRTL }
}
