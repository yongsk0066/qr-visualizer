import { getCurrentLanguage, setLanguage, getLanguages } from '../i18n';
import { useState } from 'react';

export function LanguageSelector() {
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage());
  const languages = getLanguages();

  const handleLanguageChange = (langCode: 'ko' | 'en') => {
    setLanguage(langCode);
    setCurrentLang(langCode);
    
    // For static builds, redirect to the appropriate language path
    const isStaticBuild = window.location.pathname.includes('/qr-visualizer/');
    if (isStaticBuild) {
      const basePath = '/qr-visualizer/';
      if (langCode === 'en') {
        window.location.href = basePath + 'en/';
      } else {
        window.location.href = basePath;
      }
    } else {
      // For development, just reload to apply language changes
      window.location.reload();
    }
  };

  return (
    <div className="flex gap-2">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleLanguageChange(lang.code)}
          className={`
            px-3 py-1 text-sm rounded transition-colors
            ${currentLang === lang.code 
              ? 'bg-black text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
          aria-label={`Switch to ${lang.name}`}
        >
          {lang.name}
        </button>
      ))}
    </div>
  );
}