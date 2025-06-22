import type { ErrorCorrectionLevel } from '../../../shared/types';

export type MaskPattern = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface FormatInfoResult {
  errorLevel: ErrorCorrectionLevel;
  maskPattern: MaskPattern;
  isValid: boolean;
  rawBits: string;
  confidence: number;
  errorBits?: number; // BCH 에러 정정된 비트 수
  location1?: FormatInfoDetail; // 위치 1 상세 정보
  location2?: FormatInfoDetail; // 위치 2 상세 정보
}

export interface FormatInfoDetail {
  rawBits: string;
  isValid: boolean;
  errorBits: number;
  confidence: number;
}

export interface FormatBitsLocation {
  row: number;
  col: number;
  bitIndex: number;
}

// 포맷 정보 위치 상수
export const FORMAT_INFO_MASK = 0b101010000010010; // ISO/IEC 18004 고정 마스크
export const FORMAT_GENERATOR_POLYNOMIAL = 0b10100110111; // x^10 + x^8 + x^5 + x^4 + x^2 + x + 1