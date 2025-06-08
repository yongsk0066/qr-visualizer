import type { ReactNode } from 'react';
import type { EncodedData } from '../qr/dataEncoding';

interface BitStreamViewerProps {
  encodedData: EncodedData | null;
}

interface BitSegment {
  label: string;
  bits: string;
  color: string;
  highlightName: string;
}

export function BitStreamViewer({ encodedData }: BitStreamViewerProps) {
  if (!encodedData) {
    return <div className="text-gray-500 text-sm">데이터를 입력하면 비트 스트림이 표시됩니다</div>;
  }

  const segments: BitSegment[] = [
    {
      label: '모드 지시자',
      bits: encodedData.modeIndicator,
      color: 'bg-red-200',
      highlightName: 'mode-indicator',
    },
    {
      label: '문자 카운트',
      bits: encodedData.characterCount,
      color: 'bg-blue-200',
      highlightName: 'character-count',
    },
    {
      label: '데이터',
      bits: encodedData.data,
      color: 'bg-green-200',
      highlightName: 'data-bits',
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
      color: 'bg-yellow-200',
      highlightName: 'terminator',
    });
  }

  // 나머지는 패딩
  const paddingStart = terminatorLength;
  if (paddingStart < remainder.length) {
    segments.push({
      label: '패딩',
      bits: remainder.slice(paddingStart),
      color: 'bg-purple-200',
      highlightName: 'padding',
    });
  }

  const formatBitGroups = (bits: string) => {
    return bits.match(/.{1,8}/g)?.join(' ') || bits;
  };

  // 기존 포맷팅 유지하면서 세그먼트별 색상 적용
  const renderColoredBitStream = () => {
    const bitStream = encodedData.bitStream;
    const formattedStream = formatBitGroups(bitStream);

    // 각 세그먼트의 시작/끝 위치 계산 (원본 비트스트림 기준)
    let currentPos = 0;
    const segmentPositions = segments.map((segment) => {
      const start = currentPos;
      const end = currentPos + segment.bits.length;
      currentPos = end;
      return { ...segment, start, end };
    });

    // 포맷된 스트림에서 각 문자의 원본 위치 매핑
    const result: ReactNode[] = [];
    let originalIndex = 0;

    for (let i = 0; i < formattedStream.length; i++) {
      const char = formattedStream[i];

      if (char === ' ') {
        // 공백은 그대로 출력
        result.push(<span key={i}> </span>);
      } else {
        // 현재 비트가 어느 세그먼트에 속하는지 찾기
        const segment = segmentPositions.find(
          (seg) => originalIndex >= seg.start && originalIndex < seg.end
        );

        result.push(
          <span key={i} className={segment ? segment.color : 'bg-gray-100'} title={segment?.label}>
            {char}
          </span>
        );
        originalIndex++;
      }
    }

    return <>{result}</>;
  };

  return (
    <div className="space-y-4">
      {/* 구성 요소별 세부 정보 */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-800 mb-2">구성 요소</h3>
        {segments.map((segment, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between mb-1">
              <span className={`px-2 py-0.5 rounded ${segment.color} text-xs font-medium`}>
                {index + 1}. {segment.label}
              </span>
              <span className="text-gray-500 text-xs">{segment.bits.length} 비트</span>
            </div>
            <pre className="font-mono text-xs border border-gray-200 p-2 whitespace-pre-wrap leading-tight overflow-x-auto bg-gray-50 rounded">
              {formatBitGroups(segment.bits)}
            </pre>
          </div>
        ))}
      </div>

      {/* 연결 과정 시각화 */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-800 mb-2">연결 과정</h3>
        <div className="flex items-center flex-wrap gap-1 text-xs text-gray-600">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center">
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${segment.color}`}>
                {segment.label}
              </span>
              {index < segments.length - 1 && (
                <span className="mx-1 text-gray-400 font-medium">+</span>
              )}
            </div>
          ))}
          <span className="mx-1 text-gray-400 font-medium">=</span>
          <span className="px-1.5 py-0.5 bg-blue-100 rounded text-xs font-medium">전체</span>
        </div>
      </div>

      {/* 최종 비트 스트림 */}
      <div className="pt-3 border-t border-gray-300">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-800">최종 비트 스트림</span>
          <span className="text-gray-500 text-xs font-medium">{encodedData.totalBits} 비트</span>
        </div>
        <pre className="font-mono text-xs border border-gray-300 p-2 whitespace-pre-wrap leading-tight overflow-x-auto bg-blue-50 rounded">
          {renderColoredBitStream()}
        </pre>
      </div>
    </div>
  );
}
