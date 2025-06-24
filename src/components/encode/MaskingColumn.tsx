import { useMemo } from 'react';
import type { ModulePlacementData } from '../../shared/types';
import { t } from '../../i18n';
import {
  generateAllMaskMatrices,
  generateAllEncodingMaskMatrices,
  evaluateAllMaskPatterns,
  MASK_DESCRIPTIONS,
  type MaskPattern,
  type MaskEvaluationResult,
} from '../../qr-encode/masking/maskPatterns';

interface MaskingColumnProps {
  modulePlacement: ModulePlacementData | null;
}

interface QRMatrixProps {
  matrix: (0 | 1 | null)[][];
  maskMatrix: boolean[][];
  size: number;
  scale?: number;
  pattern: MaskPattern;
  title: string;
  isXorResult?: boolean;
}

const QRMatrix = ({
  matrix,
  maskMatrix,
  size,
  scale = 2,
  pattern,
  title,
  isXorResult = false,
}: QRMatrixProps) => {
  const getModuleColor = (row: number, col: number) => {
    if (isXorResult) {
      // XOR 결과: 원본 매트릭스와 마스크를 XOR한 결과
      const originalValue = matrix[row][col];
      const shouldMask = maskMatrix[row][col];

      if (originalValue === null) {
        return '#f8f9fa'; // 빈 공간
      }

      // XOR 연산: 마스킹이 적용되면 비트를 뒤집음
      const resultValue = shouldMask ? 1 - originalValue : originalValue;
      return resultValue === 1 ? '#000' : '#fff';
    } else {
      // 마스크 패턴만 표시 (기존 로직)
      const shouldMask = maskMatrix[row][col];
      return shouldMask ? '#000' : '#fff';
    }
  };

  // 매트릭스 크기 안전성 체크
  if (!matrix || !maskMatrix || matrix.length === 0 || maskMatrix.length === 0) {
    return <div className="text-red-500 text-sm p-2">{t('masking.matrixDataError')}</div>;
  }

  return (
    <div className="flex flex-col items-center">
      <div className="mb-1 text-center">
        <div className="text-xs font-medium">{title}</div>
        <div className="text-xs text-gray-600 font-mono text-[10px]">
          {t('masking.formula')}: {MASK_DESCRIPTIONS[pattern]}
        </div>
      </div>
      <div className="border border-gray-200 inline-block bg-white">
        <svg
          width={size * scale}
          height={size * scale}
          viewBox={`0 0 ${size} ${size}`}
          style={{ display: 'block' }}
        >
          {/* 배경 */}
          <rect width={size} height={size} fill="white" />

          {/* 모듈별 rect */}
          {matrix.map((row, rowIndex) =>
            row.map((_, colIndex) => {
              return (
                <rect
                  key={`${rowIndex}-${colIndex}`}
                  x={colIndex}
                  y={rowIndex}
                  width={1}
                  height={1}
                  fill={getModuleColor(rowIndex, colIndex)}
                  stroke={size <= 25 ? 'rgba(0,0,0,0.1)' : 'none'}
                  strokeWidth={size <= 25 ? '0.02' : '0'}
                />
              );
            })
          )}
        </svg>
      </div>
    </div>
  );
};

const PenaltyScoreDisplay = ({ evaluation }: { evaluation: MaskEvaluationResult }) => {
  const { penaltyScore, isSelected } = evaluation;

  return (
    <div
      className={`p-2 rounded border min-w-[100px] ${
        isSelected ? 'bg-white border-green-400' : 'bg-white border-gray-200'
      }`}
    >
      {isSelected && (
        <div className="text-xs font-bold text-green-700 mb-1 text-center">✓ {t('masking.selected')}</div>
      )}
      <div className="text-xs space-y-0.5">
        <div className="font-medium text-center">{t('masking.penaltyScore')}</div>
        <div className="space-y-0.5 text-[10px]">
          <div>N₁: {penaltyScore.penalty1}</div>
          <div>N₂: {penaltyScore.penalty2}</div>
          <div>N₃: {penaltyScore.penalty3}</div>
          <div>N₄: {penaltyScore.penalty4}</div>
        </div>
        <div
          className={`text-xs font-medium pt-0.5 border-t text-center ${
            isSelected ? 'text-green-700' : 'text-gray-700'
          }`}
        >
          {t('common.total')}: {penaltyScore.total}
        </div>
      </div>
    </div>
  );
};

export const MaskingColumn = ({ modulePlacement }: MaskingColumnProps) => {
  // useMemo를 컴포넌트 상단으로 이동 (조건부 호출 방지)
  const scale = useMemo(() => {
    if (!modulePlacement) return 3;
    const size = modulePlacement.size;
    if (size <= 21) return 8; // 버전 1
    if (size <= 29) return 6; // 버전 2-3
    if (size <= 41) return 5; // 버전 4-6
    if (size <= 57) return 4; // 버전 7-10
    return 3; // 버전 11+
  }, [modulePlacement]);

  if (!modulePlacement || !modulePlacement.subSteps || modulePlacement.subSteps.length === 0) {
    return (
      <div className="step-column">
        <h2 className="font-medium mb-3">{t('steps.encode.masking')}</h2>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {t('masking.evaluatingDescription')}
          </p>
          
          <div className="p-8 bg-gray-50 rounded text-center">
            <div className="text-gray-400 text-3xl mb-2">🎭</div>
            <div className="text-gray-500 text-sm">{t('masking.willDisplayAfterPlacement')}</div>
          </div>
        </div>
      </div>
    );
  }

  // 최종 매트릭스 가져오기 (Step 5-7 완료본)
  const finalStep = modulePlacement.subSteps[modulePlacement.subSteps.length - 1];
  if (!finalStep || !finalStep.matrix) {
    return (
      <div className="step-column">
        <h2 className="font-medium mb-3">{t('steps.encode.masking')}</h2>
        <div className="text-gray-500 text-sm">{t('ui.loading')}...</div>
      </div>
    );
  }

  const { matrix, moduleTypes } = finalStep;
  const { size } = modulePlacement;

  // 8가지 마스크 매트릭스 생성 (전체 패턴)
  const maskMatrices = generateAllMaskMatrices(modulePlacement.version);

  // 8가지 인코딩 영역 마스크 매트릭스 생성 (필터링된 패턴)
  const encodingMaskMatrices = generateAllEncodingMaskMatrices(
    modulePlacement.version,
    moduleTypes
  );

  // 모든 마스크 패턴 평가 및 최적 패턴 선택
  const evaluationResults = evaluateAllMaskPatterns(matrix, encodingMaskMatrices);

  return (
    <div className="step-column">
      <h2 className="font-medium mb-3">{t('steps.encode.masking')}</h2>
      <p className="text-sm text-gray-600 mb-4">{t('masking.evaluatingDescription')}</p>

      <div className="space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto overflow-x-auto">
        {evaluationResults.map((evaluation) => {
          const pattern = evaluation.pattern;
          const maskMatrix = maskMatrices[pattern];
          const encodingMaskMatrix = encodingMaskMatrices[pattern];

          // 추가 안전성 체크
          if (!maskMatrix || !Array.isArray(maskMatrix) || !encodingMaskMatrix) {
            return (
              <div key={pattern} className="text-red-500 text-sm p-2">
                {t('masking.pattern')} {pattern}: {t('masking.matrixDataError')}
              </div>
            );
          }

          return (
            <div key={pattern} className="space-y-3">
              <div className="text-center">
                <div
                  className={`text-sm font-bold px-3 py-1 rounded-md inline-block ${
                    evaluation.isSelected
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-600 text-white'
                  }`}
                >
                  {t('masking.pattern')} {pattern}
                </div>
              </div>

              <div
                className={`flex justify-center gap-10 min-w-max p-3 rounded-lg transition-all ${
                  evaluation.isSelected
                    ? 'bg-green-50 border-2 border-green-400 shadow-md'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <QRMatrix
                  matrix={matrix}
                  maskMatrix={maskMatrix}
                  size={size}
                  scale={scale}
                  pattern={pattern}
                  title={t('masking.fullPattern')}
                />

                <QRMatrix
                  matrix={matrix}
                  maskMatrix={encodingMaskMatrix}
                  size={size}
                  scale={scale}
                  pattern={pattern}
                  title={t('masking.encodingRegionOnly')}
                />

                <QRMatrix
                  matrix={matrix}
                  maskMatrix={encodingMaskMatrix}
                  size={size}
                  scale={scale}
                  pattern={pattern}
                  title={t('masking.xorResult')}
                  isXorResult={true}
                />

                <PenaltyScoreDisplay evaluation={evaluation} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="mt-4 p-2 bg-gray-50 rounded text-xs">
        <div className="font-medium mb-1">{t('masking.evaluationSteps.title')}</div>
        <div className="space-y-1">
          <div>
            <strong>{t('masking.fullPattern')}:</strong> {t('masking.evaluationSteps.fullPatternDesc')}
          </div>
          <div>
            <strong>{t('masking.encodingRegionOnly')}:</strong> {t('masking.evaluationSteps.encodingRegionDesc')}
          </div>
          <div>
            <strong>{t('masking.xorResult')}:</strong> {t('masking.evaluationSteps.xorResultDesc')}
          </div>
          <div>
            <strong>{t('masking.penaltyScore')}:</strong> {t('masking.evaluationSteps.penaltyScoreDesc')}
          </div>
        </div>
        <div className="mt-2 space-y-1">
          <div className="text-gray-700">
            <div>
              <strong>N₁:</strong> {t('masking.evaluationSteps.step1')}
            </div>
            <div>
              <strong>N₂:</strong> {t('masking.evaluationSteps.step2')}
            </div>
            <div>
              <strong>N₃:</strong> {t('masking.evaluationSteps.step3')}
            </div>
            <div>
              <strong>N₄:</strong> {t('masking.evaluationSteps.step4')}
            </div>
          </div>
        </div>
        <div className="mt-2 p-1 bg-green-100 rounded">
          <div className="text-green-700 font-medium">
            {t('masking.evaluationSteps.bestPatternNote')}
          </div>
        </div>
      </div>
    </div>
  );
};
