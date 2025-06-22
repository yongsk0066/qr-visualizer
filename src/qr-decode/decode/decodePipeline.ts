import type { TriStateQR } from '../types';
import type { DecodePipelineResult } from './types';
import { extractFormatInfo } from './format-extraction/formatExtractor';

/**
 * QR 디코드 파이프라인
 * tri-state 매트릭스를 입력받아 원본 메시지를 추출
 */
export const runDecodePipeline = async (
  triStateQR: TriStateQR
): Promise<DecodePipelineResult> => {
  const result: DecodePipelineResult = {
    formatInfo: null,
    versionInfo: null,
    unmaskedMatrix: null,
    rawBitStream: null,
    codewords: null,
    correctedData: null,
    segments: null,
    decodedMessage: null,
  };

  try {
    // Step 1: 포맷 정보 추출
    const formatInfo = extractFormatInfo(triStateQR);
    if (!formatInfo) {
      throw new Error('포맷 정보를 추출할 수 없습니다');
    }
    result.formatInfo = formatInfo;

    // TODO: Step 2: 버전 정보 추출 (v7+)
    
    // TODO: Step 3: 마스크 패턴 제거
    
    // TODO: Step 4: 데이터 모듈 읽기
    
    // TODO: Step 5: 에러 정정
    
    // TODO: Step 6: 데이터 디코딩

    // 임시로 더미 메시지 반환
    result.decodedMessage = "디코딩 구현 중...";

  } catch (error) {
    result.error = {
      step: 'decode',
      message: error instanceof Error ? error.message : '알 수 없는 에러',
      details: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : { error: String(error) },
    };
  }

  return result;
};