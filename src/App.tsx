import { useState, useMemo } from 'react';
import './App.css';
import { QRViewer } from './QRViewer';
import { analyzeData } from './qr/dataAnalysis';
import type { ErrorCorrectionLevel } from './qr/types';

function App() {
  const [inputData, setInputData] = useState('');
  const [qrVersion, setQrVersion] = useState('1');
  const [errorLevel, setErrorLevel] = useState<ErrorCorrectionLevel>('M');

  const dataAnalysis = useMemo(() => analyzeData(inputData, errorLevel), [inputData, errorLevel]);

  // Empty matrix for now
  const sampleMatrix: number[][] = [];

  return (
    <div className="app">
      <h1 className="text-3xl font-bold mb-8">QR Code Generator</h1>

      <div className="input-section">
        <label htmlFor="qr-input" className="block text-lg font-medium mb-2">
          Enter data for QR Code:
        </label>
        <textarea
          id="qr-input"
          value={inputData}
          onChange={(e) => setInputData(e.target.value)}
          placeholder="Type or paste your data here..."
          className="w-full min-h-[120px] p-4 border border-gray-300 rounded-lg resize-vertical"
          autoFocus
        />
        <div className="mt-2 space-y-1">
          <p className="text-sm text-gray-600">Characters: {inputData.length}</p>
          {inputData && (
            <>
              <p className="text-sm text-blue-600">
                Recommended mode:{' '}
                <span className="font-medium">{dataAnalysis.recommendedMode}</span>
              </p>
              <p className="text-sm text-blue-600">
                Minimum version: <span className="font-medium">{dataAnalysis.minimumVersion}</span>
              </p>
              {!dataAnalysis.isValid && (
                <p className="text-sm text-red-600 font-medium">Data too large for QR code!</p>
              )}
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div>
            <label htmlFor="qr-version" className="block text-md font-medium mb-2">
              QR Version (Size):
            </label>
            <select
              id="qr-version"
              value={qrVersion}
              onChange={(e) => setQrVersion(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
            >
              {[...Array(40)].map((_, i) => {
                const version = i + 1;
                const modules = 4 * version + 17;
                return (
                  <option key={version} value={version}>
                    Version {version} ({modules}×{modules} modules)
                  </option>
                );
              })}
            </select>
            <p className="mt-1 text-xs text-gray-600">Higher versions can store more data</p>
          </div>

          <div>
            <label htmlFor="error-level" className="block text-md font-medium mb-2">
              Error Correction Level:
            </label>
            <select
              id="error-level"
              value={errorLevel}
              onChange={(e) => setErrorLevel(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
            >
              <option value="L">L - Low (~7% recovery)</option>
              <option value="M">M - Medium (~15% recovery)</option>
              <option value="Q">Q - Quartile (~25% recovery)</option>
              <option value="H">H - High (~30% recovery)</option>
            </select>
            <p className="mt-1 text-xs text-gray-600">
              Higher levels provide better error recovery
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-medium mb-4">QR Code Preview:</h2>
        <QRViewer matrix={sampleMatrix} size={400} />
      </div>
    </div>
  );
}

export default App;
