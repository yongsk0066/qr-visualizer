import { useEffect, useRef, useState } from 'react';
import type { TriStateQR } from '../qr-decode/types';
import type { DecodePipelineResult } from '../qr-decode/decode/types';
import { runDecodePipeline } from '../qr-decode/decode/decodePipeline';
import { ProcessingWrapper } from './ProcessingWrapper';
import { FormatExtractionColumn } from './decode/FormatExtractionColumn';
import { VersionExtractionColumn } from './decode/VersionExtractionColumn';
import { MaskRemovalColumn } from './decode/MaskRemovalColumn';

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
      
      {/* TODO: 나머지 단계들 */}
      <div className="step-column">
        <h2 className="font-medium mb-3">다음 단계</h2>
        <div className="text-gray-500 text-sm">
          <div className="space-y-2">
            <div>• 4단계: 데이터 모듈 읽기</div>
            <div>• 5단계: 에러 정정</div>
            <div>• 6단계: 데이터 디코딩</div>
          </div>
          <div className="mt-4 p-2 bg-blue-50 rounded">
            <div className="text-blue-700 text-xs">구현 진행 중...</div>
          </div>
        </div>
      </div>
    </div>
  );
}