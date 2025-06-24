import type { Plugin } from 'vite';

interface LanguageConfig {
  code: string;
  name: string;
  htmlLang: string;
  meta: {
    title: string;
    description: string;
    keywords: string;
    ogLocale: string;
  };
}

const languages: LanguageConfig[] = [
  {
    code: 'ko',
    name: '한국어',
    htmlLang: 'ko',
    meta: {
      title: 'QR Visualizer - QR 코드 생성 과정 학습',
      description: 'QR 코드의 인코딩과 디코딩 과정을 단계별로 시각화하여 학습합니다. 전체 과정을 인터랙티브하게 탐색해보세요.',
      keywords: 'QR 코드, 시각화, Reed-Solomon, 에러 정정, ISO/IEC 18004, 인코딩, 디코딩',
      ogLocale: 'ko_KR'
    }
  },
  {
    code: 'en',
    name: 'English',
    htmlLang: 'en',
    meta: {
      title: 'QR Visualizer - Learn How QR Codes Work',
      description: 'Visualize each step of QR code encoding and decoding. Explore the entire process interactively.',
      keywords: 'QR code, visualization, Reed-Solomon, error correction, ISO/IEC 18004, encoding, decoding',
      ogLocale: 'en_US'
    }
  }
];

export function multiLanguagePlugin(): Plugin {
  return {
    name: 'multi-language-plugin',
    generateBundle(_options, bundle) {
      // Find the main HTML file
      const htmlFile = Object.keys(bundle).find(name => name === 'index.html');
      if (!htmlFile) return;

      const html = bundle[htmlFile] as { source: string; fileName: string; type: 'asset' };
      const baseHtml = html.source;

      // Generate HTML for each language
      languages.forEach(lang => {
        const modifiedHtml = baseHtml
          .replace(/<html[^>]*>/, `<html lang="${lang.htmlLang}">`)
          .replace(/<title>.*?<\/title>/, `<title>${lang.meta.title}</title>`)
          .replace(/<meta name="title" content=".*?"/, `<meta name="title" content="${lang.meta.title}"`)
          .replace(/<meta name="description" content=".*?"/, `<meta name="description" content="${lang.meta.description}"`)
          .replace(/<meta name="keywords" content=".*?"/, `<meta name="keywords" content="${lang.meta.keywords}"`)
          .replace(/<meta property="og:title" content=".*?"/, `<meta property="og:title" content="${lang.meta.title}"`)
          .replace(/<meta property="og:description" content=".*?"/, `<meta property="og:description" content="${lang.meta.description}"`)
          .replace(/<meta property="og:locale" content=".*?"/, `<meta property="og:locale" content="${lang.meta.ogLocale}"`)
          .replace(/<meta property="twitter:title" content=".*?"/, `<meta property="twitter:title" content="${lang.meta.title}"`)
          .replace(/<meta property="twitter:description" content=".*?"/, `<meta property="twitter:description" content="${lang.meta.description}"`)
          .replace(/<meta name="language" content=".*?"/, `<meta name="language" content="${lang.name}"`)
          .replace(/<link rel="canonical" href=".*?"/, `<link rel="canonical" href="https://yongsk0066.github.io/qr-visualizer/${lang.code === 'ko' ? '' : lang.code + '/'}"`)
          .replace('</head>', `  <link rel="alternate" hreflang="${lang.code}" href="https://yongsk0066.github.io/qr-visualizer/${lang.code === 'ko' ? '' : lang.code + '/'}" />
  <link rel="alternate" hreflang="x-default" href="https://yongsk0066.github.io/qr-visualizer/" />
  <script>
    // Set language preference
    window.__QR_LANG__ = '${lang.code}';
  </script>
</head>`);

        if (lang.code === 'ko') {
          // Keep the default index.html for Korean
          html.source = modifiedHtml;
        } else {
          // Create separate HTML files for other languages
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (bundle as any)[`${lang.code}/index.html`] = {
            type: 'asset',
            fileName: `${lang.code}/index.html`,
            source: modifiedHtml,
            name: undefined,
            names: [],
            originalFileName: null,
            originalFileNames: []
          };
        }
      });
    }
  };
}