/**
 * Step 7: Final QR Code Generation
 * 최종 QR 코드 생성 - 포맷/버전 정보 적용 및 마스킹
 */

import type { QRVersion, ErrorCorrectionLevel, ModulePlacementData } from '../../shared/types';
import type { MaskPattern } from '../masking/maskPatterns';
import { applyMaskToMatrix } from '../masking/penaltyCalculation';
import { generateFormatInfo, placeFormatInfo } from './formatInfo';
import { generateVersionInfo, placeVersionInfo } from './versionInfo';
import { generateAllEncodingMaskMatrices, evaluateAllMaskPatterns } from '../masking/maskPatterns';

export interface FinalQRResult {
  finalMatrix: (0 | 1 | null)[][];
  selectedMaskPattern: MaskPattern;
  formatInfo: number;
  versionInfo: number | null;
  steps: {
    step1_withSelectedMask: (0 | 1 | null)[][];
    step2_withFormatInfo: (0 | 1 | null)[][];
    step3_withVersionInfo: (0 | 1 | null)[][];
    step4_final: (0 | 1 | null)[][];
  };
}

/**
 * Step 7 파이프라인 실행 함수
 *
 * 과정:
 * 1. 마스킹 평가 및 최적 패턴 선택
 * 2. 최종 QR 코드 생성
 */
export const runFinalGeneration = (
  modulePlacement: ModulePlacementData,
  version: QRVersion,
  errorLevel: ErrorCorrectionLevel
): FinalQRResult | null => {
  if (!modulePlacement.subSteps.length) {
    return null;
  }

  const { matrix, moduleTypes } = modulePlacement.subSteps[modulePlacement.subSteps.length - 1];

  // 마스킹 평가 및 최적 패턴 선택
  const encodingMaskMatrices = generateAllEncodingMaskMatrices(version, moduleTypes);
  const evaluationResults = evaluateAllMaskPatterns(matrix, encodingMaskMatrices);
  const selectedEvaluation = evaluationResults.find((e) => e.isSelected);

  if (!selectedEvaluation) {
    return null;
  }

  const selectedMaskMatrix = encodingMaskMatrices[selectedEvaluation.pattern];

  // 최종 QR 코드 생성
  return generateFinalQR(
    matrix,
    selectedMaskMatrix,
    selectedEvaluation.pattern,
    version,
    errorLevel
  );
};

/**
 * 최종 QR 코드 생성
 *
 * 과정:
 * 1. 선택된 마스크 패턴을 인코딩 영역에 적용
 * 2. 포맷 정보 생성 및 배치
 * 3. 버전 정보 생성 및 배치 (버전 7+)
 * 4. 최종 QR 코드 완성
 */
export const generateFinalQR = (
  originalMatrix: (0 | 1 | null)[][],
  encodingMaskMatrix: boolean[][],
  selectedMaskPattern: MaskPattern,
  version: QRVersion,
  errorLevel: ErrorCorrectionLevel
): FinalQRResult => {
  // Step 1: 선택된 마스크 패턴을 인코딩 영역에 적용
  const step1_withSelectedMask = applyMaskToMatrix(originalMatrix, encodingMaskMatrix);

  // Step 2: 포맷 정보 생성 및 배치
  const formatInfo = generateFormatInfo(errorLevel, selectedMaskPattern);
  const step2_withFormatInfo = placeFormatInfo(step1_withSelectedMask, formatInfo);

  // Step 3: 버전 정보 생성 및 배치 (버전 7+ 전용)
  const versionInfo = generateVersionInfo(version);
  const step3_withVersionInfo = versionInfo
    ? placeVersionInfo(step2_withFormatInfo, version)
    : step2_withFormatInfo;

  // Step 4: 최종 완성 (추가 처리 없음, 참조용)
  const step4_final = step3_withVersionInfo.map((row) => [...row]);

  return {
    finalMatrix: step4_final,
    selectedMaskPattern,
    formatInfo,
    versionInfo,
    steps: {
      step1_withSelectedMask,
      step2_withFormatInfo,
      step3_withVersionInfo,
      step4_final,
    },
  };
};
