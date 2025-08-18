import { useState } from 'react';
import './App.css';
import { QRDetectProcess } from './components/QRDetectProcess';
import { QREncodingProcess } from './components/QREncodingProcess';
import { QRDecodeProcess } from './components/QRDecodeProcess';
import { SEOMetadata } from './components/SEOMetadata';
import type { TriStateQR } from './qr-decode/types';
import { t, LANG } from './config/language';
import mascot from './assets/mascot.gif';

function App() {
  const [encodedQRMatrix, setEncodedQRMatrix] = useState<number[][] | null>(null);
  const [triStateMatrix, setTriStateMatrix] = useState<TriStateQR | null>(null);

  // Dynamic SEO metadata based on language
  const siteUrl = 'https://yongsk0066.github.io/qr-visualizer';
  const currentUrl = `${siteUrl}/${LANG}`;

  return (
    <>
      {/* Dynamic Document Metadata - React 19 feature */}
      <title>{t('QR Visualizer - QR 코드의 작동 원리를 시각적으로 설명', 'QR Visualizer - Visual Explanation of How QR Codes Work')}</title>
      <meta name="description" content={t(
        'QR 코드가 데이터를 저장하고 읽는 과정을 단계별로 시각화합니다. 인코딩부터 디코딩까지 전체 프로세스를 인터랙티브하게 탐색하세요.',
        'Visualize step-by-step how QR codes store and read data. Interactively explore the entire process from encoding to decoding.'
      )} />
      <meta name="keywords" content={t(
        'QR코드, QR Code, 바코드, 시각화, Reed-Solomon, 에러정정, ISO/IEC 18004, 인코딩, 디코딩',
        'QR code, barcode, visualization, Reed-Solomon, error correction, ISO/IEC 18004, encoding, decoding'
      )} />
      
      {/* Open Graph */}
      <meta property="og:title" content={t(
        'QR Visualizer - QR 코드의 작동 원리를 시각적으로 설명',
        'QR Visualizer - Visual Explanation of How QR Codes Work'
      )} />
      <meta property="og:description" content={t(
        'QR 코드가 데이터를 저장하고 읽는 과정을 단계별로 시각화합니다. 인코딩부터 디코딩까지 전체 프로세스를 인터랙티브하게 탐색하세요.',
        'Visualize step-by-step how QR codes store and read data. Interactively explore the entire process from encoding to decoding.'
      )} />
      <meta property="og:locale" content={LANG === 'ko' ? 'ko_KR' : 'en_US'} />
      <meta property="og:url" content={currentUrl} />
      
      {/* Twitter Card */}
      <meta property="twitter:title" content={t(
        'QR Visualizer - QR 코드의 작동 원리를 시각적으로 설명',
        'QR Visualizer - Visual Explanation of How QR Codes Work'
      )} />
      <meta property="twitter:description" content={t(
        'QR 코드가 데이터를 저장하고 읽는 과정을 단계별로 시각화합니다.',
        'Visualize how QR codes store and read data step by step.'
      )} />
      
      {/* Language and Canonical */}
      <meta name="language" content={LANG === 'ko' ? 'Korean' : 'English'} />
      <link rel="canonical" href={currentUrl} />
      
      {/* Alternate languages */}
      <link rel="alternate" hrefLang="ko" href={`${siteUrl}/ko`} />
      <link rel="alternate" hrefLang="en" href={`${siteUrl}/en`} />
      <link rel="alternate" hrefLang="x-default" href={siteUrl} />
      
      {/* Structured Data */}
      <SEOMetadata />

      <div className="app">
      <header className="mb-8 flex items-center gap-4">
        <img 
          src={mascot} 
          alt={t("QR Visualizer 마스코트", "QR Visualizer Mascot")} 
          className="w-16 h-16 object-contain"
          title={t("안녕하세요! QR 코드를 함께 배워봐요 👋", "Hello! Let's learn QR codes together 👋")}
        />
        <div>
          <h1 className="text-3xl font-light tracking-wide mb-1">QR Visualizer</h1>
          <p className="text-gray-600 text-sm">{t("QR 코드 생성 과정 학습", "Learning QR Code Generation Process")}</p>
        </div>
      </header>

      <div className="flex flex-col gap-12">
        <section>
          <h2 className="text-xl font-light mb-4">{t("Encoding Process", "Encoding Process")}</h2>
          <QREncodingProcess onQRGenerated={setEncodedQRMatrix} />
        </section>

        <section>
          <h2 className="text-xl font-light mb-4">{t("Detection Process", "Detection Process")}</h2>
          <QRDetectProcess 
            encodedQRMatrix={encodedQRMatrix}
            onTriStateMatrixGenerated={setTriStateMatrix}
          />
        </section>

        <section>
          <h2 className="text-xl font-light mb-4">{t("Decode Process", "Decode Process")}</h2>
          <QRDecodeProcess triStateMatrix={triStateMatrix} />
        </section>
      </div>

      <footer className="mt-8 text-center text-gray-500 text-xs">
        <p>QR Code is a registered trademark of DENSO WAVE INCORPORATED.</p>
        <p className="mt-2">
          Created by{' '}
          <a
            href="https://github.com/yongsk0066"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600"
          >
            yongsk0066
          </a>
        </p>
      </footer>
    </div>
    </>
  );
}

export default App;
