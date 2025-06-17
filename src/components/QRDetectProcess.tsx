import { useState, useEffect } from 'react';
import { ProcessingWrapper } from './ProcessingWrapper';
import { ImageInputColumn } from './detect/ImageInputColumn';
import { GrayscaleColumn } from './detect/GrayscaleColumn';
import { BinarizationColumn } from './detect/BinarizationColumn';
import { FinderDetectionColumn } from './detect/FinderDetectionColumn';
import { runDetectPipeline } from '../qr-decode/detect/detectPipeline';
import testImage from '../assets/test_image.jpg';

export function QRDetectProcess() {
  const [imageUrl, setImageUrl] = useState<string>(testImage);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof runDetectPipeline>> | null>(null);

  useEffect(() => {
    const processImage = async () => {
      if (!imageUrl) return;
      
      setIsProcessing(true);
      try {
        const pipelineResult = await runDetectPipeline({ imageUrl });
        setResult(pipelineResult);
      } catch (error) {
        console.error('Detection error:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    processImage();
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
        <FinderDetectionColumn 
          binarization={result?.binarization ?? null} 
          finderDetection={result?.finderDetection ?? null} 
        />
      </ProcessingWrapper>

      <div className="step-column">
        <h3 className="step-title">Step 5: Homography</h3>
        <p className="text-gray-500 text-sm">Coming soon...</p>
      </div>

      <div className="step-column">
        <h3 className="step-title">Step 6: Sampling</h3>
        <p className="text-gray-500 text-sm">Coming soon...</p>
      </div>

      <div className="step-column">
        <h3 className="step-title">Step 7: Matrix Output</h3>
        <p className="text-gray-500 text-sm">Coming soon...</p>
      </div>
    </div>
  );
}