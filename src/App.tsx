import { useMemo, useEffect, useDeferredValue } from 'react';
import './App.css';
import { SettingsColumn } from './components/SettingsColumn';
import { DataEncodingColumn } from './components/DataEncodingColumn';
import { ErrorCorrectionColumn } from './components/ErrorCorrectionColumn';
import { MessageConstructionColumn } from './components/MessageConstructionColumn';
import { ModulePlacementColumn } from './components/ModulePlacementColumn';
import { MaskingColumn } from './components/MaskingColumn';
import { FinalGenerationColumn } from './components/FinalGenerationColumn';
import { ProcessingWrapper } from './components/ProcessingWrapper';
import { runQRPipeline } from './qr/qrPipeline';
import { useQueryParams } from './shared';

function App() {
  const [{ data: inputData, version: qrVersion, error: errorLevel }, updateQueryParams] =
    useQueryParams();
  const deferredInputData = useDeferredValue(inputData);
  const deferredQrVersion = useDeferredValue(qrVersion);
  const deferredErrorLevel = useDeferredValue(errorLevel);
  const isProcessing = inputData !== deferredInputData || qrVersion !== deferredQrVersion || errorLevel !== deferredErrorLevel;

  const { dataAnalysis, dataEncoding, errorCorrection, messageConstruction, modulePlacement, finalGeneration } =
    useMemo(
      () => runQRPipeline({ inputData: deferredInputData, qrVersion: deferredQrVersion, errorLevel: deferredErrorLevel }),
      [deferredInputData, deferredQrVersion, deferredErrorLevel]
    );

  useEffect(() => {
    if (dataAnalysis?.isValid && dataAnalysis.minimumVersion) {
      const currentVersion = parseInt(deferredQrVersion, 10);
      if (currentVersion < dataAnalysis.minimumVersion) {
        updateQueryParams({ version: dataAnalysis.minimumVersion.toString() });
      }
    }
  }, [dataAnalysis, deferredQrVersion, updateQueryParams]);

  const stepColumns = [
    <DataEncodingColumn encodedData={dataEncoding} />,
    <ErrorCorrectionColumn errorCorrection={errorCorrection} />,
    <MessageConstructionColumn result={messageConstruction} />,
    <ModulePlacementColumn modulePlacement={modulePlacement} />,
    <MaskingColumn modulePlacement={modulePlacement} />,
    <FinalGenerationColumn finalGeneration={finalGeneration} />,
  ];

  return (
    <div className="app">
      <header className="mb-8">
        <h1 className="text-3xl font-light tracking-wide mb-1">QR Decompile</h1>
        <p className="text-gray-600 text-sm">QR 코드 생성 과정 학습</p>
      </header>

      <div className="steps-grid">
        <SettingsColumn
          inputData={inputData}
          setInputData={(data) => updateQueryParams({ data })}
          qrVersion={qrVersion}
          setQrVersion={(version) => updateQueryParams({ version })}
          errorLevel={errorLevel}
          setErrorLevel={(error) => updateQueryParams({ error })}
          dataAnalysis={dataAnalysis}
          isProcessing={isProcessing}
        />

        {stepColumns.map((column, index) => (
          <ProcessingWrapper key={index} isProcessing={isProcessing}>
            {column}
          </ProcessingWrapper>
        ))}
      </div>
    </div>
  );
}

export default App;
