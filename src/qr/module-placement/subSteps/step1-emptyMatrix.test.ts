import { describe, it, expect } from 'vitest';
import { createEmptyMatrixStep } from './step1-emptyMatrix';

describe('Step 5-1: Empty Matrix', () => {
  it('should create empty matrix for version 1', () => {
    const result = createEmptyMatrixStep(1);
    
    expect(result.matrix).toHaveLength(21);
    expect(result.matrix[0]).toHaveLength(21);
    expect(result.matrix.every(row => row.every(cell => cell === null))).toBe(true);
    expect(result.moduleTypes.every(row => row.every(type => type === 'empty'))).toBe(true);
    expect(result.stepName).toBe('5-1: Empty Matrix');
    expect(result.description).toBe('21×21 빈 매트릭스 초기화');
    expect(result.addedModules).toBe(0);
  });

  it('should create empty matrix for version 5', () => {
    const result = createEmptyMatrixStep(5);
    
    expect(result.matrix).toHaveLength(37);
    expect(result.matrix[0]).toHaveLength(37);
    expect(result.description).toBe('37×37 빈 매트릭스 초기화');
  });

  it('should create empty matrix for version 10', () => {
    const result = createEmptyMatrixStep(10);
    
    expect(result.matrix).toHaveLength(57);
    expect(result.matrix[0]).toHaveLength(57);
    expect(result.description).toBe('57×57 빈 매트릭스 초기화');
  });

  it('should create empty matrix for version 40', () => {
    const result = createEmptyMatrixStep(40);
    
    expect(result.matrix).toHaveLength(177);
    expect(result.matrix[0]).toHaveLength(177);
    expect(result.description).toBe('177×177 빈 매트릭스 초기화');
  });
});