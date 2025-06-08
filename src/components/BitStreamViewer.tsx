import type { EncodedData } from '../qr/dataEncoding';

interface BitStreamViewerProps {
  encodedData: EncodedData | null;
}

interface BitSegment {
  label: string;
  bits: string;
  color: string;
}

export function BitStreamViewer({ encodedData }: BitStreamViewerProps) {
  if (!encodedData) {
    return <div className="text-gray-500 text-sm">데이터를 입력하면 비트 스트림이 표시됩니다</div>;
  }

  const segments: BitSegment[] = [
    {
      label: '모드 지시자',
      bits: encodedData.modeIndicator,
      color: 'bg-gray-100',
    },
    {
      label: '문자 카운트',
      bits: encodedData.characterCount,
      color: 'bg-gray-50',
    },
    {
      label: '데이터',
      bits: encodedData.data,
      color: 'bg-gray-100',
    },
  ];

  // 종단자와 패딩 찾기
  const dataEndIndex =
    encodedData.modeIndicator.length + encodedData.characterCount.length + encodedData.data.length;

  const remainder = encodedData.bitStream.slice(dataEndIndex);

  // 종단자 감지 (최대 4비트의 0000)
  let terminatorLength = 0;
  for (let i = 0; i < Math.min(4, remainder.length); i++) {
    if (remainder[i] === '0') {
      terminatorLength++;
    } else {
      break;
    }
  }

  if (terminatorLength > 0) {
    segments.push({
      label: '종단자',
      bits: remainder.slice(0, terminatorLength),
      color: 'bg-gray-50',
    });
  }

  // 나머지는 패딩
  const paddingStart = terminatorLength;
  if (paddingStart < remainder.length) {
    segments.push({
      label: '패딩',
      bits: remainder.slice(paddingStart),
      color: 'bg-gray-100',
    });
  }

  const formatBitGroups = (bits: string) => {
    return bits.match(/.{1,8}/g)?.join(' ') || bits;
  };

  return (
    <div className="space-y-3">
      {/* 세그먼트별 상세 정보 */}
      <div className="space-y-2">
        {segments.map((segment, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className={`px-1 py-0.5 ${segment.color} text-xs`}>{segment.label}</span>
              <span className="text-gray-500">{segment.bits.length}</span>
            </div>
            <div className="font-mono text-xs border border-gray-100 p-2 break-all leading-relaxed">
              {formatBitGroups(segment.bits)}
            </div>
          </div>
        ))}
      </div>

      {/* 전체 비트 스트림 */}
      <div className="pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between mb-1 text-xs">
          <span>전체</span>
          <span className="text-gray-500">{encodedData.totalBits} 비트</span>
        </div>
        <div className="font-mono text-xs border border-gray-200 p-2 break-all leading-relaxed">
          {formatBitGroups(encodedData.bitStream)}
        </div>
      </div>
    </div>
  );
}
