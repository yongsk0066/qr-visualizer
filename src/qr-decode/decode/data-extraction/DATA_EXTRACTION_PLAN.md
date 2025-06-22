# QR Code Decode Step 6: Data Extraction (데이터 추출)

## 개요
에러 정정이 완료된 코드워드에서 실제 데이터를 추출하고 해석하는 단계입니다.
ISO/IEC 18004 Section 7.4에 따라 비트 스트림을 파싱하고 원본 데이터를 복원합니다.

## 주요 목표
1. 모드 지시자 식별 (Mode Indicator)
2. 문자 개수 지시자 읽기 (Character Count Indicator)
3. 모드별 데이터 디코딩 (Data Decoding)
4. 종료 패턴 및 패딩 처리
5. 최종 텍스트/바이너리 데이터 복원

## 구현 계획

### 1. 비트 스트림 변환
```typescript
interface BitStream {
  bits: number[];  // 0 또는 1의 배열
  position: number;  // 현재 읽기 위치
}

// 코드워드를 비트 스트림으로 변환
function codewordsToBitStream(codewords: number[]): BitStream
```

### 2. 모드 지시자 읽기
```typescript
enum Mode {
  NUMERIC = 0b0001,      // 4비트: 0001
  ALPHANUMERIC = 0b0010, // 4비트: 0010
  BYTE = 0b0100,        // 4비트: 0100
  KANJI = 0b1000,       // 4비트: 1000
  ECI = 0b0111,         // 4비트: 0111
  TERMINATOR = 0b0000    // 4비트: 0000
}

function readModeIndicator(bitStream: BitStream): Mode | null
```

### 3. 문자 개수 지시자 읽기
```typescript
// 버전별 문자 개수 지시자 비트 수
const CHARACTER_COUNT_BITS = {
  NUMERIC: { 1: 10, 10: 12, 27: 14 },      // v1-9: 10, v10-26: 12, v27-40: 14
  ALPHANUMERIC: { 1: 9, 10: 11, 27: 13 }, // v1-9: 9, v10-26: 11, v27-40: 13
  BYTE: { 1: 8, 10: 16, 27: 16 },         // v1-9: 8, v10-26: 16, v27-40: 16
  KANJI: { 1: 8, 10: 10, 27: 12 }         // v1-9: 8, v10-26: 10, v27-40: 12
};

function readCharacterCount(bitStream: BitStream, mode: Mode, version: number): number
```

### 4. 데이터 세그먼트 디코딩
```typescript
interface DataSegment {
  mode: Mode;
  characterCount: number;
  data: string | Uint8Array;
}

// 숫자 모드 디코딩 (3자리씩 10비트, 2자리는 7비트, 1자리는 4비트)
function decodeNumeric(bitStream: BitStream, count: number): string

// 영숫자 모드 디코딩 (2문자씩 11비트, 1문자는 6비트)
function decodeAlphanumeric(bitStream: BitStream, count: number): string

// 바이트 모드 디코딩 (1문자당 8비트)
function decodeByte(bitStream: BitStream, count: number): Uint8Array

// 한자 모드 디코딩 (1문자당 13비트)
function decodeKanji(bitStream: BitStream, count: number): string
```

### 5. 전체 데이터 추출 파이프라인
```typescript
interface DataExtractionResult {
  /** 추출된 데이터 세그먼트들 */
  segments: DataSegment[];
  /** 최종 디코딩된 텍스트 */
  decodedText: string;
  /** 사용된 총 비트 수 */
  bitsUsed: number;
  /** 패딩 비트 수 */
  paddingBits: number;
  /** 디코딩 성공 여부 */
  isValid: boolean;
  /** 에러 메시지 (실패 시) */
  errorMessage?: string;
}

function extractData(
  correctedDataCodewords: number[],
  version: QRVersion
): DataExtractionResult
```

## 구현 상세

### 숫자 모드 디코딩
- 3자리씩 그룹: 10비트로 인코딩 (000-999)
- 2자리 그룹: 7비트로 인코딩 (00-99)
- 1자리: 4비트로 인코딩 (0-9)

### 영숫자 모드 디코딩
- 2문자씩 그룹: 11비트로 인코딩 (첫 문자 × 45 + 두 번째 문자)
- 1문자: 6비트로 인코딩
- 문자 테이블: 0-9, A-Z, 공백, $%*+-./:

### 바이트 모드 디코딩
- 각 바이트를 8비트로 직접 인코딩
- UTF-8, Shift-JIS 등 인코딩 지원

### 종료 및 패딩 처리
1. 종료 패턴 (0000) 확인
2. 바이트 경계까지 0 패딩
3. 패딩 바이트 (11101100, 00010001) 확인

## UI 구성 계획

### DataExtractionColumn 컴포넌트
1. **비트 스트림 뷰어**
   - 전체 비트 스트림 표시
   - 세그먼트별 색상 구분
   - 현재 읽기 위치 표시

2. **세그먼트 분석**
   - 각 세그먼트별 상세 정보
   - 모드, 문자 수, 데이터 표시
   - 비트 사용량 시각화

3. **디코딩 결과**
   - 최종 추출된 텍스트/데이터
   - 인코딩 정보
   - 검증 결과

4. **디버깅 정보**
   - 패딩 분석
   - 종료 패턴 위치
   - 사용/미사용 비트 통계

## 테스트 계획

### 단위 테스트
1. 각 모드별 디코딩 함수 테스트
2. 문자 개수 지시자 읽기 테스트
3. 비트 스트림 조작 테스트
4. 패딩 처리 테스트

### 통합 테스트
1. 실제 QR 코드 데이터 디코딩
2. 다중 세그먼트 처리
3. 에러 케이스 처리
4. 버전별 호환성 테스트

## 예상 구현 순서
1. `BitStream` 클래스 구현
2. 모드 지시자 읽기 함수
3. 문자 개수 지시자 읽기 함수
4. 각 모드별 디코딩 함수 (Numeric → Alphanumeric → Byte → Kanji)
5. 전체 추출 파이프라인
6. UI 컴포넌트
7. 테스트 작성

## 참고 사항
- ISO/IEC 18004 Section 7.4 참조
- 한국어 표준 문서의 데이터 디코딩 섹션 확인
- 실제 QR 코드 예제로 검증 필요
- ECI 모드는 추후 확장 구현