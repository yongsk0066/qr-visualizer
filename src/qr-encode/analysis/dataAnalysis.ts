import {
  ALPHANUMERIC_CHARS,
  CHARACTER_COUNT_BITS,
  DATA_CAPACITY_TABLE,
  QR_VERSIONS,
} from '../../shared';
import type {
  DataAnalysisResult,
  ErrorCorrectionLevel,
  QRMode,
  QRVersion,
} from '../../shared/types';

/**
 * 문자가 숫자(0-9)인지 확인
 */
const isNumericChar = (char: string): boolean => /^[0-9]$/.test(char);

/**
 * 문자가 영숫자(0-9, A-Z, 9개 특수문자)인지 확인
 */
const isAlphanumericChar = (char: string): boolean => ALPHANUMERIC_CHARS.includes(char);

/**
 * 문자가 한자(Shift JIS 인코딩)인지 확인
 */
const isKanjiChar = (char: string): boolean => {
  const code = char.charCodeAt(0);
  return (code >= 0x8140 && code <= 0x9ffc) || (code >= 0xe040 && code <= 0xebbf);
};

/**
 * 단일 문자에 대한 최적 QR 모드 결정
 */
const detectCharacterMode = (char: string): QRMode => {
  if (isNumericChar(char)) return 'numeric';
  if (isAlphanumericChar(char)) return 'alphanumeric';
  if (isKanjiChar(char)) return 'kanji';
  return 'byte';
};

/**
 * 전체 데이터 문자열에 대한 가장 효율적인 단일 모드 결정
 */
const getOptimalMode = (data: string): QRMode => {
  const modes = data.split('').map(detectCharacterMode);
  const uniqueModes = [...new Set(modes)];

  if (uniqueModes.length === 1) {
    return uniqueModes[0];
  }

  if (modes.every((mode) => mode === 'numeric' || mode === 'alphanumeric')) {
    return 'alphanumeric';
  }

  return 'byte';
};

/**
 * 특정 모드에서 인코딩에 필요한 데이터 비트 수 계산
 */
const calculateDataBits = (data: string, mode: QRMode): number => {
  const length = data.length;

  switch (mode) {
    case 'numeric':
      return Math.floor(length / 3) * 10 + (length % 3 === 2 ? 7 : length % 3 === 1 ? 4 : 0);
    case 'alphanumeric':
      return Math.floor(length / 2) * 11 + (length % 2) * 6;
    case 'byte': {
      // UTF-8 바이트 길이 사용
      const encoder = new TextEncoder();
      const bytes = encoder.encode(data);
      return bytes.length * 8;
    }
    case 'kanji':
      return length * 13;
    default: {
      // 기본값도 UTF-8 바이트 길이 사용
      const defaultEncoder = new TextEncoder();
      const defaultBytes = defaultEncoder.encode(data);
      return defaultBytes.length * 8;
    }
  }
};

/**
 * 모드와 버전에 따른 문자 카운트 지시자에 필요한 비트 수 반환
 */
export const getCharacterCountBits = (mode: QRMode, version: QRVersion): number => {
  const versionRange = version <= 9 ? '1-9' : version <= 26 ? '10-26' : '27-40';
  const bits = CHARACTER_COUNT_BITS[mode]?.[versionRange];

  if (bits === undefined) {
    throw new Error('지원되지 않는 모드');
  }

  return bits;
};

/**
 * 모드 지시자, 문자 카운트, 데이터를 포함한 총 필요 비트 수 계산
 */
const calculateTotalBits = (data: string, mode: QRMode, version: QRVersion): number => {
  const modeIndicatorBits = 4;
  const characterCountBits = getCharacterCountBits(mode, version);
  const dataBits = calculateDataBits(data, mode);

  return modeIndicatorBits + characterCountBits + dataBits;
};

/**
 * 데이터를 수용할 수 있는 최소 QR 버전 찾기
 * @returns 적합한 버전을 찾으면 해당 버전, 찾지 못하면 null
 */
const findMinimumVersion = (
  data: string,
  mode: QRMode,
  errorLevel: ErrorCorrectionLevel
): QRVersion | null =>
  QR_VERSIONS.find((version) => {
    const totalBits = calculateTotalBits(data, mode, version);
    const capacity = DATA_CAPACITY_TABLE[version][errorLevel];
    return totalBits <= capacity;
  }) ?? null;

/**
 * 입력 데이터를 분석하여 최적 인코딩 매개변수 결정
 * @param data 분석할 입력 문자열
 * @param errorLevel 에러 정정 레벨 (기본값: 'M')
 * @returns 권장 모드, 버전, 유효성을 포함한 분석 결과
 */
export const analyzeData = (
  data: string,
  errorLevel: ErrorCorrectionLevel = 'M'
): DataAnalysisResult => {
  if (!data) {
    return {
      recommendedMode: 'byte',
      minimumVersion: 1,
      characterCount: 0,
      isValid: false,
    };
  }

  const recommendedMode = getOptimalMode(data);
  const minimumVersion = findMinimumVersion(data, recommendedMode, errorLevel);
  const isValid = minimumVersion !== null;

  // 바이트 모드의 경우 UTF-8 바이트 수를 반환, 다른 모드는 문자 수 반환
  const characterCount = recommendedMode === 'byte' 
    ? new TextEncoder().encode(data).length  // UTF-8 바이트 수
    : data.length;  // 문자 수

  return {
    recommendedMode,
    minimumVersion: minimumVersion || 40,
    characterCount,
    isValid,
  };
};
