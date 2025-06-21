import { useEffect, useState, useRef } from 'react';
import testImage from '../assets/test_image_2.jpg';
import { runDetectPipeline } from '../qr-decode/detect/detectPipeline';
import type { HomographyResult } from '../qr-decode/types';
import { ProcessingWrapper } from './ProcessingWrapper';
import { BinarizationColumn } from './detect/BinarizationColumn';
import { FinderDetectionColumn } from './detect/FinderDetectionColumn';
import { GrayscaleColumn } from './detect/GrayscaleColumn';
import { HomographyColumn } from './detect/HomographyColumn';
import { ImageInputColumn } from './detect/ImageInputColumn';
import { RefinedHomographyColumn } from './detect/RefinedHomographyColumn';
import { SamplingColumn } from './detect/SamplingColumn';

export function QRDetectProcess() {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof runDetectPipeline>> | null>(null);
  const [refinedHomography, setRefinedHomography] = useState<HomographyResult | null>(null);
  const processingRef = useRef(false);
  const lastProcessedUrlRef = useRef<string>('');

  // 초기 테스트 이미지 로드
  useEffect(() => {
    setImageUrl(testImage);
  }, []);

  useEffect(() => {
    const processImage = async () => {
      if (!imageUrl) return;

      // 이미 처리 중이거나 같은 이미지를 다시 처리하려는 경우 스킵
      if (processingRef.current) {
        console.log('Skipping: already processing');
        return;
      }

      if (imageUrl === lastProcessedUrlRef.current) {
        console.log('Skipping: same image');
        return;
      }

      console.log('Starting detection pipeline...');
      processingRef.current = true;
      setIsProcessing(true);

      try {
        const pipelineResult = await runDetectPipeline({ imageUrl });
        console.log('Pipeline result:', pipelineResult);
        setResult(pipelineResult);
        lastProcessedUrlRef.current = imageUrl;
      } catch (error) {
        console.error('Detection error:', error);
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

  return (
    <div className="steps-grid">
      <ImageInputColumn
        imageUrl={imageUrl}
        setImageUrl={setImageUrl}
        imageProcessing={result?.imageProcessing ?? null}
        isProcessing={isProcessing}
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

      <div style={{ display: 'none' }}>
        <ProcessingWrapper isProcessing={isProcessing}>
          <HomographyColumn
            homography={result?.homography ?? null}
            binarization={result?.binarization ?? null}
            finderDetection={result?.finderDetection ?? null}
          />
        </ProcessingWrapper>
      </div>

      <ProcessingWrapper isProcessing={isProcessing}>
        <RefinedHomographyColumn
          homography={result?.homography ?? null}
          homographyImage={result?.homographyImage ?? null}
          onRefinedHomography={setRefinedHomography}
        />
      </ProcessingWrapper>

      <ProcessingWrapper isProcessing={isProcessing}>
        <SamplingColumn
          sampling={result?.sampling ?? null}
          homography={refinedHomography || (result?.homography ?? null)}
          homographyImage={result?.homographyImage ?? null}
        />
      </ProcessingWrapper>
    </div>
  );
}
