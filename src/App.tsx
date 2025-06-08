import { useState, useMemo, useEffect, useDeferredValue } from 'react';
import './App.css';
import { SettingsColumn } from './components/SettingsColumn';
import { DataEncodingColumn } from './components/DataEncodingColumn';
import { ErrorCorrectionColumn } from './components/ErrorCorrectionColumn';
import { MessageConstructionColumn } from './components/MessageConstructionColumn';
import { QRCodeColumn } from './components/QRCodeColumn';
import { runQRPipeline } from './qr/qrPipeline';
import type { ErrorCorrectionLevel } from './shared/types';

function App() {
  const [inputData, setInputData] = useState('');
  const [qrVersion, setQrVersion] = useState('1');
  const [errorLevel, setErrorLevel] = useState<ErrorCorrectionLevel>('M');

  // 입력 데이터에 대해 지연된 값 사용 (타이핑 시 렌더링 부하 감소)
  const deferredInputData = useDeferredValue(inputData);

  // QR 생성 파이프라인 실행 (지연된 입력 데이터 사용)
  const qrPipeline = useMemo(() => 
    runQRPipeline({ inputData: deferredInputData, qrVersion, errorLevel }),
    [deferredInputData, qrVersion, errorLevel]
  );

  // 각 단계별 결과 추출
  const { dataAnalysis, dataEncoding, errorCorrection, messageConstruction, qrGeneration } = qrPipeline;
  const encodedData = dataEncoding;
  const sampleMatrix = qrGeneration;

  // 입력이 처리 중인지 확인 (실제 입력과 지연된 입력이 다를 때)
  const isProcessing = inputData !== deferredInputData;

  // 최소 버전 자동 업데이트
  useEffect(() => {
    if (dataAnalysis?.isValid && dataAnalysis.minimumVersion) {
      const currentVersion = parseInt(qrVersion, 10);
      const minimumVersion = dataAnalysis.minimumVersion;
      
      // 현재 버전이 최소 요구 버전보다 낮으면 자동 업데이트
      if (currentVersion < minimumVersion) {
        setQrVersion(minimumVersion.toString());
      }
    }
  }, [dataAnalysis, qrVersion]);

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
          isProcessing={isProcessing}
        />

        <div style={{ 
          opacity: isProcessing ? 0.6 : 1,
          transition: isProcessing ? 'opacity 0.2s 0.1s ease-out' : 'opacity 0s 0s ease-out'
        }}>
          <DataEncodingColumn encodedData={encodedData} />
        </div>

        <div style={{ 
          opacity: isProcessing ? 0.6 : 1,
          transition: isProcessing ? 'opacity 0.2s 0.1s ease-out' : 'opacity 0s 0s ease-out'
        }}>
          <ErrorCorrectionColumn errorCorrection={errorCorrection} />
        </div>

        <div style={{ 
          opacity: isProcessing ? 0.6 : 1,
          transition: isProcessing ? 'opacity 0.2s 0.1s ease-out' : 'opacity 0s 0s ease-out'
        }}>
          <MessageConstructionColumn result={messageConstruction} />
        </div>

        <div style={{ 
          opacity: isProcessing ? 0.6 : 1,
          transition: isProcessing ? 'opacity 0.2s 0.1s ease-out' : 'opacity 0s 0s ease-out'
        }}>
          <QRCodeColumn matrix={sampleMatrix} size={240} />
        </div>
      </div>
    </div>
  );
}

export default App;
