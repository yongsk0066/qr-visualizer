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
export const constructMessage = (
  errorCorrectionData: ErrorCorrectionData
): MessageConstructionResult => {
  const codewordToBinary = (codeword: number): string => 
    codeword.toString(2).padStart(8, '0');
  
  const interleavedBits = errorCorrectionData.interleavedCodewords
    .map(codewordToBinary)
    .join('');
  
  const remainderBitsString = '0'.repeat(errorCorrectionData.remainderBits);
  const finalBitStream = interleavedBits + remainderBitsString;
  
  return {
    finalBitStream,
    totalBits: finalBitStream.length,
    dataBits: errorCorrectionData.dataCodewords.length * 8,
    ecBits: errorCorrectionData.ecCodewords.length * 8,
    remainderBits: errorCorrectionData.remainderBits,
  };
};

/**
 * 비트 배열을 시각화용 문자열로 변환
 */
export const formatBitString = (bits: string, groupSize = 8): string => {
  const pattern = new RegExp(`.{1,${groupSize}}`, 'g');
  return bits.match(pattern)?.join(' ') || '';
};