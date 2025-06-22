import type { DataReadingResult } from './types';
import type { ErrorCorrectionLevel, QRVersion } from '../../../shared/types';
import { 
  generateZigzagPattern, 
  createReadingOrderMatrix,
  createByteBlockMatrix 
} from './utils/zigzagPattern';
import { getCodewordInfo, separateCodewordBlocks } from './utils/codewordInfo';

/**
 * QR 매트릭스에서 데이터 모듈 읽기
 * ISO/IEC 18004 Section 7.7.3
 */
export const readDataModules = (
  unmaskedMatrix: (0 | 1)[][],
  dataModules: boolean[][],
  version: QRVersion,
  errorLevel: ErrorCorrectionLevel
): DataReadingResult => {
  const size = unmaskedMatrix.length;
  
  // 1. 지그재그 패턴 생성
  const zigzagPositions = generateZigzagPattern(size, dataModules);
  
  // 2. 비트 읽기
  const bits: string[] = [];
  zigzagPositions.forEach(pos => {
    const bit = unmaskedMatrix[pos.row][pos.col];
    bits.push(bit.toString());
  });
  
  const bitStream = bits.join('');
  
  // 3. 8비트 코드워드로 변환
  const codewords: number[] = [];
  for (let i = 0; i < bitStream.length; i += 8) {
    const byte = bitStream.slice(i, i + 8);
    if (byte.length === 8) {
      codewords.push(parseInt(byte, 2));
    }
  }
  
  // 4. 코드워드 정보 가져오기
  const codewordInfo = getCodewordInfo(version, errorLevel);
  
  // 5. 데이터/EC 블록 분리
  const blockInfo = separateCodewordBlocks(codewords, version, errorLevel);
  
  // 6. 시각화용 매트릭스 생성
  const readingOrder = createReadingOrderMatrix(size, zigzagPositions);
  const byteBlocks = createByteBlockMatrix(size, zigzagPositions);
  
  // 7. 신뢰도 계산 (모든 데이터를 읽었는지 확인)
  const expectedBits = codewordInfo.totalCodewords * 8;
  const actualBits = bitStream.length;
  const confidence = Math.min(1, actualBits / expectedBits);
  
  return {
    bitStream,
    totalBits: bitStream.length,
    codewords,
    dataCodewordCount: codewordInfo.dataCodewords,
    errorCorrectionCodewordCount: codewordInfo.ecCodewords,
    blockInfo,
    readingOrder,
    byteBlocks,
    confidence
  };
};

/**
 * 비트스트림을 16진수 문자열로 변환 (디버깅용)
 */
export const bitStreamToHex = (bitStream: string): string => {
  const hex: string[] = [];
  for (let i = 0; i < bitStream.length; i += 8) {
    const byte = bitStream.slice(i, i + 8);
    if (byte.length === 8) {
      hex.push(parseInt(byte, 2).toString(16).padStart(2, '0').toUpperCase());
    }
  }
  return hex.join(' ');
};