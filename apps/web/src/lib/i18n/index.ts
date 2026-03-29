import type { Locale, TranslationKeys } from './types'

// Static imports so all locales are bundled (each stub re-exports en, so no extra weight until translated)
import en from './locales/en'
import es from './locales/es'
import fr from './locales/fr'
import de from './locales/de'
import it from './locales/it'
import ja from './locales/ja'
import zh from './locales/zh'
import ar from './locales/ar'

const locales: Record<Locale, TranslationKeys> = { en, es, fr, de, it, ja, zh, ar }

export function getTranslations(locale: Locale): TranslationKeys {
  return locales[locale] ?? locales['en']
}

export { LANGUAGES } from './types'
export type { Locale, TranslationKeys } from './types'
