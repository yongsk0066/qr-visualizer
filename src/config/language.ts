/**
 * 정적 언어 설정
 * URL 경로 기반으로 언어를 결정 (/ko, /en)
 */

// 현재 언어 감지
export const LANG = window.location.pathname.startsWith('/en') ? 'en' : 'ko';

/**
 * 번역 헬퍼 함수
 * @param ko 한국어 텍스트
 * @param en 영어 텍스트
 * @returns 현재 언어에 맞는 텍스트
 */
export function t(ko: string, en: string): string {
  return LANG === 'en' ? en : ko;
}

// 디버깅용 (개발 환경에서만)
if (import.meta.env.DEV) {
  console.log('Current language:', LANG);
  console.log('Current path:', window.location.pathname);
}