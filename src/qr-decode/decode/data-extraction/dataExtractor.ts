/**
 * QR 코드 데이터 추출
 * ISO/IEC 18004 Section 7.4
 */

import { pipe } from '@mobily/ts-belt';
import type { QRVersion } from '../../../shared/types';
import type { 
  DataExtractionResult, 
  DataSegment, 
  BitStream, 
  Mode,
  PaddingInfo 
} from './types';
import { 
  codewordsToBitStream, 
  readBits, 
  readBitString,
  getRemainingBits,
  savePosition,
  restorePosition 
} from './utils/bitStream';
import { getCharacterCountBits } from './utils/characterCount';
import { decodeNumeric, decodeAlphanumeric, decodeByte } from './decoders';

/**
 * 모드 지시자 읽기
 * ISO/IEC 18004 Section 7.4.1
 */
const readModeIndicator = (bitStream: BitStream): { mode: Mode; bits: string } | null => {
  const savedPos = savePosition(bitStream);
  const modeValue = readBits(bitStream, 4);
  
  if (modeValue === null) {
    return null;
  }
  
  // 모드 검증
  const validModes = [0b0000, 0b0001, 0b0010, 0b0100, 0b0111, 0b1000];
  if (!validModes.includes(modeValue)) {
    restorePosition(bitStream, savedPos);
    return null;
  }
  
  const bits = modeValue.toString(2).padStart(4, '0');
  return { mode: modeValue as Mode, bits };
};

/**
 * 문자 개수 지시자 읽기
 * ISO/IEC 18004 Section 7.4.1
 */
const readCharacterCount = (
  bitStream: BitStream, 
  mode: Mode, 
  version: QRVersion
): { count: number; bits: string } | null => {
  const countBits = getCharacterCountBits(mode, version);
  
  if (countBits === 0) {
    return { count: 0, bits: '' };
  }
  
  const count = readBits(bitStream, countBits);
  if (count === null) {
    return null;
  }
  
  const bits = count.toString(2).padStart(countBits, '0');
  return { count, bits };
};

/**
 * 세그먼트 디코딩
 */
const decodeSegment = (
  bitStream: BitStream,
  mode: Mode,
  characterCount: number
): { data: string; bits: string } | null => {
  switch (mode) {
    case 0b0001: // NUMERIC
      return decodeNumeric(bitStream, characterCount);
      
    case 0b0010: // ALPHANUMERIC
      return decodeAlphanumeric(bitStream, characterCount);
      
    case 0b0100: // BYTE
      const byteResult = decodeByte(bitStream, characterCount);
      return byteResult ? { data: byteResult.data, bits: byteResult.bits } : null;
      
    case 0b1000: // KANJI
      // TODO: 한자 모드 구현
      return null;
      
    default:
      return null;
  }
};

/**
 * 패딩 분석
 */
const analyzePadding = (bitStream: BitStream, dataEndPosition: number): PaddingInfo => {
  const totalBits = bitStream.bits.length;
  const remainingBits = totalBits - dataEndPosition;
  
  // 종료 패턴 찾기 (최대 4비트의 0)
  let terminatorBits = 0;
  let terminatorPosition: number | undefined = undefined;
  
  if (remainingBits > 0) {
    // 데이터 끝부분부터 연속된 0의 개수를 센다 (최대 4개)
    for (let i = 0; i < Math.min(4, remainingBits); i++) {
      if (bitStream.bits[dataEndPosition + i] === 0) {
        terminatorBits++;
      } else {
        break;
      }
    }
    
    if (terminatorBits > 0) {
      terminatorPosition = dataEndPosition;
    }
  }
  
  // 바이트 경계까지의 패딩
  const bitsAfterTerminator = dataEndPosition + terminatorBits;
  const byteBoundaryPaddingBits = (8 - (bitsAfterTerminator % 8)) % 8;
  
  // 패딩 바이트 수
  const bitsAfterByteBoundary = bitsAfterTerminator + byteBoundaryPaddingBits;
  const paddingBytes = Math.floor((totalBits - bitsAfterByteBoundary) / 8);
  
  // 패딩 패턴 확인
  const paddingPattern: string[] = [];
  if (paddingBytes > 0) {
    const savedPos = bitStream.position;
    bitStream.position = bitsAfterByteBoundary;
    
    for (let i = 0; i < paddingBytes; i++) {
      const byte = readBits(bitStream, 8);
      if (byte !== null) {
        paddingPattern.push(byte.toString(16).toUpperCase().padStart(2, '0'));
      }
    }
    
    bitStream.position = savedPos;
  }
  
  return {
    terminatorPosition,
    terminatorBits,
    byteBoundaryPaddingBits,
    paddingBytes,
    paddingPattern
  };
};

/**
 * 데이터 추출 메인 함수
 */
export const extractData = (
  correctedDataCodewords: number[],
  version: QRVersion
): DataExtractionResult => {
  // 비트 스트림 생성
  const bitStream = codewordsToBitStream(correctedDataCodewords);
  const totalBits = bitStream.bits.length;
  const segments: DataSegment[] = [];
  let isValid = true;
  let errorMessage: string | undefined;
  
  try {
    // 세그먼트 읽기 루프
    while (getRemainingBits(bitStream) >= 4) { // 최소 모드 지시자 크기
      const startBit = bitStream.position;
      
      // 모드 지시자 읽기
      const modeResult = readModeIndicator(bitStream);
      if (!modeResult) {
        break;
      }
      
      // 종료 패턴 확인
      if (modeResult.mode === 0b0000) {
        // 종료 패턴을 만났으므로 위치를 되돌리고 종료
        bitStream.position = startBit;
        break;
      }
      
      // 문자 개수 읽기
      const countResult = readCharacterCount(bitStream, modeResult.mode, version);
      if (!countResult) {
        errorMessage = `문자 개수 지시자 읽기 실패 (모드: ${modeResult.mode.toString(2).padStart(4, '0')})`;
        isValid = false;
        break;
      }
      
      // 데이터 디코딩
      const dataResult = decodeSegment(bitStream, modeResult.mode, countResult.count);
      if (!dataResult) {
        errorMessage = `데이터 디코딩 실패 (모드: ${modeResult.mode.toString(2).padStart(4, '0')}, 문자수: ${countResult.count})`;
        isValid = false;
        break;
      }
      
      // 세그먼트 추가
      segments.push({
        mode: modeResult.mode,
        modeIndicatorBits: modeResult.bits,
        characterCount: countResult.count,
        characterCountBits: countResult.bits,
        dataBits: dataResult.bits,
        data: dataResult.data,
        startBit,
        endBit: bitStream.position
      });
    }
    
    // 패딩 분석
    const paddingInfo = analyzePadding(bitStream, bitStream.position);
    
    // 최종 텍스트 생성
    const decodedText = segments.map(s => s.data).join('');
    
    // 신뢰도 계산
    const usedBits = bitStream.position;
    const dataRatio = usedBits / totalBits;
    const hasValidTerminator = paddingInfo.terminatorPosition !== undefined;
    const hasValidPadding = paddingInfo.paddingPattern.every((p, i) => 
      p === (i % 2 === 0 ? 'EC' : '11')
    );
    
    const confidence = (
      (dataRatio > 0.5 ? 0.4 : dataRatio * 0.8) +
      (hasValidTerminator ? 0.3 : 0) +
      (hasValidPadding ? 0.3 : 0)
    );
    
    return {
      segments,
      decodedText,
      bitStream: bitStream.bits.join(''),
      bitsUsed: usedBits,
      totalBits,
      paddingInfo,
      isValid: isValid && segments.length > 0,
      confidence,
      errorMessage
    };
    
  } catch (error) {
    return {
      segments,
      decodedText: segments.map(s => s.data).join(''),
      bitStream: bitStream.bits.join(''),
      bitsUsed: bitStream.position,
      totalBits,
      paddingInfo: analyzePadding(bitStream, bitStream.position),
      isValid: false,
      confidence: 0,
      errorMessage: error instanceof Error ? error.message : '알 수 없는 에러'
    };
  }
};