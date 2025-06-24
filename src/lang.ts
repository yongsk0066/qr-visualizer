export function t(ko: string, en: string): string {
  return document.documentElement.lang.startsWith('en') ? en : ko;
}
