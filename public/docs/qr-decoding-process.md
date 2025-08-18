# QR Code Decoding Process

The decoding process extracts data from a tri-state matrix using error correction and format information.

## Step 1: Format Extraction
- Extract 15-bit format information from two locations
- BCH(15,5) error correction for format recovery
- Decode error correction level (L/M/Q/H)
- Identify mask pattern (0-7)
- Handle unknown modules with confidence scoring

## Step 2: Version Extraction
- Extract 18-bit version information (for v7+)
- BCH(18,6) error correction
- Dual location reading (6×3 left-bottom, 3×6 top-right)
- MSB first bit ordering per ISO/IEC 18004
- Confidence-based selection between locations

## Step 3: Mask Pattern Removal
- Apply identified mask pattern
- XOR operation on data modules only
- Preserve function patterns (finder, timing, alignment)
- Module type classification for accurate masking
- Handle tri-state matrices with unknown values

## Step 4: Data Module Reading
- Generate zigzag reading pattern per ISO/IEC 18004
- Convert modules to 8-bit codewords (MSB first)
- Separate data and error correction codewords
- Visual distinction with color coding
- Calculate reading confidence metrics

## Step 5: Error Correction
- Reed-Solomon error correction implementation
- Deinterleave codeword blocks per ISO/IEC 18004
- Syndrome calculation with GF(256) operations
- Berlekamp-Massey algorithm for error locator
- Forney algorithm for error magnitude
- Block-wise correction with verification

## Step 6: Data Extraction
- Parse mode indicators and character counts
- Support multi-segment decoding
- UTF-8 decoding for byte mode
- Terminator pattern detection
- Padding byte validation (EC/11 patterns)
- Comprehensive bit stream visualization

## Technical Details
- Support for all QR versions (1-40)
- All error correction levels (L/M/Q/H)
- Handle damaged or partially readable codes
- 75+ comprehensive tests
- Visual feedback for each decoding stage