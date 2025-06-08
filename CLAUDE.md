# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QR Decompile is an **educational React-based web application** designed to demonstrate the step-by-step process of QR code generation. This is NOT just a QR code generator, but a learning tool to understand how QR codes are constructed.

**Primary Goal**: To visualize and understand each stage of QR code creation process sequentially, following the ISO/IEC 18004 standard.

### Learning Objectives:
1. **Step 1: Data Analysis** - Understand optimal encoding mode selection
2. **Step 2: Data Encoding** - Learn bit stream conversion by mode
3. **Step 3: Error Correction** - Implement Reed-Solomon error correction
4. **Step 4: Message Construction** - Data and error correction interleaving
5. **Step 5: Module Placement** - Matrix layout with patterns and data
6. **Step 6: Masking** - Optimal mask pattern application
7. **Step 7: Format Information** - Final QR code completion

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

### Current Implementation Status

#### ✅ Completed Features

**Step 1 - Data Analysis**
- Character type detection (numeric/alphanumeric/byte/kanji)
- Optimal mode selection with capacity-based recommendations
- Version calculation for minimum QR requirements
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
- **Reed-Solomon algorithm**: Galois field GF(256) arithmetic implementation
- **EC blocks structure**: Complete table for all 40 versions and 4 error levels
- **Block processing**: Data block division and EC codeword generation
- **Interleaving**: Proper data and EC block interleaving for final message
- **Visual representation**: Real-time display of blocks and EC codewords

**Architecture & UI/UX**
- **4-column responsive layout**: Uniform grid with 400px minimum width per column
- **Compact design**: Optimized spacing, padding, and typography for better space utilization
- **Component-based UI**: Modular column layout for each processing step
- **QR Pipeline**: Centralized pipeline for step-by-step QR generation
- **Shared utilities**: Reusable binary and string manipulation functions
- **Sample data integration**: Quick-access buttons for testing different encoding modes
- **Real-time analysis**: Always-visible data analysis even before input
- **Type safety**: Comprehensive TypeScript types and interfaces

#### 🔄 Next Steps (In Order):
- **Step 4**: Message Construction - Final interleaving and remainder bits
- **Step 5**: Module Placement - Matrix pattern layout
- **Step 6**: Masking - Pattern application and selection
- **Step 7**: Format Information - Final QR completion

#### 🏗 Application Structure:
- **QR Pipeline**: `src/qr/qrPipeline.ts` - Centralized processing pipeline
- **Components**: `src/components/` - Step-specific UI components (SettingsColumn, DataEncodingColumn, etc.)
- **QR Logic**: `src/qr/` - Modular QR generation functions with comprehensive tests
- **Shared Utils**: `src/shared/` - Reusable binary and string manipulation utilities
- **UI Layout**: 4-column grid with compact spacing and responsive design
- **Styling**: Tailwind CSS with minimal reset CSS for consistent typography

## QR Code Standard Documentation

The Korean QR code standard documentation has been converted to Markdown format for easier access:
- **Original PDF**: `docs/KSXISO_IEC18004(2017확인)_KR.pdf` (21MB, 110 pages)
- **Markdown version**: `docs/KSXISO_IEC18004_KR.md` (3,054 lines)
- **Quick Index**: `docs/QR_INDEX.md` - Navigation guide with line numbers for key sections

Use the index file to quickly locate specific implementation topics. Key sections include:
- Section 8: Complete encoding process (line 417+)
- Data analysis and mode selection (line 497+)
- Error correction algorithms (line 865+)
- Module placement and masking (line 1335+)
- Format and version information (line 1517+)

## Code Style Guidelines

This project follows specific coding practices to maintain consistency and readability:

1. **Functional Programming Style**: Prefer functional programming patterns using @mobily/ts-belt utilities
2. **Pipeline Architecture**: Use pipe() for clear data transformation flows
3. **Declarative Code**: Write declarative, easy-to-understand code over imperative alternatives
4. **Type Safety**: Avoid `any` types, use proper TypeScript typing throughout
5. **Component Separation**: Extract reusable UI components with clear props interfaces
6. **Shared Utilities**: Move reusable functions to `src/shared/` for cross-module use
7. **Minimal Comments**: Code should be self-documenting; avoid excessive commenting unless documenting complex algorithms
8. **Immutable Data**: Prefer immutable data structures and pure functions
9. **Testing**: Write comprehensive tests for all QR logic functions
10. **ISO Compliance**: Follow ISO/IEC 18004 standard with detailed comments referencing specific sections

## Development Workflow

**Educational Approach**: Each QR generation step should be implemented incrementally with clear visualization of intermediate results. Users should be able to:

1. See the input and output of each step
2. Understand why each transformation occurs
3. Observe how changes in input affect each step
4. Learn the QR standard through interactive exploration

When implementing QR code features, refer to the Markdown documentation at `docs/KSXISO_IEC18004_KR.md` for specifications and compliance requirements.

## Implementation Priority

Focus on **step-by-step educational value** over optimization:
1. Clear separation of each QR generation step
2. Intermediate result visualization
3. Real-time feedback and validation
4. Educational explanations for each transformation
5. Interactive exploration of parameter changes