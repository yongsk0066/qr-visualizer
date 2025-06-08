import { QRViewer } from '../QRViewer';

interface QRCodeColumnProps {
  matrix: number[][];
  size?: number;
}

export function QRCodeColumn({ matrix, size = 240 }: QRCodeColumnProps) {
  return (
    <div className="step-column">
      <h2 className="font-medium mb-4">4단계: QR 코드</h2>
      <QRViewer matrix={matrix} size={size} />
    </div>
  );
}