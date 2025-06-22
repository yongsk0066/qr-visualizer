import type { TriStateQR } from '../types';
import type { DecodePipelineResult } from './types';
import { extractFormatInfo } from './format-extraction/formatExtractor';
import { extractVersionInfo } from './version-extraction/versionExtractor';
import { removeMask } from './mask-removal/maskRemover';
import { readDataModules } from './data-reading/dataReader';
import { correctErrors } from './error-correction/errorCorrector';
import { extractData } from './data-extraction/dataExtractor';

/**
 * 모드 번호를 이름으로 변환
 */
const getModeName = (mode: number): string => {
  switch (mode) {
    case 0b0001: return 'numeric';
    case 0b0010: return 'alphanumeric';
    case 0b0100: return 'byte';
    case 0b1000: return 'kanji';
    default: return 'byte'; // 기본값
  }
};

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
    maskRemoval: null,
    dataReading: null,
    errorCorrection: null,
    dataExtraction: null,
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

    // Step 2: 버전 정보 추출 (v7+)
    const versionInfo = extractVersionInfo(triStateQR);
    if (!versionInfo) {
      throw new Error('버전 정보를 추출할 수 없습니다');
    }
    result.versionInfo = versionInfo;
    
    // Step 3: 마스크 패턴 제거
    const maskRemovalResult = removeMask(
      triStateQR,
      formatInfo.maskPattern,
      formatInfo.errorLevel,
      versionInfo.version
    );
    result.maskRemoval = maskRemovalResult;
    
    // Step 4: 데이터 모듈 읽기
    if (maskRemovalResult.unmaskedMatrix) {
      const dataReadingResult = readDataModules(
        maskRemovalResult.unmaskedMatrix,
        maskRemovalResult.dataModules,
        versionInfo.version as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40,
        formatInfo.errorLevel
      );
      result.dataReading = dataReadingResult;
      result.rawBitStream = dataReadingResult.bitStream;
      result.codewords = {
        dataBlocks: dataReadingResult.blockInfo.dataBlocks,
        ecBlocks: dataReadingResult.blockInfo.ecBlocks,
        totalCodewords: dataReadingResult.codewords.length
      };
    }
    
    // Step 5: 에러 정정
    if (result.dataReading && result.dataReading.codewords.length > 0) {
      try {
        const errorCorrection = correctErrors(
          result.dataReading.codewords,
          versionInfo.version as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40,
          formatInfo.errorLevel
        );
        result.errorCorrection = errorCorrection;
        
        // 정정된 데이터를 결과에 반영
        if (errorCorrection.isRecoverable) {
          result.correctedData = {
            correctedBlocks: errorCorrection.blockResults.map(b => 
              b.correctedCodewords.slice(0, result.dataReading!.blockInfo.dataBlocks[b.blockIndex].length)
            ),
            errorsCorrected: errorCorrection.totalErrors,
            isRecoverable: true
          };
        }
      } catch (error) {
        console.error('Error correction failed:', error);
      }
    }
    
    // Step 6: 데이터 추출
    // 에러 정정 실패해도 데이터 추출 시도 (정정 시도된 데이터 사용)
    if (result.errorCorrection) {
      try {
        // 항상 correctedDataCodewords 사용 (정정 성공/실패 관계없이)
        const dataExtraction = extractData(
          result.errorCorrection.correctedDataCodewords,
          versionInfo.version as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40
        );
        result.dataExtraction = dataExtraction;
        
        // 디코딩된 메시지 설정
        if (dataExtraction.isValid) {
          result.decodedMessage = dataExtraction.decodedText;
          result.segments = dataExtraction.segments.map(seg => ({
            mode: getModeName(seg.mode) as 'numeric' | 'alphanumeric' | 'byte' | 'kanji',
            data: seg.data,
            characterCount: seg.characterCount,
            bitLength: seg.endBit - seg.startBit
          }));
        }
      } catch (error) {
        console.error('Data extraction failed:', error);
      }
    }

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