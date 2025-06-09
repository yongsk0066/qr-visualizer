/**
 * BCH (Bose-Chaudhuri-Hocquenghem) 코드 계산 유틸리티
 * ISO/IEC 18004 표준의 부속서 C, D 구현
 */

/**
 * GF(2^4) 갈루아 필드에서 다항식 나머지 계산
 * 포맷 정보용 (15,5) BCH 코드
 * 생성기 다항식: G(x) = x^10 + x^8 + x^5 + x^4 + x^2 + x + 1
 */
export const calculateFormatBCH = (data: number): number => {
  // 5비트 데이터를 x^10만큼 시프트 (좌측 10비트 시프트)
  let remainder = data << 10;
  
  // 생성기 다항식: x^10 + x^8 + x^5 + x^4 + x^2 + x + 1 = 0x537
  const generator = 0x537;
  
  // 다항식 나눗셈 수행 (최고차항부터)
  for (let i = 14; i >= 10; i--) {
    if (remainder & (1 << i)) {
      remainder ^= generator << (i - 10);
    }
  }
  
  return remainder & 0x3FF; // 10비트 마스크
};

/**
 * GF(2^6) 갈루아 필드에서 다항식 나머지 계산
 * 버전 정보용 (18,6) BCH 코드
 * 생성기 다항식: G(x) = x^12 + x^11 + x^10 + x^9 + x^8 + x^6 + x^2 + 1
 */
export const calculateVersionBCH = (version: number): number => {
  // 6비트 버전을 x^12만큼 시프트 (좌측 12비트 시프트)
  let remainder = version << 12;
  
  // 생성기 다항식: x^12 + x^11 + x^10 + x^9 + x^8 + x^6 + x^2 + 1 = 0x1F25
  const generator = 0x1F25;
  
  // 다항식 나눗셈 수행 (최고차항부터)
  for (let i = 17; i >= 12; i--) {
    if (remainder & (1 << i)) {
      remainder ^= generator << (i - 12);
    }
  }
  
  return remainder & 0xFFF; // 12비트 마스크
};

/**
 * 포맷 정보 계산 (데이터 + BCH + 마스크)
 * ISO/IEC 18004 Section 8.9 Format information
 * 
 * @param errorCorrectionLevel 0=L, 1=M, 2=Q, 3=H  
 * @param maskPattern 0-7 마스크 패턴
 * @returns 15비트 포맷 정보
 */
export const calculateFormatInfo = (errorCorrectionLevel: number, maskPattern: number): number => {
  // 5비트 데이터: EC 레벨 (2비트) + 마스크 패턴 (3비트)
  const ecLevelBits = [1, 0, 3, 2][errorCorrectionLevel]; // L=01, M=00, Q=11, H=10
  const data = (ecLevelBits << 3) | maskPattern;
  
  // BCH 계산
  const bchBits = calculateFormatBCH(data);
  
  // 15비트 조합: 데이터(5비트) + BCH(10비트)
  const formatInfo = (data << 10) | bchBits;
  
  // 마스크 패턴 101010000010010 (0x5412)로 XOR
  return formatInfo ^ 0x5412;
};

/**
 * 버전 정보 계산 (버전 + BCH)
 * ISO/IEC 18004 Section 8.10 Version information
 * 버전 7-40에서만 사용
 * 
 * @param version QR 버전 (7-40)
 * @returns 18비트 버전 정보
 */
export const calculateVersionInfo = (version: number): number => {
  if (version < 7 || version > 40) {
    throw new Error(`Invalid version ${version}. Version info only applies to versions 7-40.`);
  }
  
  // BCH 계산
  const bchBits = calculateVersionBCH(version);
  
  // 18비트 조합: 버전(6비트) + BCH(12비트)
  return (version << 12) | bchBits;
};

/**
 * 버전별 미리 계산된 버전 정보 (검증용)
 * ISO/IEC 18004 부속서 D 예시
 */
export const VERSION_INFO_TABLE: Record<number, number> = {
  7:  0x07C94, // 000111110010010100
  8:  0x085BC,
  9:  0x09A99,
  10: 0x0A4D3,
  11: 0x0BBF6,
  12: 0x0C762,
  13: 0x0D847,
  14: 0x0E60D,
  15: 0x0F928,
  16: 0x10B78,
  17: 0x1145D,
  18: 0x12A17,
  19: 0x13532,
  20: 0x149A6,
  21: 0x15683,
  22: 0x168C9,
  23: 0x177EC,
  24: 0x18EC4,
  25: 0x191E1,
  26: 0x1AFAB,
  27: 0x1B08E,
  28: 0x1CC1A,
  29: 0x1D33F,
  30: 0x1ED75,
  31: 0x1F250,
  32: 0x209D5,
  33: 0x216F0,
  34: 0x228BA,
  35: 0x2379F,
  36: 0x24B0B,
  37: 0x2542E,
  38: 0x26A64,
  39: 0x27541,
  40: 0x28C69
};