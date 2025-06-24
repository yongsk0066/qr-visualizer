import { BitStreamViewer } from './BitStreamViewer';
import type { EncodedData } from '../../qr-encode/encoding/dataEncoding';
import { t } from '../../i18n';

interface DataEncodingColumnProps {
  encodedData: EncodedData | null;
}

export function DataEncodingColumn({ encodedData }: DataEncodingColumnProps) {
  return (
    <div className="step-column">
      <h2 className="font-medium mb-3">{t('steps.encode.dataEncoding')}</h2>
      <BitStreamViewer encodedData={encodedData} />
    </div>
  );
}