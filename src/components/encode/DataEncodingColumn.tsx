import { BitStreamViewer } from './BitStreamViewer';
import type { EncodedData } from '../../qr-encode/encoding/dataEncoding';
import { t } from '@/config/language';

interface DataEncodingColumnProps {
  encodedData: EncodedData | null;
}

export function DataEncodingColumn({ encodedData }: DataEncodingColumnProps) {
  return (
    <div className="step-column">
      <h2 className="font-medium mb-3">{t('2단계: 데이터 부호화', 'Step 2: Data Encoding')}</h2>
      <BitStreamViewer encodedData={encodedData} />
    </div>
  );
}