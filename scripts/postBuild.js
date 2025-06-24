import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const languages = [
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

const distPath = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distPath, 'index.html');

// Read the base HTML
const baseHtml = fs.readFileSync(indexPath, 'utf8');

// Create English version
languages.forEach(lang => {
  const enPath = path.join(distPath, lang.code);
  
  // Create directory
  if (!fs.existsSync(enPath)) {
    fs.mkdirSync(enPath, { recursive: true });
  }

  // Modify HTML for English
  let modifiedHtml = baseHtml
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
    .replace(/<link rel="canonical" href=".*?"/, `<link rel="canonical" href="https://yongsk0066.github.io/qr-visualizer/${lang.code}/"`)
    .replace('</head>', `  <link rel="alternate" hreflang="ko" href="https://yongsk0066.github.io/qr-visualizer/" />
  <link rel="alternate" hreflang="en" href="https://yongsk0066.github.io/qr-visualizer/en/" />
  <link rel="alternate" hreflang="x-default" href="https://yongsk0066.github.io/qr-visualizer/" />
  <script>
    // Set language preference
    window.__QR_LANG__ = '${lang.code}';
  </script>
</head>`);

  // Write the file
  fs.writeFileSync(path.join(enPath, 'index.html'), modifiedHtml);
  console.log(`Created ${lang.code}/index.html`);
});

// Update Korean version with hreflang tags
const koHtml = baseHtml.replace('</head>', `  <link rel="alternate" hreflang="ko" href="https://yongsk0066.github.io/qr-visualizer/" />
  <link rel="alternate" hreflang="en" href="https://yongsk0066.github.io/qr-visualizer/en/" />
  <link rel="alternate" hreflang="x-default" href="https://yongsk0066.github.io/qr-visualizer/" />
  <script>
    // Set language preference
    window.__QR_LANG__ = 'ko';
  </script>
</head>`);

fs.writeFileSync(indexPath, koHtml);
console.log('Updated Korean index.html with hreflang tags');