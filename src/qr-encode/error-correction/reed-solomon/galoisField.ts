import { GALOIS_FIELD } from '../../../shared';

/**
 * GF(256) 갈루아 필드 정적 유틸리티
 * 테이블 기반 최적화된 갈루아 필드 연산 제공
 * ISO/IEC 18004 부속서 A
 */
export class GaloisField256 {
  private static readonly FIELD_SIZE = GALOIS_FIELD.FIELD_SIZE;
  private static readonly PRIMITIVE_POLYNOMIAL = GALOIS_FIELD.PRIMITIVE_POLYNOMIAL;
  
  private static expTable: number[] | null = null;
  private static logTable: number[] | null = null;
  
  /**
   * 갈루아 필드 테이블 초기화 (지연 초기화)
   */
  private static ensureInitialized(): void {
    if (this.expTable && this.logTable) return;
    
    this.expTable = new Array(256);
    this.logTable = new Array(256);
    
    let x = 1;
    for (let i = 0; i < 255; i++) {
      this.expTable[i] = x;
      this.logTable[x] = i;
      x = this.shiftWithPrimitive(x);
    }
    this.expTable[255] = this.expTable[0];
  }
  
  private static shiftWithPrimitive(x: number): number {
    x <<= 1;
    return x >= this.FIELD_SIZE ? x ^ this.PRIMITIVE_POLYNOMIAL : x;
  }
  
  /**
   * 갈루아 필드에서 두 수의 곱셈
   */
  static multiply(a: number, b: number): number {
    if (a === 0 || b === 0) return 0;
    
    this.ensureInitialized();
    return this.expTable![(this.logTable![a] + this.logTable![b]) % 255];
  }
  
  /**
   * α^i 값 반환 (지수 테이블 접근)
   */
  static getExp(i: number): number {
    this.ensureInitialized();
    return this.expTable![i % 255];
  }
  
  /**
   * 로그 테이블 접근 (log_α(x))
   */
  static getLog(x: number): number {
    if (x === 0) throw new Error('log(0) is undefined');
    this.ensureInitialized();
    return this.logTable![x];
  }
  
  /**
   * 갈루아 필드에서 나눗셈
   */
  static divide(a: number, b: number): number {
    if (b === 0) throw new Error('Division by zero');
    if (a === 0) return 0;
    
    this.ensureInitialized();
    return this.expTable![(this.logTable![a] - this.logTable![b] + 255) % 255];
  }
  
  /**
   * 갈루아 필드에서 역원 계산
   */
  static inverse(a: number): number {
    if (a === 0) throw new Error('0 has no inverse');
    this.ensureInitialized();
    return this.expTable![(255 - this.logTable![a]) % 255];
  }
}