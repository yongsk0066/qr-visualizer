import { BitStreamViewer } from './BitStreamViewer';
import type { EncodedData } from '../../qr-encode/encoding/dataEncoding';

interface DataEncodingColumnProps {
  encodedData: EncodedData | null;
}

export function DataEncodingColumn({ encodedData }: DataEncodingColumnProps) {
  return (
    <div className="step-column">
      <h2 className="font-medium mb-3">2단계: 데이터 부호화</h2>
      <BitStreamViewer encodedData={encodedData} />
    </div>
  );
}