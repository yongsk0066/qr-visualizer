interface QRViewerProps {
  matrix: number[][];
  size?: number;
  quietZone?: number;
}

export function QRViewer({ matrix, size = 300, quietZone = 4 }: QRViewerProps) {
  const modules = matrix.length;
  const totalModules = modules + quietZone * 2;
  const moduleSize = size / totalModules;

  return (
    <div className="inline-block border border-gray-200">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <rect width={size} height={size} fill="white" />

        {matrix.map((row, y) =>
          row.map((module, x) =>
            module === 1 ? (
              <rect
                key={`${x}-${y}`}
                x={(x + quietZone) * moduleSize}
                y={(y + quietZone) * moduleSize}
                width={moduleSize}
                height={moduleSize}
                fill="black"
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
}
