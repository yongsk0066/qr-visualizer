# Reed-Solomon Error Correction Testing

이 디렉토리는 QR 코드의 Reed-Solomon 에러 정정 알고리즘을 테스트하고 디버깅하기 위한 도구를 제공합니다.

## 개요

Reed-Solomon은 QR 코드의 핵심 에러 정정 알고리즘입니다. 이 테스트 도구를 사용하면:

1. 알고리즘의 정확성 검증
2. 에러 정정 능력의 한계 테스트
3. 실제 QR 데이터의 에러 분석
4. 성능 측정 및 최적화

## 파일 구조

- `reed-solomon-tester.ts` - 핵심 테스트 유틸리티
- `example-usage.ts` - 사용 예제
- `README.md` - 이 문서

## 사용법

### 1. 인위적 에러 테스트

```typescript
import { testWithArtificialErrors, printTestResult } from './reed-solomon-tester';

// Version 7, Error Level Q 데이터에 10개 에러 생성
const result = testWithArtificialErrors(originalCodewords, 10, 7, 'Q');
printTestResult(result);
```

### 2. 실제 데이터 분석

```typescript
import { analyzeAndCorrectErrors } from './reed-solomon-tester';

// 원본과 검출된 데이터 비교 및 정정
const result = analyzeAndCorrectErrors(original, detected, 7, 'H');
```

### 3. 성능 벤치마크

```typescript
import { benchmarkReedSolomon } from './reed-solomon-tester';

// 100번 반복하여 평균 실행 시간 측정
const avgTime = benchmarkReedSolomon(codewords, 7, 'H', 100);
```

## Reed-Solomon 알고리즘 이해

### 에러 정정 능력

각 에러 정정 레벨별 복구 능력:
- **Level L**: ~7% 손상 복구
- **Level M**: ~15% 손상 복구
- **Level Q**: ~25% 손상 복구
- **Level H**: ~30% 손상 복구

### 블록 구조

QR 코드는 여러 블록으로 나뉘며, 각 블록은 독립적으로 에러 정정됩니다:
- 각 블록 = 데이터 코드워드 + EC(Error Correction) 코드워드
- 최대 정정 가능 에러 = floor(EC 코드워드 / 2)

### 위치 시스템

⚠️ **중요**: Reed-Solomon에서 위치는 **오른쪽부터** 셉니다:
- 배열 인덱스 0 (왼쪽 첫 번째) = RS 위치 31 (32크기 블록의 경우)
- 배열 인덱스 31 (왼쪽 마지막) = RS 위치 0

## 일반적인 문제 해결

### 1. "Too many errors" 오류

블록의 에러가 정정 한계를 초과했습니다. 예:
- EC 코드워드 28개 → 최대 14개 에러 정정 가능
- 15개 이상 에러 → 정정 불가능

### 2. 낮은 신뢰도

일부 블록만 정정에 성공한 경우입니다. 전체 데이터 복구는 모든 블록이 성공해야 합니다.

### 3. 위치 불일치

디버깅 시 RS 위치와 배열 인덱스의 차이를 주의하세요:
```
배열 인덱스 = 블록 길이 - 1 - RS 위치
```

## 실행 예제

```bash
# 예제 실행
npx tsx src/qr-decode/decode/error-correction/test/example-usage.ts
```

## 테스트 시나리오

### 기본 테스트
1. 에러 없는 완벽한 데이터
2. 단일 에러 (1개)
3. 소량 에러 (2-5개)
4. 중간 에러 (블록당 한계의 50%)
5. 한계 근처 에러 (블록당 한계의 90%)
6. 한계 초과 에러

### 스트레스 테스트
1. 모든 블록에 균등 분포 에러
2. 특정 블록에 집중된 에러
3. 버스트 에러 (연속된 위치)
4. 랜덤 분포 에러

## 알고리즘 상세

### 1. 신드롬 계산
```
S_i = r(α^i) for i = 0 to ecCodewordCount-1
```
모든 신드롬이 0이면 에러 없음

### 2. Berlekamp-Massey
에러 위치 다항식 Λ(x) 계산

### 3. Chien Search
Λ(α^(-i)) = 0인 위치 i 찾기

### 4. Forney Algorithm
에러 크기 계산

### 5. 에러 정정
```
corrected[pos] = detected[pos] XOR errorMagnitude
```

## 참고 자료

- ISO/IEC 18004 - QR Code specification
- Reed-Solomon Codes and Their Applications (IEEE Press)
- Error Control Coding (Shu Lin, Daniel J. Costello)