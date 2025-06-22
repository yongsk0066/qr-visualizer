import { pipe } from '@mobily/ts-belt';
import type { QRMode, QRVersion, DataAnalysisResult, ErrorCorrectionLevel } from '../../shared/types';
import { MODE_INDICATORS, ALPHANUMERIC_CHARS, DATA_CAPACITY_TABLE } from '../../shared';
import { getCharacterCountBits } from '../analysis/dataAnalysis';
import { toBinaryString, padToByteBoundary, addPaddingPattern } from '../../shared';


export interface EncodedData {
  modeIndicator: string;
  characterCount: string;
  data: string;
  bitStream: string;
  totalBits: number;
}

// 유틸리티 함수들

/**
 * 문자 카운트 지시자를 생성
 * 바이트 모드의 경우 문자 수가 아닌 바이트 수를 사용
 */
const createCharacterCountIndicator = (data: string, mode: QRMode, version: QRVersion): string => {
  const bits = getCharacterCountBits(mode, version);
  
  // 바이트 모드는 UTF-8 바이트 수를 사용, 다른 모드는 문자 수 사용
  const count = mode === 'byte' 
    ? new TextEncoder().encode(data).length  // UTF-8 바이트 수
    : data.length;  // 문자 수
    
  return toBinaryString(count, bits);
};

// 모드별 인코딩 함수들
/**
 * 숫자 모드 인코딩 (3자리씩 10비트로, 나머지는 4비트 또는 7비트)
 */
const encodeNumericMode = (data: string): string => {
  const chunks = data.match(/.{1,3}/g) || [];
  return chunks
    .map(chunk => {
      const bitLength = chunk.length === 3 ? 10 : chunk.length === 2 ? 7 : 4;
      return toBinaryString(parseInt(chunk, 10), bitLength);
    })
    .join('');
};

/**
 * 영숫자 모드 인코딩 (2문자씩 11비트로, 나머지는 6비트)
 */
const encodeAlphanumericMode = (data: string): string => {
  const chunks = data.match(/.{1,2}/g) || [];
  return chunks
    .map(chunk => {
      if (chunk.length === 2) {
        const firstValue = ALPHANUMERIC_CHARS.indexOf(chunk[0]);
        const secondValue = ALPHANUMERIC_CHARS.indexOf(chunk[1]);
        return toBinaryString(firstValue * 45 + secondValue, 11);
      } else {
        return toBinaryString(ALPHANUMERIC_CHARS.indexOf(chunk[0]), 6);
      }
    })
    .join('');
};

/**
 * 바이트 모드 인코딩 (각 바이트를 8비트로)
 * UTF-8 인코딩을 사용하여 멀티바이트 문자(한글 등)를 올바르게 처리
 */
const encodeByteMode = (data: string): string => {
  // UTF-8 바이트 배열 생성
  const utf8Bytes = new TextEncoder().encode(data);
  
  // 각 바이트를 8비트 이진 문자열로 변환
  return Array.from(utf8Bytes)
    .map(byte => toBinaryString(byte, 8))
    .join('');
};

/**
 * 한자 모드 인코딩 (미구현 - 복잡한 Shift JIS 인코딩 필요)
 */
const encodeKanjiMode = (data: string): string => {
  // 한자 모드는 복잡한 Shift JIS 인코딩이 필요하므로 현재는 바이트 모드로 처리
  console.warn('한자 모드는 현재 구현되지 않음. 바이트 모드로 처리됩니다.');
  return encodeByteMode(data);
};

// 메인 인코딩 함수
/**
 * 모드별로 데이터를 인코딩
 */
const encodeDataByMode = (data: string, mode: QRMode): string => {
  switch (mode) {
    case 'numeric':
      return encodeNumericMode(data);
    case 'alphanumeric':
      return encodeAlphanumericMode(data);
    case 'byte':
      return encodeByteMode(data);
    case 'kanji':
      return encodeKanjiMode(data);
    default:
      throw new Error(`지원되지 않는 모드: ${mode}`);
  }
};

/**
 * 종단자 추가 (최대 4비트 0000)
 */
const addTerminator = (bitStream: string, capacity: number): string => {
  const remainingBits = capacity - bitStream.length;
  if (remainingBits <= 0) return bitStream;

  const terminatorLength = Math.min(4, remainingBits);
  return bitStream + '0'.repeat(terminatorLength);
};

/**
 * 패드 코드워드 추가 (11101100, 00010001 패턴 반복)
 */
const addPadCodewords = (bitStream: string, capacity: number): string =>
  addPaddingPattern(bitStream, capacity, ['11101100', '00010001']);

// 공개 API
/**
 * 입력 데이터를 QR 코드용 비트 스트림으로 인코딩
 * @param data 인코딩할 문자열
 * @param mode QR 인코딩 모드
 * @param version QR 버전
 * @param capacity 데이터 용량 (비트)
 * @returns 인코딩된 데이터 정보
 */
export const encodeData = (
  data: string,
  mode: QRMode,
  version: QRVersion,
  capacity: number
): EncodedData => {
  // 1. 기본 구성 요소 생성 (ISO/IEC 18004 - 8.4 데이터 부호화)
  const modeIndicator = MODE_INDICATORS[mode]; // 표 2: 4비트 모드 지시자
  const characterCount = createCharacterCountIndicator(data, mode, version); // 표 3: 문자 카운트 지시자
  const encodedData = encodeDataByMode(data, mode); // 8.4.2~8.4.5: 모드별 데이터 인코딩

  // 2. 비트 스트림 처리 파이프라인 (ISO/IEC 18004 - 8.4.9)

  // Step 1: 초기 비트 스트림 생성 - 모드 지시자 + 문자 카운트 + 데이터 연결
  const createInitialBitStream = (mode: string, count: string, data: string) => mode + count + data;

  // Step 2: 종단자 추가 - 데이터 끝을 표시하는 4비트 '0000' 추가 (용량이 충분한 경우)
  // "완성된 심벌에서 데이터의 끝은 4비트 종료기 0000에 의해 지시된다"
  const addTerminatorPadding = (bitStream: string) => addTerminator(bitStream, capacity);

  // Step 3: 8비트 경계 패딩 - 코드워드는 8비트 단위이므로 8의 배수로 맞춤
  // "2진수값 0을 갖는 패딩비트를 더하여 8비트의 길이로 만들게 된다"
  const addByteBoundaryPadding = (bitStream: string) => padToByteBoundary(bitStream);

  // Step 4: 패드 코드워드 추가 - 심벌 용량을 채우기 위해 11101100, 00010001 패턴 반복
  // "패드 코드워드 11101100과 00010001을 각기 더하여 확장된다"
  const addFinalPadding = (bitStream: string) => addPadCodewords(bitStream, capacity);

  // Step 5: 최종 결과 객체 생성
  const createResult = (finalBitStream: string): EncodedData => ({
    modeIndicator,
    characterCount,
    data: encodedData,
    bitStream: finalBitStream,
    totalBits: finalBitStream.length,
  });

  return pipe(
    createInitialBitStream(modeIndicator, characterCount, encodedData),
    addTerminatorPadding,
    addByteBoundaryPadding,
    addFinalPadding,
    createResult
  );
};

/**
 * 전체 데이터 인코딩 파이프라인 실행
 * 데이터 분석 결과를 받아서 최종 인코딩까지 완료된 결과 반환
 */
export const runDataEncoding = (
  inputData: string,
  analysis: DataAnalysisResult,
  version: QRVersion,
  errorLevel: ErrorCorrectionLevel
): EncodedData | null => {
  if (!analysis.isValid) return null;
  
  const capacity = DATA_CAPACITY_TABLE[version][errorLevel];
  return encodeData(inputData, analysis.recommendedMode, version, capacity);
};
