import { describe, it, expect } from 'vitest';
import { runQRPipeline } from './qrPipeline';
import type { ErrorCorrectionLevel, QRVersion } from '../shared/types';

describe('QR Pipeline Integration Tests', () => {
  describe('Complete QR Code Generation', () => {
    it('should generate complete QR code for simple text', () => {
      const result = runQRPipeline({
        inputData: 'HELLO WORLD',
        qrVersion: '1',
        errorLevel: 'Q'
      });

      // 모든 단계가 성공적으로 완료되어야 함
      expect(result.dataAnalysis).not.toBeNull();
      expect(result.dataEncoding).not.toBeNull();
      expect(result.errorCorrection).not.toBeNull();
      expect(result.messageConstruction).not.toBeNull();
      expect(result.modulePlacement).not.toBeNull();
      expect(result.finalGeneration).not.toBeNull();

      // 최종 QR 코드가 올바른 크기여야 함
      expect(result.finalGeneration?.finalMatrix).toHaveLength(21); // 버전 1 = 21x21
      expect(result.finalGeneration?.finalMatrix[0]).toHaveLength(21);
    });

    it('should handle empty input gracefully', () => {
      const result = runQRPipeline({
        inputData: '',
        qrVersion: '1',
        errorLevel: 'L'
      });

      // 빈 입력에 대해서는 분석 결과가 null일 수 있음
      if (result.dataAnalysis) {
        expect(result.dataAnalysis.isValid).toBe(false);
      }
    });
  });

  describe('Version Coverage Tests', () => {
    const testVersions: QRVersion[] = [1, 5, 10, 15, 20, 25, 30, 35, 40];
    const testData = {
      1: 'Hi',
      5: 'Hello World!',
      10: 'A'.repeat(50),
      15: 'QR'.repeat(75),
      20: 'Test'.repeat(100),
      25: 'Data'.repeat(150),
      30: 'Long'.repeat(200),
      35: 'Very'.repeat(250),
      40: 'Maximum'.repeat(300)
    };

    testVersions.forEach(version => {
      it(`should generate QR code for version ${version}`, () => {
        const data = testData[version as keyof typeof testData];
        const result = runQRPipeline({
          inputData: data,
          qrVersion: version.toString(),
          errorLevel: 'M'
        });

        // 데이터가 요구하는 버전이 지정된 버전보다 클 수 있음 (auto-adjustment)
        expect(result.dataAnalysis?.minimumVersion).toBeGreaterThanOrEqual(1);
        expect(result.finalGeneration?.finalMatrix).toBeDefined();
        if (result.finalGeneration?.finalMatrix) {
          expect(result.finalGeneration.finalMatrix.length).toBeGreaterThanOrEqual(21);
        }
        
        // 데이터가 올바르게 처리되었는지 확인
        expect(result.dataEncoding?.bitStream).toBeDefined();
        expect(result.errorCorrection?.totalCodewords).toBeGreaterThan(0);
        expect(result.messageConstruction?.totalBits).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Correction Level Tests', () => {
    const errorLevels: ErrorCorrectionLevel[] = ['L', 'M', 'Q', 'H'];
    
    errorLevels.forEach(level => {
      it(`should generate QR code with error level ${level}`, () => {
        const result = runQRPipeline({
          inputData: 'TEST DATA FOR ERROR LEVEL',
          qrVersion: '3',
          errorLevel: level
        });

        expect(result.finalGeneration?.finalMatrix).toBeDefined();
        expect(result.errorCorrection?.totalCodewords).toBeGreaterThan(0);
        
        // 에러 정정 레벨에 따라 EC 코드워드 수가 달라져야 함
        const ecCodewords = result.errorCorrection?.ecCodewords.length || 0;
        expect(ecCodewords).toBeGreaterThan(0);
        
        // H > Q > M > L 순으로 EC 코드워드가 많아야 함 (일반적으로)
        if (level === 'H') {
          expect(ecCodewords).toBeGreaterThanOrEqual(15);
        }
      });
    });
  });

  describe('Encoding Mode Tests', () => {
    it('should handle numeric mode data', () => {
      const result = runQRPipeline({
        inputData: '1234567890',
        qrVersion: '1',
        errorLevel: 'L'
      });

      expect(result.dataAnalysis?.recommendedMode).toBe('numeric');
      expect(result.dataEncoding?.modeIndicator).toBe('0001'); // 숫자 모드
      expect(result.finalGeneration?.finalMatrix).toBeDefined();
    });

    it('should handle alphanumeric mode data', () => {
      const result = runQRPipeline({
        inputData: 'HELLO123',
        qrVersion: '1',
        errorLevel: 'L'
      });

      expect(result.dataAnalysis?.recommendedMode).toBe('alphanumeric');
      expect(result.dataEncoding?.modeIndicator).toBe('0010'); // 영숫자 모드
      expect(result.finalGeneration?.finalMatrix).toBeDefined();
    });

    it('should handle byte mode data', () => {
      const result = runQRPipeline({
        inputData: 'Hello, World!',
        qrVersion: '1',
        errorLevel: 'L'
      });

      expect(result.dataAnalysis?.recommendedMode).toBe('byte');
      expect(result.dataEncoding?.modeIndicator).toBe('0100'); // 바이트 모드
      expect(result.finalGeneration?.finalMatrix).toBeDefined();
    });
  });

  describe('Data Flow Integrity Tests', () => {
    it('should maintain data integrity across all steps', () => {
      const inputData = 'INTEGRATION TEST';
      const result = runQRPipeline({
        inputData,
        qrVersion: '2',
        errorLevel: 'M'
      });

      // Step 1 → Step 2: 분석 결과가 인코딩에 반영
      expect(result.dataAnalysis?.characterCount).toBe(inputData.length);
      expect(result.dataEncoding?.characterCount).toBeDefined();

      // Step 2 → Step 3: 인코딩된 비트가 에러 정정에 사용
      expect(result.dataEncoding?.bitStream).toBeDefined();
      expect(result.errorCorrection?.dataCodewords).toBeDefined();

      // Step 3 → Step 4: 에러 정정 결과가 메시지 구성에 사용
      expect(result.errorCorrection?.interleavedCodewords).toBeDefined();
      expect(result.messageConstruction?.finalBitStream).toBeDefined();

      // Step 4 → Step 5: 메시지가 모듈 배치에 사용
      expect(result.messageConstruction?.finalBitStream).toBeDefined();
      expect(result.modulePlacement?.finalModuleTypes).toBeDefined();

      // Step 5 → Step 6: 모듈 배치가 최종 생성에 사용
      expect(result.modulePlacement?.finalMatrix).toBeDefined();
      expect(result.finalGeneration?.finalMatrix).toBeDefined();
    });

    it('should handle version auto-adjustment', () => {
      // 버전 1에 들어가지 않는 긴 데이터
      const longData = 'A'.repeat(50);
      const result = runQRPipeline({
        inputData: longData,
        qrVersion: '1',
        errorLevel: 'L'
      });

      // 자동으로 더 높은 버전으로 조정되어야 함
      expect(result.dataAnalysis?.minimumVersion).toBeGreaterThan(1);
      expect(result.finalGeneration?.finalMatrix).toBeDefined();
    });
  });

  describe('ISO/IEC 18004 Standard Examples', () => {
    it('should generate QR code matching standard example 1', () => {
      // ISO/IEC 18004 Annex I 예제
      const result = runQRPipeline({
        inputData: '01234567',
        qrVersion: '1',
        errorLevel: 'H'
      });

      expect(result.dataAnalysis?.recommendedMode).toBe('numeric');
      expect(result.dataEncoding?.modeIndicator).toBe('0001');
      expect(result.dataEncoding?.characterCount).toBe('0000001000'); // 8문자
      expect(result.finalGeneration?.finalMatrix).toHaveLength(21);
    });

    it('should generate QR code matching standard example 2', () => {
      // 영숫자 모드 표준 예제
      const result = runQRPipeline({
        inputData: 'AC-42',
        qrVersion: '1',
        errorLevel: 'H'
      });

      expect(result.dataAnalysis?.recommendedMode).toBe('alphanumeric');
      expect(result.dataEncoding?.modeIndicator).toBe('0010');
      expect(result.dataEncoding?.characterCount).toBe('000000101'); // 5문자 (실제 9비트)
      expect(result.finalGeneration?.finalMatrix).toHaveLength(21);
    });

    it('should handle URL encoding correctly', () => {
      const result = runQRPipeline({
        inputData: 'https://example.com',
        qrVersion: '3',
        errorLevel: 'L'
      });

      expect(result.dataAnalysis?.recommendedMode).toBe('byte');
      expect(result.finalGeneration?.finalMatrix).toHaveLength(29); // 버전 3 = 29x29
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle maximum capacity data', () => {
      // 버전 40-L 최대 용량 테스트
      const maxData = 'A'.repeat(2953); // 버전 40-L 최대 영숫자 용량
      const result = runQRPipeline({
        inputData: maxData,
        qrVersion: '40',
        errorLevel: 'L'
      });

      expect(result.dataAnalysis?.isValid).toBe(true);
      expect(result.finalGeneration?.finalMatrix).toHaveLength(177); // 버전 40 = 177x177
    });

    it('should handle special characters', () => {
      const result = runQRPipeline({
        inputData: '!@#$%^&*()',
        qrVersion: '2',
        errorLevel: 'M'
      });

      expect(result.dataAnalysis?.recommendedMode).toBe('byte');
      expect(result.finalGeneration?.finalMatrix).toBeDefined();
    });

    it('should handle mixed content', () => {
      const result = runQRPipeline({
        inputData: 'ABC123def',
        qrVersion: '2',
        errorLevel: 'Q'
      });

      expect(result.dataAnalysis?.recommendedMode).toBe('byte'); // 소문자 때문에 바이트 모드
      expect(result.finalGeneration?.finalMatrix).toBeDefined();
    });
  });

  describe('Performance and Consistency', () => {
    it('should generate consistent results for same input', () => {
      const input = 'CONSISTENCY TEST';
      const params = { inputData: input, qrVersion: '2', errorLevel: 'M' as const };
      
      const result1 = runQRPipeline(params);
      const result2 = runQRPipeline(params);

      // 같은 입력에 대해 같은 결과가 나와야 함
      expect(result1.dataEncoding?.bitStream).toBe(result2.dataEncoding?.bitStream);
      expect(result1.errorCorrection?.totalCodewords).toBe(result2.errorCorrection?.totalCodewords);
      expect(result1.finalGeneration?.selectedMaskPattern).toBe(result2.finalGeneration?.selectedMaskPattern);
    });

    it('should complete within reasonable time for all versions', () => {
      const testVersions = [1, 10, 20, 30, 40];
      
      testVersions.forEach(version => {
        const start = performance.now();
        const result = runQRPipeline({
          inputData: `Performance test for version ${version}`,
          qrVersion: version.toString(),
          errorLevel: 'M'
        });
        const duration = performance.now() - start;

        expect(result.finalGeneration?.finalMatrix).toBeDefined();
        expect(duration).toBeLessThan(100); // 100ms 이내 완료
      });
    });
  });
});