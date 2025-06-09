let wasm: any | null = null;

export const initReedSolomonWasm = async (): Promise<void> => {
  if (wasm) return;
  wasm = await import('/rs_wasm/reed_solomon_wasm.js');
};

export const generateErrorCorrectionCodewordsWasm = (
  data: number[],
  ecCount: number
): number[] => {
  if (!wasm) throw new Error('ReedSolomon WASM not initialized');
  const input = new Uint16Array(data);
  const result = wasm.generate_error_correction_codewords(input, ecCount) as Uint16Array;
  return Array.from(result);
};
