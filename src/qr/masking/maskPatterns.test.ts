import { describe, it, expect } from 'vitest';
import { 
  generateMaskMatrix, 
  generateAllMaskMatrices, 
  MASK_PATTERNS, 
  MASK_DESCRIPTIONS,
  type MaskPattern 
} from './maskPatterns';

describe('Mask Patterns', () => {
  describe('MASK_PATTERNS', () => {
    it('should have 8 mask pattern functions', () => {
      expect(Object.keys(MASK_PATTERNS)).toHaveLength(8);
      for (let i = 0; i < 8; i++) {
        expect(MASK_PATTERNS[i as MaskPattern]).toBeTypeOf('function');
      }
    });

    it('should correctly apply pattern 0: (i + j) mod 2 = 0', () => {
      const pattern0 = MASK_PATTERNS[0];
      expect(pattern0(0, 0)).toBe(true);  // (0+0) % 2 = 0
      expect(pattern0(0, 1)).toBe(false); // (0+1) % 2 = 1
      expect(pattern0(1, 0)).toBe(false); // (1+0) % 2 = 1
      expect(pattern0(1, 1)).toBe(true);  // (1+1) % 2 = 0
    });

    it('should correctly apply pattern 1: i mod 2 = 0', () => {
      const pattern1 = MASK_PATTERNS[1];
      expect(pattern1(0, 0)).toBe(true);  // 0 % 2 = 0
      expect(pattern1(0, 5)).toBe(true);  // 0 % 2 = 0 (col doesn't matter)
      expect(pattern1(1, 0)).toBe(false); // 1 % 2 = 1
      expect(pattern1(1, 5)).toBe(false); // 1 % 2 = 1 (col doesn't matter)
    });

    it('should correctly apply pattern 2: j mod 3 = 0', () => {
      const pattern2 = MASK_PATTERNS[2];
      expect(pattern2(0, 0)).toBe(true);  // 0 % 3 = 0
      expect(pattern2(5, 0)).toBe(true);  // 0 % 3 = 0 (row doesn't matter)
      expect(pattern2(0, 1)).toBe(false); // 1 % 3 = 1
      expect(pattern2(0, 3)).toBe(true);  // 3 % 3 = 0
    });

    it('should correctly apply pattern 3: (i + j) mod 3 = 0', () => {
      const pattern3 = MASK_PATTERNS[3];
      expect(pattern3(0, 0)).toBe(true);  // (0+0) % 3 = 0
      expect(pattern3(1, 2)).toBe(true);  // (1+2) % 3 = 0
      expect(pattern3(0, 1)).toBe(false); // (0+1) % 3 = 1
      expect(pattern3(1, 1)).toBe(false); // (1+1) % 3 = 2
    });
  });

  describe('generateMaskMatrix', () => {
    it('should generate correct sized matrix for version 1', () => {
      const maskMatrix = generateMaskMatrix(1, 0);
      expect(maskMatrix).toHaveLength(21); // 21x21 for version 1
      expect(maskMatrix[0]).toHaveLength(21);
    });

    it('should apply pattern 0 correctly to small matrix', () => {
      const maskMatrix = generateMaskMatrix(1, 0);
      
      // Check pattern 0: (i + j) mod 2 = 0
      expect(maskMatrix[0][0]).toBe(true);  // (0+0) % 2 = 0
      expect(maskMatrix[0][1]).toBe(false); // (0+1) % 2 = 1
      expect(maskMatrix[1][0]).toBe(false); // (1+0) % 2 = 1
      expect(maskMatrix[1][1]).toBe(true);  // (1+1) % 2 = 0
    });

    it('should apply pattern 1 correctly', () => {
      const maskMatrix = generateMaskMatrix(1, 1);
      
      // Check pattern 1: i mod 2 = 0
      expect(maskMatrix[0][0]).toBe(true);  // row 0: 0 % 2 = 0
      expect(maskMatrix[0][5]).toBe(true);  // row 0: 0 % 2 = 0
      expect(maskMatrix[1][0]).toBe(false); // row 1: 1 % 2 = 1
      expect(maskMatrix[1][5]).toBe(false); // row 1: 1 % 2 = 1
    });
  });

  describe('generateAllMaskMatrices', () => {
    it('should generate 8 mask matrices', () => {
      const allMasks = generateAllMaskMatrices(1);
      expect(Object.keys(allMasks)).toHaveLength(8);
      
      for (let i = 0; i < 8; i++) {
        expect(allMasks[i as MaskPattern]).toBeDefined();
        expect(allMasks[i as MaskPattern]).toHaveLength(21); // version 1 = 21x21
      }
    });

    it('should generate different patterns for each mask', () => {
      const allMasks = generateAllMaskMatrices(1);
      
      // Pattern 0 and Pattern 1 should be different at position (1,1)
      expect(allMasks[0][1][1]).not.toBe(allMasks[1][1][1]);
    });
  });

  describe('MASK_DESCRIPTIONS', () => {
    it('should have descriptions for all 8 patterns', () => {
      expect(Object.keys(MASK_DESCRIPTIONS)).toHaveLength(8);
      for (let i = 0; i < 8; i++) {
        expect(MASK_DESCRIPTIONS[i as MaskPattern]).toBeTypeOf('string');
        expect(MASK_DESCRIPTIONS[i as MaskPattern].length).toBeGreaterThan(0);
      }
    });

    it('should have correct mathematical descriptions', () => {
      expect(MASK_DESCRIPTIONS[0]).toBe('(i + j) mod 2 = 0');
      expect(MASK_DESCRIPTIONS[1]).toBe('i mod 2 = 0');
      expect(MASK_DESCRIPTIONS[2]).toBe('j mod 3 = 0');
      expect(MASK_DESCRIPTIONS[3]).toBe('(i + j) mod 3 = 0');
    });
  });

  describe('Pattern edge cases', () => {
    it('should handle large coordinates correctly', () => {
      const pattern0 = MASK_PATTERNS[0];
      expect(pattern0(100, 100)).toBe(true);  // (100+100) % 2 = 0
      expect(pattern0(100, 101)).toBe(false); // (100+101) % 2 = 1
    });

    it('should handle zero coordinates', () => {
      for (let i = 0; i < 8; i++) {
        const pattern = MASK_PATTERNS[i as MaskPattern];
        expect(typeof pattern(0, 0)).toBe('boolean');
      }
    });
  });
});