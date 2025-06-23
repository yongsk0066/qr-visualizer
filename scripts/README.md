# QR Visualizer Scripts

OG 이미지 및 관련 아이콘을 생성하는 스크립트 디렉토리입니다.

## 설치

```bash
npm install
```

## 사용법

```bash
npm run generate-og
```

## 생성되는 파일들

- `public/og-image.png` (1200x630) - Open Graph 메타 태그용 이미지
- `public/apple-touch-icon.png` (180x180) - Apple 기기용 아이콘
- `public/og-preview.png` (600x315) - 작은 크기 미리보기용

## 디자인

- 흰색 배경
- 3개의 QR Finder Pattern (좌상단, 우상단, 좌하단)
- 중앙에 "QR Visualizer" 타이틀
- 부제목 "QR 코드의 작동 원리를 시각적으로 설명"
- 우하단에 타이밍 패턴 장식