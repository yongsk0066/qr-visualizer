/**
 * 데이터 추출 관련 타입 정의
 */

/** 인코딩 모드 */
export enum Mode {
  NUMERIC = 0b0001,      // 숫자 모드
  ALPHANUMERIC = 0b0010, // 영숫자 모드
  BYTE = 0b0100,        // 바이트 모드
  KANJI = 0b1000,       // 한자 모드
  ECI = 0b0111,         // ECI 모드
  TERMINATOR = 0b0000    // 종료 패턴
}

/** 비트 스트림 인터페이스 */
export interface BitStream {
  /** 전체 비트 배열 (0 또는 1) */
  bits: number[];
  /** 현재 읽기 위치 */
  position: number;
}

/** 데이터 세그먼트 */
export interface DataSegment {
  /** 인코딩 모드 */
  mode: Mode;
  /** 모드 지시자 비트 문자열 */
  modeIndicatorBits: string;
  /** 문자 개수 */
  characterCount: number;
  /** 문자 개수 지시자 비트 문자열 */
  characterCountBits: string;
  /** 데이터 비트 문자열 */
  dataBits: string;
  /** 디코딩된 데이터 */
  data: string;
  /** 시작 비트 위치 */
  startBit: number;
  /** 종료 비트 위치 */
  endBit: number;
}

/** 패딩 정보 */
export interface PaddingInfo {
  /** 종료 패턴 위치 */
  terminatorPosition?: number;
  /** 종료 패턴 비트 수 */
  terminatorBits: number;
  /** 바이트 경계 패딩 비트 수 */
  byteBoundaryPaddingBits: number;
  /** 패딩 바이트 수 */
  paddingBytes: number;
  /** 패딩 바이트 패턴 */
  paddingPattern: string[];
}

/** 데이터 추출 결과 */
export interface DataExtractionResult {
  /** 추출된 데이터 세그먼트들 */
  segments: DataSegment[];
  /** 최종 디코딩된 텍스트 */
  decodedText: string;
  /** 전체 비트 스트림 (시각화용) */
  bitStream: string;
  /** 사용된 총 비트 수 */
  bitsUsed: number;
  /** 전체 비트 수 */
  totalBits: number;
  /** 패딩 정보 */
  paddingInfo: PaddingInfo;
  /** 디코딩 성공 여부 */
  isValid: boolean;
  /** 신뢰도 (0-1) */
  confidence: number;
  /** 에러 메시지 (실패 시) */
  errorMessage?: string;
}