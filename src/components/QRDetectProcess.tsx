import { useEffect, useRef, useState } from 'react';
import { runDetectPipeline } from '../qr-decode/detect/detectPipeline';
import type { HomographyResult, TriStateQR } from '../qr-decode/types';
import { ProcessingWrapper } from './ProcessingWrapper';
import { BinarizationColumn } from './detect/BinarizationColumn';
import { FinderDetectionColumn } from './detect/FinderDetectionColumn';
import { GrayscaleColumn } from './detect/GrayscaleColumn';
import { ImageInputColumn } from './detect/ImageInputColumn';
import { RefinedHomographyColumn } from './detect/RefinedHomographyColumn';
import { SamplingColumn } from './detect/SamplingColumn';

interface QRDetectProcessProps {
  encodedQRMatrix?: number[][] | null;
  onTriStateMatrixGenerated?: (triStateMatrix: TriStateQR | null) => void;
}

export function QRDetectProcess({ encodedQRMatrix, onTriStateMatrixGenerated }: QRDetectProcessProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof runDetectPipeline>> | null>(null);
  const [refinedHomography, setRefinedHomography] = useState<HomographyResult | null>(null);
  const [refinedImage, setRefinedImage] = useState<ImageData | null>(null);
  const processingRef = useRef(false);
  const lastProcessedUrlRef = useRef<string>('');

  useEffect(() => {
    const processImage = async () => {
      if (!imageUrl) return;

      // 이미 처리 중이거나 같은 이미지를 다시 처리하려는 경우 스킵
      if (processingRef.current) {
        return;
      }

      if (imageUrl === lastProcessedUrlRef.current) {
        return;
      }

      processingRef.current = true;
      setIsProcessing(true);

      try {
        const pipelineResult = await runDetectPipeline({ imageUrl });
        setResult(pipelineResult);
        lastProcessedUrlRef.current = imageUrl;
        
        // 초기 샘플링 결과 설정
        if (pipelineResult.sampling) {
          setFinalSampling(pipelineResult.sampling);
        }
      } catch {
        // Error handling intentionally left empty
      } finally {
        setIsProcessing(false);
        processingRef.current = false;
      }
    };

    // 카메라 모드인 경우 (data URL) 디바운싱 적용
    if (imageUrl.startsWith('data:')) {
      const timer = setTimeout(processImage, 100); // 100ms 디바운스
      return () => clearTimeout(timer);
    } else {
      // 파일 업로드인 경우 즉시 처리
      processImage();
    }
  }, [imageUrl]);

  // 최종 sampling 결과 추적
  const [finalSampling, setFinalSampling] = useState<TriStateQR | null>(null);

  // tri-state matrix가 생성되면 상위 컴포넌트로 전달
  useEffect(() => {
    if (onTriStateMatrixGenerated && finalSampling) {
      onTriStateMatrixGenerated(finalSampling);
    }
  }, [finalSampling, onTriStateMatrixGenerated]);

  return (
    <div className="steps-grid">
      <ImageInputColumn
        imageUrl={imageUrl}
        setImageUrl={setImageUrl}
        imageProcessing={result?.imageProcessing ?? null}
        isProcessing={isProcessing}
        encodedQRMatrix={encodedQRMatrix}
      />

      <ProcessingWrapper isProcessing={isProcessing}>
        <GrayscaleColumn grayscale={result?.grayscale ?? null} />
      </ProcessingWrapper>

      <ProcessingWrapper isProcessing={isProcessing}>
        <BinarizationColumn binarization={result?.binarization ?? null} />
      </ProcessingWrapper>

      <ProcessingWrapper isProcessing={isProcessing}>
        <FinderDetectionColumn finderDetection={result?.finderDetection ?? null} />
      </ProcessingWrapper>

      <ProcessingWrapper isProcessing={isProcessing}>
        <RefinedHomographyColumn
          homography={result?.homography ?? null}
          homographyImage={result?.homographyImage ?? null}
          onRefinedHomography={(homography, image) => {
            setRefinedHomography(homography);
            setRefinedImage(image);
          }}
        />
      </ProcessingWrapper>

      <ProcessingWrapper isProcessing={isProcessing}>
        <SamplingColumn
          sampling={result?.sampling ?? null}
          homography={refinedHomography || (result?.homography ?? null)}
          homographyImage={refinedImage || (result?.homographyImage ?? null)}
          onSamplingComplete={setFinalSampling}
        />
      </ProcessingWrapper>
    </div>
  );
}
