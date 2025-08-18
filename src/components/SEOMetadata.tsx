import { t, LANG } from '../config/language';

export function SEOMetadata() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "QR Visualizer",
    "description": t(
      "QR 코드가 데이터를 저장하고 읽는 과정을 단계별로 시각화하는 교육용 웹 애플리케이션",
      "Educational web application that visualizes step-by-step how QR codes store and read data"
    ),
    "url": `https://yongsk0066.github.io/qr-visualizer/${LANG}`,
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "author": {
      "@type": "Person",
      "name": "yongsk0066",
      "url": "https://github.com/yongsk0066"
    },
    "publisher": {
      "@type": "Organization",
      "name": "yongsk0066",
      "logo": {
        "@type": "ImageObject",
        "url": "https://yongsk0066.github.io/qr-visualizer/qr-finder.svg"
      }
    },
    "datePublished": "2024-12-01",
    "dateModified": "2025-01-18",
    "inLanguage": LANG === 'ko' ? "ko-KR" : "en-US",
    "keywords": t(
      "QR코드, QR Code, 바코드, 시각화, Reed-Solomon, 에러정정, ISO/IEC 18004",
      "QR code, barcode, visualization, Reed-Solomon, error correction, ISO/IEC 18004"
    ),
    "educationalUse": t(
      "QR 코드의 인코딩 및 디코딩 과정 학습",
      "Learning QR code encoding and decoding process"
    ),
    "learningResourceType": "Interactive Resource",
    "interactionType": "mixed",
    "isAccessibleForFree": true,
    "license": "https://opensource.org/licenses/MIT",
    "screenshot": [
      {
        "@type": "ImageObject",
        "url": "https://yongsk0066.github.io/qr-visualizer/og-image.png",
        "caption": t("QR Visualizer 메인 화면", "QR Visualizer main screen")
      }
    ],
    "featureList": [
      t("QR 코드 생성 과정 시각화", "QR code generation process visualization"),
      t("QR 코드 디코딩 과정 시각화", "QR code decoding process visualization"),
      t("Reed-Solomon 에러 정정", "Reed-Solomon error correction"),
      t("실시간 카메라 QR 코드 인식", "Real-time camera QR code recognition"),
      t("다국어 지원 (한국어/영어)", "Multi-language support (Korean/English)")
    ]
  };

  return (
    <script 
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}