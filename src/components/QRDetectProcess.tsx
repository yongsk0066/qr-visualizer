import { useEffect, useState } from 'react';
import testImage from '../assets/test_image.jpg';
import { runDetectPipeline } from '../qr-decode/detect/detectPipeline';
import { ProcessingWrapper } from './ProcessingWrapper';
import { BinarizationColumn } from './detect/BinarizationColumn';
import { GrayscaleColumn } from './detect/GrayscaleColumn';
import { ImageInputColumn } from './detect/ImageInputColumn';

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
    </div>
  );
}
