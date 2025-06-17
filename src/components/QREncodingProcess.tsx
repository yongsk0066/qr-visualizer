import { useDeferredValue, useEffect } from 'react';
import { DataEncodingColumn } from './DataEncodingColumn';
import { ErrorCorrectionColumn } from './ErrorCorrectionColumn';
import { FinalGenerationColumn } from './FinalGenerationColumn';
import { MaskingColumn } from './MaskingColumn';
import { MessageConstructionColumn } from './MessageConstructionColumn';
import { ModulePlacementColumn } from './ModulePlacementColumn';
import { ProcessingWrapper } from './ProcessingWrapper';
import { SettingsColumn } from './SettingsColumn';
import { runQRPipeline } from '../qr/qrPipeline';
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