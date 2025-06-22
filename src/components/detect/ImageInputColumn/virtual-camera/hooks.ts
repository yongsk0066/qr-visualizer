import { useEffect, useRef, useState } from 'react';
import { CANVAS_PADDING, DEFAULT_CANVAS_SIZE, MAX_CANVAS_SIZE } from './constants';

// Hook to manage container dimensions
export const useContainerDimensions = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({
    width: DEFAULT_CANVAS_SIZE,
    height: DEFAULT_CANVAS_SIZE,
  });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const size = Math.min(rect.width - CANVAS_PADDING, MAX_CANVAS_SIZE);
        setDimensions({ width: size, height: size });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return { containerRef, dimensions };
};
