import { useDeferredValue, useEffect } from 'react';
import { DataEncodingColumn } from './encode/DataEncodingColumn';
import { ErrorCorrectionColumn } from './encode/ErrorCorrectionColumn';
import { FinalGenerationColumn } from './encode/FinalGenerationColumn';
import { MaskingColumn } from './encode/MaskingColumn';
import { MessageConstructionColumn } from './encode/MessageConstructionColumn';
import { ModulePlacementColumn } from './encode/ModulePlacementColumn';
import { ProcessingWrapper } from './ProcessingWrapper';
import { SettingsColumn } from './encode/SettingsColumn';
import { runQRPipeline } from '../qr-encode/qrPipeline';
import { useQueryParams } from '../shared';

export function QREncodingProcess() {
  const [{ data: inputData, version: qrVersion, error: errorLevel }, updateQueryParams] =
    useQueryParams();
  const deferredInputData = useDeferredValue(inputData);
  const deferredQrVersion = useDeferredValue(qrVersion);
  const deferredErrorLevel = useDeferredValue(errorLevel);

  const isProcessing =
    inputData !== deferredInputData ||
    qrVersion !== deferredQrVersion ||
    errorLevel !== deferredErrorLevel;

  const {
    dataAnalysis,
    dataEncoding,
    errorCorrection,
    messageConstruction,
    modulePlacement,
    finalGeneration,
  } = runQRPipeline({
    inputData: deferredInputData,
    qrVersion: deferredQrVersion,
    errorLevel: deferredErrorLevel,
  });

  useEffect(() => {
    if (dataAnalysis?.isValid && dataAnalysis.minimumVersion) {
      const currentVersion = parseInt(deferredQrVersion, 10);
      if (currentVersion < dataAnalysis.minimumVersion) {
        updateQueryParams({ version: dataAnalysis.minimumVersion.toString() });
      }
    }
  }, [dataAnalysis, deferredQrVersion, updateQueryParams]);

  return (
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

      <ProcessingWrapper isProcessing={isProcessing}>
        <DataEncodingColumn encodedData={dataEncoding} />
      </ProcessingWrapper>

      <ProcessingWrapper isProcessing={isProcessing}>
        <ErrorCorrectionColumn errorCorrection={errorCorrection} />
      </ProcessingWrapper>

      <ProcessingWrapper isProcessing={isProcessing}>
        <MessageConstructionColumn result={messageConstruction} />
      </ProcessingWrapper>

      <ProcessingWrapper isProcessing={isProcessing}>
        <ModulePlacementColumn modulePlacement={modulePlacement} />
      </ProcessingWrapper>

      <ProcessingWrapper isProcessing={isProcessing}>
        <MaskingColumn modulePlacement={modulePlacement} />
      </ProcessingWrapper>

      <ProcessingWrapper isProcessing={isProcessing}>
        <FinalGenerationColumn finalGeneration={finalGeneration} />
      </ProcessingWrapper>
    </div>
  );
}