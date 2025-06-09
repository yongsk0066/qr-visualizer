# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QR Decompile is an **educational React-based web application** designed to demonstrate the step-by-step process of QR code generation. This is NOT just a QR code generator, but a learning tool to understand how QR codes are constructed.

**Primary Goal**: To visualize and understand each stage of QR code creation process sequentially, following the ISO/IEC 18004 standard.

### Learning Objectives (All Complete ✅):
1. **Step 1: Data Analysis** ✅ - Understand optimal encoding mode selection
2. **Step 2: Data Encoding** ✅ - Learn bit stream conversion by mode
3. **Step 3: Error Correction** ✅ - Implement Reed-Solomon error correction
4. **Step 4: Message Construction** ✅ - Data and error correction interleaving
5. **Step 5: Module Placement** ✅ - Matrix layout with patterns and data
6. **Step 6: Masking** ✅ - Optimal mask pattern application
7. **Step 7: Final Generation** ✅ - Complete QR code with format/version info

Each step's results are displayed in real-time to help users understand the QR code standard (ISO/IEC 18004) principles.

## Development Commands

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Build for production
yarn build

# Run linting
yarn lint

# Run tests
yarn test

# Run TypeScript type checking
yarn tsc --build

# Preview production build
yarn preview
```

## Tech Stack & Architecture

- **Frontend**: React 19.1.0 with TypeScript
- **Build Tool**: Vite with experimental React Compiler
- **Styling**: Tailwind CSS 4.1.8 with compact, responsive design
- **Package Manager**: Yarn Berry (4.9.2) with node-modules linker
- **Utilities**: @mobily/ts-belt for functional programming utilities
- **Testing**: Vitest 3.2.2 with comprehensive test coverage

## Key Configuration Notes

1. **TypeScript**: Strict mode enabled, ES2020 target, React JSX transform
2. **Vite Config**: React plugin with experimental React Compiler and Tailwind CSS integration
3. **CSS**: Minimal reset CSS with Tailwind loaded last for proper style precedence

## Project Structure

The main application entry point is `src/main.tsx`, which renders `src/App.tsx`.

### QR Code Module Structure

```
src/
├── qr/
│   ├── analysis/            # 1단계: 데이터 분석
│   │   ├── dataAnalysis.ts      # 모드 선택, 버전 계산
│   │   └── dataAnalysis.test.ts # 39개 테스트
│   ├── encoding/            # 2단계: 데이터 인코딩
│   │   ├── dataEncoding.ts      # 모드별 인코딩, 비트 스트림 생성
│   │   └── dataEncoding.test.ts # 20개 테스트
│   ├── error-correction/    # 3단계: 에러 정정 (잔여 비트 정보 포함)
│   │   ├── errorCorrection.ts   # Reed-Solomon 알고리즘, 인터리빙
│   │   ├── ecBlocksTable.ts     # 전체 40버전 EC 블록 테이블
│   │   ├── types.ts            # 에러 정정 관련 타입 정의
│   │   ├── utils.ts            # 코드워드 변환, 인터리빙 유틸
│   │   ├── reed-solomon/       # Reed-Solomon 구현
│   │   │   ├── galoisField.ts  # GF(256) 갈루아 필드 연산
│   │   │   └── reedSolomon.ts  # Reed-Solomon 다항식 연산
│   │   └── errorCorrection.test.ts # 34개 테스트
│   ├── message-construction/ # 4단계: 최종 비트스트림 구성
│   │   ├── messageConstruction.ts   # 비트스트림 변환, 잔여 비트 추가
│   │   └── messageConstruction.test.ts # 9개 테스트
│   ├── module-placement/    # 5단계: 모듈 배치 (8개 세부 단계)
│   │   ├── modulePlacement.ts       # 모듈 배치 메인 함수
│   │   ├── modulePlacement.test.ts  # 10개 테스트
│   │   ├── types.ts                # 모듈 배치 관련 타입 정의
│   │   ├── subSteps/               # 8개 세부 단계
│   │   │   ├── step1-emptyMatrix.ts    # 빈 매트릭스 생성
│   │   │   ├── step2-finderPatterns.ts # 파인더 패턴 배치
│   │   │   ├── step3-separators.ts     # 분리자 패턴 배치
│   │   │   ├── step4-timingPatterns.ts # 타이밍 패턴 배치
│   │   │   ├── step5-alignmentPatterns.ts # 얼라인먼트 패턴 배치
│   │   │   ├── step6-formatInfo.ts     # 포맷/버전 정보 영역 예약
│   │   │   ├── step6a-zigzagPattern.ts # 지그재그 패턴 시각화
│   │   │   ├── step7-dataPlacement.ts  # 데이터 비트 배치
│   │   │   └── (각 파일별 테스트 코드)
│   │   └── utils/                  # 유틸리티 함수
│   │       ├── matrixUtils.ts      # 매트릭스 조작 함수
│   │       ├── constants.ts        # 상수 정의
│   │       ├── bchUtils.ts         # BCH 에러 정정 유틸
│   │       └── bchUtils.test.ts    # 13개 BCH 테스트
│   ├── masking/             # 6단계: 마스킹 패턴 적용
│   │   ├── maskPatterns.ts         # 8가지 마스크 패턴 함수, 평가 시스템
│   │   ├── penaltyCalculation.ts   # ISO/IEC 18004 패널티 계산 (N₁~N₄)
│   │   └── maskPatterns.test.ts    # 27개 마스크 패턴 테스트
│   ├── final-generation/    # 7단계: 최종 QR 코드 생성
│   │   ├── finalGeneration.ts      # 최종 생성 파이프라인 (마스킹→포맷→버전→완성)
│   │   ├── formatInfo.ts           # 15비트 BCH 포맷 정보 생성/배치
│   │   └── versionInfo.ts          # 18비트 BCH 버전 정보 생성/배치 (버전7+)
│   └── qrPipeline.ts       # 전체 파이프라인 통합
└── shared/                 # 전역 공유 모듈
    ├── types.ts           # QR 관련 타입 정의
    ├── constants/         # 상수 모듈
    │   ├── consts.ts      # QR 상수 (모드, 용량, 갈루아 필드)
    │   └── index.ts       # 상수 export
    ├── utils/             # 유틸리티 모듈
    │   ├── binary.ts      # 바이너리 유틸리티
    │   ├── string.ts      # 문자열 유틸리티
    │   └── index.ts       # 유틸리티 export
    ├── hooks/             # React 훅 모듈
    │   ├── useQueryParams.ts # URL 쿼리 파라미터 훅
    │   └── index.ts       # 훅 export
    └── index.ts           # 전체 통합 export
```

### Current Implementation Status

#### ✅ Completed Features

**Step 1 - Data Analysis**
- Character type detection (numeric/alphanumeric/byte/kanji)
- Optimal mode selection with capacity-based recommendations
- Version calculation for minimum QR requirements
- **Auto-version update**: Automatically adjusts QR version when input requires higher version
- Real-time analysis UI with live feedback
- Data size validation and overflow detection

**Step 2 - Data Encoding**
- **Mode-specific encoding**: Numeric, alphanumeric, byte modes (kanji placeholder)
- **ISO/IEC 18004 compliant**: Follows standard encoding rules precisely
- **Pipeline architecture**: Functional composition with ts-belt for clear data flow
- **Comprehensive testing**: 20 vitest tests covering all encoding scenarios
- **Bit stream generation**: Mode indicators, character counts, terminators, padding
- **Visual feedback**: Color-coded bit stream viewer with segment highlighting

**Step 3 - Error Correction**
- **Reed-Solomon algorithm**: Complete GF(256) Galois field implementation with GaloisField256 class
- **ISO/IEC 18004 compliant**: Follows standard error correction procedures precisely
- **Block structure support**: Handles all 40 QR versions with multiple block groups
- **Comprehensive testing**: 34 vitest tests covering Reed-Solomon and interleaving algorithms
- **Visual feedback**: Color-coded final codewords distinguishing data vs error correction
- **Polynomial operations**: Generator polynomial creation and division algorithms
- **Interleaving**: Proper data and EC block interleaving for transmission order
- **Modular architecture**: Separated into types.ts, utils.ts, and reed-solomon subfolder
- **Remainder bits integration**: Calculates and includes remainder bit information

**Step 4 - Message Construction**
- **Final bit stream generation**: Converts interleaved codewords to complete bit stream
- **Remainder bits addition**: Appends actual remainder bits (all zeros) to complete the message
- **ISO/IEC 18004 compliant**: Follows standard message construction procedures
- **Comprehensive testing**: 9 vitest tests covering bit stream scenarios
- **Visual feedback**: Color-coded final bit stream distinguishing data/EC/remainder bits
- **Bit stream formatting**: 8-bit grouping for clear visualization

**Step 5 - Module Placement**
- **8-step visual breakdown**: Function patterns, separators, timing, alignment, format, zigzag, data
- **SVG-based rendering**: Vector graphics for crisp visualization and improved performance
- **Horizontal scrolling**: Progressive visualization showing cumulative module placement
- **ISO/IEC 18004 compliant**: Precise bit positioning for format/version information
- **Special visualization**: Rainbow-colored 8-bit blocks in zigzag step for clarity
- **Comprehensive testing**: 77 vitest tests covering all placement algorithms
- **BCH error correction**: Proper format and version information area calculation
- **Dark module placement**: Automatic dark module at (4V+9, 8) position

**Step 6 - Masking**
- **8 mask patterns**: All ISO/IEC 18004 standard masking formulas (patterns 0-7)
- **4-stage visualization**: Full pattern → Encoding region → XOR result → Penalty evaluation
- **Encoding region filtering**: Data area only masking per ISO/IEC 18004 standard
- **XOR operation**: Real masking application with bit inversion visualization
- **Penalty calculation**: Complete 4-criteria evaluation (N₁, N₂, N₃, N₄) system
- **Automatic selection**: Lowest penalty score pattern selection with visual highlighting
- **Comprehensive testing**: 27 vitest tests covering all mask pattern algorithms
- **SVG-based rendering**: Consistent vector graphics with other QR components

**Step 7 - Final QR Code Generation**
- **Complete QR pipeline**: End-to-end generation from input text to scannable QR code
- **Format information**: 15-bit BCH(15,5) encoding for error level + mask pattern
- **Version information**: 18-bit BCH(18,6) encoding for versions 7-40 (dual placement)
- **4-stage visualization**: Masking → Format info → Version info → Final QR
- **BCH error correction**: Proper implementation following ISO/IEC 18004 polynomial specifications
- **Dual placement strategy**: Format info around finder patterns, version info in corners
- **Color-coded visualization**: Highlighted format/version areas with binary information display
- **ISO/IEC 18004 compliance**: Exact standard positioning and bit ordering
- **Responsive scaling**: Adaptive QR matrix size for optimal viewing across versions
- **Complete integration**: Seamless connection with all previous steps

**Architecture & UI/UX**
- **6-column responsive layout**: Uniform grid with 320px minimum width per column
- **Consistent styling**: All columns follow identical design patterns and transitions
- **SVG-based QR matrices**: Vector graphics for optimal performance and clarity
- **URL query parameters**: Shareable links with data/version/error settings (?data=X&version=Y&error=Z)
- **Performance optimization**: useDeferredValue for smooth typing experience
- **Component-based UI**: Modular column layout for each processing step
- **QR Pipeline**: Centralized pipeline for step-by-step QR generation
- **Shared utilities**: Reusable binary and string manipulation functions
- **Sample data integration**: Quick-access buttons for testing different encoding modes
- **Type safety**: Comprehensive TypeScript types and interfaces

#### ✅ Complete Implementation:
All 7 steps of QR code generation are now fully implemented with comprehensive testing and visualization!

#### 🏗 Application Structure:
- **QR Pipeline**: `src/qr/qrPipeline.ts` - Centralized processing pipeline
- **Step Modules**: Each QR step organized in dedicated folders with tests
- **Shared Resources**: Common types, constants, and utilities in `shared/`
- **Components**: `src/components/` - Step-specific UI components
- **Global Utils**: `src/shared/` - Reusable binary and string manipulation utilities
- **UI Layout**: 7-column grid with compact spacing and responsive design
- **Testing**: 185 comprehensive tests across all modules (39 analysis + 20 encoding + 34 error correction + 9 message construction + 77 module placement + 14 masking)

## QR Code Standard Documentation

The Korean QR code standard documentation is available for local reference:
- Check the `.docs/` directory for ISO/IEC 18004 standard documents
- Contains original PDF, converted Markdown, and navigation index
- Use these files for implementation reference and compliance verification

Key sections for implementation:
- Section 8: Complete encoding process
- Data analysis and mode selection
- Error correction algorithms 
- Module placement and masking
- Format and version information

## Code Style Guidelines

This project follows specific coding practices to maintain consistency and readability:

1. **Functional Programming Style**: Prefer functional programming patterns using @mobily/ts-belt utilities
2. **Pipeline Architecture**: Use pipe() for clear data transformation flows
3. **Declarative Code**: Write declarative, easy-to-understand code over imperative alternatives
4. **Type Safety**: Avoid `any` types, use proper TypeScript typing throughout
5. **Component Separation**: Extract reusable UI components with clear props interfaces
6. **Module Organization**: Step-based folder structure with clear separation of concerns
7. **Shared Utilities**: Move reusable functions to appropriate shared directories
8. **Minimal Comments**: Code should be self-documenting; avoid excessive commenting unless documenting complex algorithms
9. **Immutable Data**: Prefer immutable data structures and pure functions
10. **Testing**: Write comprehensive tests for all QR logic functions (362 tests total)
11. **ISO Compliance**: Follow ISO/IEC 18004 standard with detailed comments referencing specific sections

## Development Workflow

**Educational Approach**: Each QR generation step should be implemented incrementally with clear visualization of intermediate results. Users should be able to:

1. See the input and output of each step
2. Understand why each transformation occurs
3. Observe how changes in input affect each step
4. Learn the QR standard through interactive exploration


## Implementation Priority

Focus on **step-by-step educational value** over optimization:
1. Clear separation of each QR generation step
2. Intermediate result visualization
3. Real-time feedback and validation
4. Educational explanations for each transformation
5. Interactive exploration of parameter changes