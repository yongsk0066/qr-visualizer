import { describe, expect, it } from 'vitest';
import { readDataModules, bitStreamToHex } from './dataReader';
import { classifyModuleTypes } from '../mask-removal/maskRemover';

describe('dataReader', () => {
  describe('readDataModules', () => {
    it('버전 1, 에러레벨 L에서 올바른 비트스트림을 생성해야 함', () => {
      const size = 21;
      const version = 1;
      const errorLevel = 'L';
      
      // 테스트용 언마스크 매트릭스 생성 (모든 데이터 모듈을 0으로 초기화)
      const unmaskedMatrix: (0 | 1)[][] = Array.from(
        { length: size }, 
        () => Array(size).fill(0)
      );
      
      // 모듈 타입 분류
      const moduleTypes = classifyModuleTypes(size, version);
      const dataModules = Array.from(
        { length: size },
        (_, row) => Array.from(
          { length: size },
          (_, col) => moduleTypes[row][col] === 'data'
        )
      );
      
      // 일부 데이터 모듈에 값 설정 (테스트용)
      // 첫 8비트를 10101010으로 설정
      const testPattern = [1, 0, 1, 0, 1, 0, 1, 0];
      let dataIndex = 0;
      for (let row = 0; row < size && dataIndex < testPattern.length; row++) {
        for (let col = 0; col < size && dataIndex < testPattern.length; col++) {
          if (dataModules[row][col]) {
            unmaskedMatrix[row][col] = testPattern[dataIndex++] as (0 | 1);
          }
        }
      }
      
      const result = readDataModules(unmaskedMatrix, dataModules, version, errorLevel);
      
      // 버전 1-L의 총 코드워드는 26개 (데이터 19 + EC 7)
      expect(result.dataCodewordCount).toBe(19);
      expect(result.errorCorrectionCodewordCount).toBe(7);
      
      // 총 비트 수는 208 (26 * 8)
      expect(result.totalBits).toBe(208);
      
      // 코드워드 수는 26개
      expect(result.codewords.length).toBe(26);
      
      // 시각화 매트릭스 크기 확인
      expect(result.readingOrder.length).toBe(size);
      expect(result.byteBlocks.length).toBe(size);
    });
    
    it('코드워드를 올바르게 변환해야 함', () => {
      const size = 21;
      const version = 1;
      const errorLevel = 'L';
      
      const unmaskedMatrix: (0 | 1)[][] = Array.from(
        { length: size }, 
        () => Array(size).fill(0)
      );
      
      const moduleTypes = classifyModuleTypes(size, version);
      const dataModules = Array.from(
        { length: size },
        (_, row) => Array.from(
          { length: size },
          (_, col) => moduleTypes[row][col] === 'data'
        )
      );
      
      // 특정 패턴 설정: 11110000 = 0xF0 = 240
      const testBits = [1, 1, 1, 1, 0, 0, 0, 0];
      let bitIndex = 0;
      
      // 지그재그 패턴 순서로 비트 설정
      for (let colPair = size - 1; colPair > 0 && bitIndex < testBits.length; colPair -= 2) {
        if (colPair === 6) colPair--;
        
        const rightCol = colPair;
        const leftCol = colPair - 1;
        
        for (let row = size - 1; row >= 0 && bitIndex < testBits.length; row--) {
          for (const col of [rightCol, leftCol]) {
            if (col >= 0 && dataModules[row][col]) {
              unmaskedMatrix[row][col] = testBits[bitIndex++] as (0 | 1);
            }
          }
        }
      }
      
      const result = readDataModules(unmaskedMatrix, dataModules, version, errorLevel);
      
      // 첫 번째 코드워드가 240 (0xF0)이어야 함
      expect(result.codewords[0]).toBe(240);
      
      // MSB first 확인
      expect(result.bitStream.substring(0, 8)).toBe('11110000');
    });
    
    it('데이터/EC 코드워드를 올바르게 분리해야 함', () => {
      const size = 21;
      const version = 1;
      const errorLevel = 'L';
      
      const unmaskedMatrix: (0 | 1)[][] = Array.from(
        { length: size }, 
        () => Array(size).fill(0)
      );
      
      const moduleTypes = classifyModuleTypes(size, version);
      const dataModules = Array.from(
        { length: size },
        (_, row) => Array.from(
          { length: size },
          (_, col) => moduleTypes[row][col] === 'data'
        )
      );
      
      const result = readDataModules(unmaskedMatrix, dataModules, version, errorLevel);
      
      // 버전 1-L: 1개 블록, 데이터 19개, EC 7개
      expect(result.blockInfo.dataBlocks.length).toBe(1);
      expect(result.blockInfo.ecBlocks.length).toBe(1);
      expect(result.blockInfo.dataBlocks[0].length).toBe(19);
      expect(result.blockInfo.ecBlocks[0].length).toBe(7);
    });
    
    it('모든 버전에서 작동해야 함', () => {
      const versions: Array<{ version: 1 | 5 | 10 | 20 | 40, expectedTotal: number }> = [
        { version: 1, expectedTotal: 26 },
        { version: 5, expectedTotal: 134 },
        { version: 10, expectedTotal: 346 },
        { version: 20, expectedTotal: 861 },  // 3*107 + 5*108 = 321 + 540 = 861
        { version: 40, expectedTotal: 2956 }  // 19*118 + 6*119 = 2242 + 714 = 2956
      ];
      
      versions.forEach(({ version, expectedTotal }) => {
        const size = 17 + version * 4;
        const errorLevel = 'L';
        
        const unmaskedMatrix: (0 | 1)[][] = Array.from(
          { length: size }, 
          () => Array(size).fill(0)
        );
        
        const moduleTypes = classifyModuleTypes(size, version);
        const dataModules = Array.from(
          { length: size },
          (_, row) => Array.from(
            { length: size },
            (_, col) => moduleTypes[row][col] === 'data'
          )
        );
        
        const result = readDataModules(unmaskedMatrix, dataModules, version, errorLevel);
        
        // 총 코드워드 수 확인
        const totalCodewords = result.dataCodewordCount + result.errorCorrectionCodewordCount;
        expect(totalCodewords).toBe(expectedTotal);
      });
    });
  });
  
  describe('엣지 케이스', () => {
    it('빈 데이터 영역을 처리해야 함', () => {
      const size = 21;
      const version = 1;
      const errorLevel = 'L';
      
      // 모든 데이터가 0인 매트릭스
      const unmaskedMatrix: (0 | 1)[][] = Array.from(
        { length: size }, 
        () => Array(size).fill(0)
      );
      
      const moduleTypes = classifyModuleTypes(size, version);
      const dataModules = Array.from(
        { length: size },
        (_, row) => Array.from(
          { length: size },
          (_, col) => moduleTypes[row][col] === 'data'
        )
      );
      
      const result = readDataModules(unmaskedMatrix, dataModules, version, errorLevel);
      
      // 모든 코드워드가 0이어야 함
      expect(result.codewords.every(cw => cw === 0)).toBe(true);
      
      // 비트스트림이 모두 0이어야 함
      expect(result.bitStream).toMatch(/^0+$/);
    });
    
    it('불완전한 바이트를 처리해야 함', () => {
      const size = 21;
      const version = 1;
      const errorLevel = 'L';
      
      // 일부러 작은 데이터 모듈 영역 생성
      const dataModules = Array.from(
        { length: size },
        () => Array(size).fill(false)
      );
      
      // 오른쪽 하단에서 시작하는 지그재그 패턴을 고려하여 7비트 설정
      // (20,20), (20,19), (19,20), (19,19), (18,20), (18,19), (17,20)
      const positions = [
        [20, 20], [20, 19], [19, 20], [19, 19], 
        [18, 20], [18, 19], [17, 20]
      ];
      
      positions.forEach(([row, col]) => {
        dataModules[row][col] = true;
      });
      
      const unmaskedMatrix: (0 | 1)[][] = Array.from(
        { length: size }, 
        () => Array(size).fill(1)
      );
      
      const result = readDataModules(unmaskedMatrix, dataModules, version, errorLevel);
      
      // 7비트만 읽혀야 함
      expect(result.bitStream.length).toBe(7);
      
      // 코드워드는 생성되지 않아야 함 (8비트 미만)
      expect(result.codewords.length).toBe(0);
    });
  });
  
  describe('bitStreamToHex', () => {
    it('비트스트림을 16진수로 변환해야 함', () => {
      expect(bitStreamToHex('11110000')).toBe('F0');
      expect(bitStreamToHex('10101010')).toBe('AA');
      expect(bitStreamToHex('00000000')).toBe('00');
      expect(bitStreamToHex('11111111')).toBe('FF');
    });
    
    it('여러 바이트를 공백으로 구분해야 함', () => {
      expect(bitStreamToHex('1111000010101010')).toBe('F0 AA');
      expect(bitStreamToHex('111100001010101011111111')).toBe('F0 AA FF');
    });
    
    it('불완전한 바이트는 무시해야 함', () => {
      expect(bitStreamToHex('11110000101')).toBe('F0');
      expect(bitStreamToHex('1111')).toBe('');
    });
  });
});