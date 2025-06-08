import { useState, useMemo } from 'react';
import './App.css';
import { SettingsColumn } from './components/SettingsColumn';
import { DataEncodingColumn } from './components/DataEncodingColumn';
import { QRCodeColumn } from './components/QRCodeColumn';
import { runQRPipeline } from './qr/qrPipeline';
import type { ErrorCorrectionLevel } from './qr/types';

function App() {
  const [inputData, setInputData] = useState('');
  const [qrVersion, setQrVersion] = useState('1');
  const [errorLevel, setErrorLevel] = useState<ErrorCorrectionLevel>('M');

  // QR 생성 파이프라인 실행
  const qrPipeline = useMemo(() => 
    runQRPipeline({ inputData, qrVersion, errorLevel }),
    [inputData, qrVersion, errorLevel]
  );

  // 각 단계별 결과 추출
  const { dataAnalysis, dataEncoding, qrGeneration } = qrPipeline;
  const encodedData = dataEncoding;
  const sampleMatrix = qrGeneration;

  return (
    <div className="app">
      <header className="mb-8">
        <h1 className="text-3xl font-light tracking-wide mb-1">QR Decompile</h1>
        <p className="text-gray-600 text-sm">QR 코드 생성 과정 학습</p>
      </header>

      <div className="steps-grid">
        <SettingsColumn
          inputData={inputData}
          setInputData={setInputData}
          qrVersion={qrVersion}
          setQrVersion={setQrVersion}
          errorLevel={errorLevel}
          setErrorLevel={setErrorLevel}
          dataAnalysis={dataAnalysis}
        />

        <DataEncodingColumn encodedData={encodedData} />

        <QRCodeColumn matrix={sampleMatrix} size={240} />
      </div>
    </div>
  );
}

export default App;
