import { useState, useMemo, useEffect, useDeferredValue } from 'react';
import './App.css';
import { SettingsColumn } from './components/SettingsColumn';
import { DataEncodingColumn } from './components/DataEncodingColumn';
import { ErrorCorrectionColumn } from './components/ErrorCorrectionColumn';
import { MessageConstructionColumn } from './components/MessageConstructionColumn';
import { ModulePlacementColumn } from './components/ModulePlacementColumn';
import { MaskingColumn } from './components/MaskingColumn';
import { runQRPipeline } from './qr/qrPipeline';
import type { ErrorCorrectionLevel } from './shared/types';

function App() {
  const [inputData, setInputData] = useState('');
  const [qrVersion, setQrVersion] = useState('1');
  const [errorLevel, setErrorLevel] = useState<ErrorCorrectionLevel>('M');

  const deferredInputData = useDeferredValue(inputData);

  const qrPipeline = useMemo(() => 
    runQRPipeline({ inputData: deferredInputData, qrVersion, errorLevel }),
    [deferredInputData, qrVersion, errorLevel]
  );

  const { dataAnalysis, dataEncoding, errorCorrection, messageConstruction, modulePlacement } = qrPipeline;
  const encodedData = dataEncoding;

  const isProcessing = inputData !== deferredInputData;

  // 최소 버전 자동 업데이트
  useEffect(() => {
    if (dataAnalysis?.isValid && dataAnalysis.minimumVersion) {
      const currentVersion = parseInt(qrVersion, 10);
      const minimumVersion = dataAnalysis.minimumVersion;
      
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
          <ModulePlacementColumn modulePlacement={modulePlacement} isProcessing={isProcessing} />
        </div>

        <div style={{ 
          opacity: isProcessing ? 0.6 : 1,
          transition: isProcessing ? 'opacity 0.2s 0.1s ease-out' : 'opacity 0s 0s ease-out'
        }}>
          <MaskingColumn modulePlacement={modulePlacement} isProcessing={isProcessing} />
        </div>
      </div>
    </div>
  );
}

export default App;
