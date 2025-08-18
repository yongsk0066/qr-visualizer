import { useRef } from 'react';
import { t } from '../../../config/language';
import testImage from '../../../assets/test_image/test_image.jpg';

interface FileInputProps {
  onImageSelect: (url: string) => void;
}

export function FileInput({ onImageSelect }: FileInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === 'string') {
          onImageSelect(e.target.result);
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
          onImageSelect(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleTestImageSelect = (imageUrl: string) => {
    onImageSelect(imageUrl);
  };

  return (
    <div className="space-y-3">
      <div className="p-3 bg-gray-50 rounded">
        <div className="text-xs font-medium mb-2">{t('파일 선택', 'File Selection')}</div>
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
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
          <div className="space-y-2">
            <div className="text-3xl text-gray-400">📁</div>
            <p className="text-gray-600 text-sm font-medium">
              {t('클릭하거나 이미지를 드래그하여 업로드', 'Click or drag image to upload')}
            </p>
            <p className="text-gray-500 text-xs">
              {t('PNG, JPG, JPEG, GIF 등 이미지 파일 지원', 'Supports PNG, JPG, JPEG, GIF image files')}
            </p>
          </div>
        </div>
      </div>

      <div className="p-3 bg-gray-50 rounded">
        <button
          onClick={() => handleTestImageSelect(testImage)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-all text-sm"
        >
          <span>🧪</span>
          <span>{t('테스트 이미지 사용', 'Use Test Image')}</span>
        </button>
      </div>
    </div>
  );
}