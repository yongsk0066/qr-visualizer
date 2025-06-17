import { useRef } from 'react';
import type { ImageProcessingResult } from '../../qr-decode/types';

interface ImageInputColumnProps {
  imageUrl: string;
  setImageUrl: (url: string) => void;
  imageProcessing: ImageProcessingResult | null;
  isProcessing: boolean;
}

export function ImageInputColumn({ 
  imageUrl, 
  setImageUrl, 
  imageProcessing,
  isProcessing 
}: ImageInputColumnProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === 'string') {
          setImageUrl(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === 'string') {
          setImageUrl(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <div className="step-column">
      <h3 className="step-title">Step 1: Image Input</h3>
      
      <div className="mb-4">
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <p className="text-gray-600 text-sm">
            클릭하거나 이미지를 드래그하여 업로드
          </p>
        </div>
      </div>

      {imageUrl && (
        <div className="space-y-3">
          <div className="bg-gray-50 p-3 rounded">
            <img 
              src={imageUrl} 
              alt="Input QR Code" 
              className="w-full h-auto rounded"
            />
          </div>
          
          {imageProcessing && (
            <div className="text-xs space-y-1">
              <p>크기: {imageProcessing.width} × {imageProcessing.height}px</p>
              <p>상태: {isProcessing ? '처리 중...' : '처리 완료'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}