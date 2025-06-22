/**
 * 클립보드 유틸리티 함수
 */

/**
 * 텍스트를 클립보드에 복사
 * @param text 복사할 텍스트
 * @returns 성공 여부
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // 최신 브라우저 API 사용
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // 폴백: 구형 브라우저를 위한 방법
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    return successful;
  } catch (err) {
    console.error('클립보드 복사 실패:', err);
    return false;
  }
}

/**
 * 숫자 배열을 16진수 문자열로 변환하여 클립보드에 복사
 * @param values 숫자 배열
 * @param separator 구분자 (기본값: 공백)
 * @returns 성공 여부
 */
export async function copyHexArrayToClipboard(
  values: number[], 
  separator: string = ' '
): Promise<boolean> {
  const hexString = values
    .map(v => v.toString(16).toUpperCase().padStart(2, '0'))
    .join(separator);
  
  return copyToClipboard(hexString);
}

/**
 * 복사 성공/실패 알림 표시
 * @param success 성공 여부
 * @param message 커스텀 메시지 (선택사항)
 */
export function showCopyNotification(
  success: boolean, 
  message?: string
): void {
  const defaultMessage = success 
    ? '클립보드에 복사되었습니다!' 
    : '복사에 실패했습니다';
  
  const notification = document.createElement('div');
  notification.textContent = message || defaultMessage;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 8px 16px;
    background-color: ${success ? '#10b981' : '#ef4444'};
    color: white;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    z-index: 9999;
    animation: slideUp 0.3s ease-out;
  `;
  
  // 애니메이션 스타일 추가
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideUp {
      from {
        transform: translateX(-50%) translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(notification);
  
  // 2초 후 제거
  setTimeout(() => {
    notification.style.animation = 'slideUp 0.3s ease-out reverse';
    setTimeout(() => {
      document.body.removeChild(notification);
      document.head.removeChild(style);
    }, 300);
  }, 2000);
}