import type { ErrorCorrectionData } from '../../shared/types';

export interface MessageConstructionResult {
  finalBitStream: string;
  totalBits: number;
  dataBits: number;
  ecBits: number;
  remainderBits: number;
}

/**
 * Step 4: Message Construction (Final Bit Stream)
 * 최종 비트 스트림 구성 - 인터리빙된 코드워드를 비트로 변환하고 잔여 비트 추가
 * ISO/IEC 18004 섹션 8.7 참조
 */
export function constructMessage(
  errorCorrectionData: ErrorCorrectionData
): MessageConstructionResult {
  // 인터리빙된 코드워드를 비트 스트림으로 변환
  const interleavedBits = errorCorrectionData.interleavedCodewords
    .map(codeword => codeword.toString(2).padStart(8, '0'))
    .join('');
  
  // 잔여 비트 추가 (모두 0)
  const remainderBits = '0'.repeat(errorCorrectionData.remainderBits);
  const finalBitStream = interleavedBits + remainderBits;
  
  return {
    finalBitStream,
    totalBits: finalBitStream.length,
    dataBits: errorCorrectionData.dataCodewords.length * 8,
    ecBits: errorCorrectionData.ecCodewords.length * 8,
    remainderBits: errorCorrectionData.remainderBits,
  };
}

/**
 * 비트 배열을 시각화용 문자열로 변환
 */
export function formatBitString(bits: string, groupSize = 8): string {
  return bits
    .match(new RegExp(`.{1,${groupSize}}`, 'g'))
    ?.join(' ') || '';
}