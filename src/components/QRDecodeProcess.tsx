import { useEffect, useRef, useState } from 'react';
import type { TriStateQR } from '../qr-decode/types';
import type { DecodePipelineResult } from '../qr-decode/decode/types';
import { runDecodePipeline } from '../qr-decode/decode/decodePipeline';
import { ProcessingWrapper } from './ProcessingWrapper';
import { FormatExtractionColumn } from './decode/FormatExtractionColumn';
import { VersionExtractionColumn } from './decode/VersionExtractionColumn';
import { MaskRemovalColumn } from './decode/MaskRemovalColumn';
import { DataReadingColumn } from './decode/DataReadingColumn';
import { ErrorCorrectionColumn } from './decode/ErrorCorrectionColumn';
import { DataExtractionColumn } from './decode/DataExtractionColumn';

interface QRDecodeProcessProps {
  triStateMatrix: TriStateQR | null;
}

export function QRDecodeProcess({ triStateMatrix }: QRDecodeProcessProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [decodeResult, setDecodeResult] = useState<DecodePipelineResult | null>(null);
  const processingRef = useRef(false);
  
  useEffect(() => {
    const processDecoding = async () => {
      if (!triStateMatrix || processingRef.current) return;
      
      processingRef.current = true;
      setIsProcessing(true);
      
      try {
        const result = await runDecodePipeline(triStateMatrix);
        setDecodeResult(result);
      } catch (error) {
        console.error('Decode error:', error);
      } finally {
        setIsProcessing(false);
        processingRef.current = false;
      }
    };
    
    processDecoding();
  }, [triStateMatrix]);
  
  return (
    <div className="steps-grid">
      <ProcessingWrapper isProcessing={isProcessing}>
        <FormatExtractionColumn 
          formatInfo={decodeResult?.formatInfo ?? null}
          triStateMatrix={triStateMatrix}
        />
      </ProcessingWrapper>
      
      <ProcessingWrapper isProcessing={isProcessing}>
        <VersionExtractionColumn 
          versionInfo={decodeResult?.versionInfo ?? null}
          triStateMatrix={triStateMatrix}
        />
      </ProcessingWrapper>
      
      <ProcessingWrapper isProcessing={isProcessing}>
        <MaskRemovalColumn 
          maskRemovalResult={decodeResult?.maskRemoval ?? null}
          triStateMatrix={triStateMatrix}
        />
      </ProcessingWrapper>
      
      <ProcessingWrapper isProcessing={isProcessing}>
        <DataReadingColumn 
          dataReadingResult={decodeResult?.dataReading ?? null}
          unmaskedMatrix={decodeResult?.maskRemoval?.unmaskedMatrix ?? null}
          dataModules={decodeResult?.maskRemoval?.dataModules ?? null}
        />
      </ProcessingWrapper>
      
      <ProcessingWrapper isProcessing={isProcessing}>
        <ErrorCorrectionColumn 
          errorCorrectionResult={decodeResult?.errorCorrection ?? null}
          codewords={decodeResult?.dataReading?.codewords ?? null}
        />
      </ProcessingWrapper>
      
      <ProcessingWrapper isProcessing={isProcessing}>
        <DataExtractionColumn 
          dataExtractionResult={decodeResult?.dataExtraction ?? null}
          correctedDataCodewords={decodeResult?.errorCorrection?.correctedDataCodewords ?? null}
          errorCorrectionFailed={decodeResult?.errorCorrection ? !decodeResult.errorCorrection.isRecoverable : false}
        />
      </ProcessingWrapper>
    </div>
  );
}