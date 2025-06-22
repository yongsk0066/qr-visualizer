/**
 * 버전 정보 추출 관련 타입 정의
 * ISO/IEC 18004 Section 8.10
 */

/**
 * 버전 정보 추출 결과
 */
export interface VersionInfoResult {
  version: number;
  isValid: boolean;
  confidence: number;
  rawBits?: number;
  errorBits?: number;
  location1?: VersionLocationInfo;
  location2?: VersionLocationInfo;
}

/**
 * 각 위치별 버전 정보
 */
export interface VersionLocationInfo {
  rawBits: number;
  isValid: boolean;
  errorBits: number;
  confidence: number;
}

/**
 * 버전 정보 비트 위치
 * ISO/IEC 18004 Figure 25
 */
export interface VersionBitsLocation {
  bits: (number | -1)[];
  unknownCount: number;
}

/**
 * BCH(18,6) 생성 다항식
 * G(x) = x^12 + x^11 + x^10 + x^9 + x^8 + x^6 + x^2 + 1
 */
export const VERSION_GENERATOR_POLYNOMIAL = 0x1F25;

/**
 * 버전 정보는 마스킹되지 않음 (포맷 정보와 다름)
 */
export const VERSION_INFO_MASK = 0x0; // No mask for version info