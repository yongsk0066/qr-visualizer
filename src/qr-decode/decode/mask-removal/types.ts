import type { MaskPattern } from '../format-extraction/types';
export type { MaskPattern };

/**
 * 마스크 제거 결과
 */
export interface MaskRemovalResult {
  /** 마스크가 제거된 최종 매트릭스 */
  unmaskedMatrix: (0 | 1)[][];
  
  /** 마스크가 적용된 모듈 위치 (true = 마스크 적용됨) */
  maskedModules: boolean[][];
  
  /** 데이터 모듈인지 여부 (true = 데이터 모듈) */
  dataModules: boolean[][];
  
  /** 총 데이터 모듈 수 */
  dataModuleCount: number;
  
  /** 마스크를 제거할 수 없는 모듈 수 (unknown) */
  unknownModuleCount: number;
  
  /** 마스크 제거 신뢰도 (0-1) */
  confidence: number;
  
  /** 사용된 마스크 패턴 */
  maskPattern: MaskPattern;
  
  /** 디버깅 정보 */
  debug?: {
    originalTriState: (-1 | 0 | 1)[][];
    maskMatrix: boolean[][];
  };
}

/**
 * 모듈 타입 분류
 */
export type ModuleType = 
  | 'finder'           // 파인더 패턴
  | 'separator'        // 분리자
  | 'timing'           // 타이밍 패턴
  | 'alignment'        // 정렬 패턴
  | 'format'           // 포맷 정보
  | 'version'          // 버전 정보
  | 'dark'             // 다크 모듈
  | 'data';            // 데이터 모듈