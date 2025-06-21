import { useState } from 'react';
import './App.css';
import { QREncodingProcess } from './components/QREncodingProcess';
import { QRDetectProcess } from './components/QRDetectProcess';

function App() {
  const [encodedQRMatrix, setEncodedQRMatrix] = useState<number[][] | null>(null);
  console.log(encodedQRMatrix);
  return (
    <div className="app">
      <header className="mb-8">
        <h1 className="text-3xl font-light tracking-wide mb-1">QR Visualizer</h1>
        <p className="text-gray-600 text-sm">QR 코드 생성 과정 학습</p>
      </header>

      <div className="flex flex-col gap-12">
        <section>
          <h2 className="text-xl font-light mb-4">Encoding Process</h2>
          <QREncodingProcess onQRGenerated={setEncodedQRMatrix} />
        </section>

        <section>
          <h2 className="text-xl font-light mb-4">Detection Process</h2>
          <QRDetectProcess encodedQRMatrix={encodedQRMatrix} />
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
