import type { ReactNode } from 'react';

interface ProcessingWrapperProps {
  isProcessing: boolean;
  children: ReactNode;
}

/**
 * 처리 중 상태에 따라 투명도와 전환 효과를 적용하는 래퍼 컴포넌트
 */
export const ProcessingWrapper = ({ isProcessing, children }: ProcessingWrapperProps) => {
  return (
    <div style={{ 
      opacity: isProcessing ? 0.6 : 1,
      transition: isProcessing ? 'opacity 0.2s 0.1s ease-out' : 'opacity 0s 0s ease-out'
    }}>
      {children}
    </div>
  );
};