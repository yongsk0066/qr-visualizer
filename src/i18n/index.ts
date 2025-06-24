import koTranslations from '../locales/ko.json';
import enTranslations from '../locales/en.json';

const translations = {
  ko: koTranslations,
  en: enTranslations
} as const;

type Language = keyof typeof translations;

// Get initial language from various sources
function getInitialLanguage(): Language {
  // 1. Check URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  if (urlLang && (urlLang === 'ko' || urlLang === 'en')) {
    return urlLang;
  }

  // 2. Check window.__QR_LANG__ set by build script
  if (window.__QR_LANG__ && (window.__QR_LANG__ === 'ko' || window.__QR_LANG__ === 'en')) {
    return window.__QR_LANG__;
  }

  // 3. Check localStorage
  const savedLang = localStorage.getItem('qr-visualizer-lang');
  if (savedLang && (savedLang === 'ko' || savedLang === 'en')) {
    return savedLang as Language;
  }

  // 4. Check HTML lang attribute
  const htmlLang = document.documentElement.lang;
  if (htmlLang.startsWith('en')) return 'en';
  if (htmlLang.startsWith('ko')) return 'ko';

  // 5. Check browser language
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('ko')) return 'ko';
  
  // Default to English for international audience
  return 'en';
}

let currentLanguage: Language = getInitialLanguage();

// Helper to get nested translation value
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  return path.split('.').reduce((acc: unknown, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj) as string || path;
}

// Main translation function
export function t(key: string): string {
  const translation = getNestedValue(translations[currentLanguage], key);
  if (translation) return translation;
  
  // Fallback to Korean if English translation is missing
  const fallback = getNestedValue(translations.ko, key);
  if (fallback) {
    // Log warning in development if current language translation is missing
    if (import.meta.env.DEV && currentLanguage !== 'ko') {
      console.warn(`Missing ${currentLanguage} translation for key: ${key}`);
    }
    return fallback;
  }
  
  // Log error in development if no translation found at all
  if (import.meta.env.DEV) {
    console.error(`Missing translation for key: ${key}`);
  }
  
  // Return key with visual indicator in development
  return import.meta.env.DEV ? `⚠️ ${key}` : key;
}

// Get current language
export function getCurrentLanguage(): Language {
  return currentLanguage;
}

// Set language
export function setLanguage(lang: Language): void {
  currentLanguage = lang;
  localStorage.setItem('qr-visualizer-lang', lang);
  document.documentElement.lang = lang;
  
  // Update URL without reload if on client-side
  const url = new URL(window.location.href);
  url.searchParams.set('lang', lang);
  window.history.replaceState({}, '', url.toString());
}

// Get available languages
export function getLanguages(): Array<{ code: Language; name: string }> {
  return [
    { code: 'ko', name: '한국어' },
    { code: 'en', name: 'English' }
  ];
}

// Add type declaration for window.__QR_LANG__
declare global {
  interface Window {
    __QR_LANG__?: Language;
  }
}