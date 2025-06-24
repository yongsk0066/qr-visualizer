import { useState } from 'react';
import './App.css';
import { QRDetectProcess } from './components/QRDetectProcess';
import { QREncodingProcess } from './components/QREncodingProcess';
import { QRDecodeProcess } from './components/QRDecodeProcess';
import { LanguageSelector } from './components/LanguageSelector';
import type { TriStateQR } from './qr-decode/types';
import mascot from './assets/mascot.gif';
import { t } from './i18n';

function App() {
  const [encodedQRMatrix, setEncodedQRMatrix] = useState<number[][] | null>(null);
  const [triStateMatrix, setTriStateMatrix] = useState<TriStateQR | null>(null);

  return (
    <div className="app">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src={mascot}
            alt={t('app.mascotAlt')}
            className="w-16 h-16 object-contain"
            title={t('app.mascotTitle')}
          />
          <div>
            <h1 className="text-3xl font-light tracking-wide mb-1">QR Visualizer</h1>
            <p className="text-gray-600 text-sm">
              {t('app.subtitle')}
            </p>
          </div>
        </div>
        <LanguageSelector />
      </header>

      <div className="flex flex-col gap-12">
        <section>
          <h2 className="text-xl font-light mb-4">Encoding Process</h2>
          <QREncodingProcess onQRGenerated={setEncodedQRMatrix} />
        </section>

        <section>
          <h2 className="text-xl font-light mb-4">Detection Process</h2>
          <QRDetectProcess 
            encodedQRMatrix={encodedQRMatrix}
            onTriStateMatrixGenerated={setTriStateMatrix}
          />
        </section>

        <section>
          <h2 className="text-xl font-light mb-4">Decode Process</h2>
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
  );
}

export default App;
