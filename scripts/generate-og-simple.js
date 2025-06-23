import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function generateOGImage() {
  try {
    console.log('Generating OG image with SVG...');

    // public 디렉토리 확인 및 생성
    const publicDir = join(dirname(__dirname), 'public');
    if (!existsSync(publicDir)) {
      await mkdir(publicDir, { recursive: true });
    }

    // SVG 직접 생성
    const svg = `
      <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
        <rect width="1200" height="630" fill="#ffffff"/>
        
        <!-- Finder Pattern 좌상단 -->
        <g transform="translate(40, 40)">
          <rect x="0" y="0" width="180" height="180" fill="#000"/>
          <rect x="36" y="36" width="108" height="108" fill="#fff"/>
          <rect x="63" y="63" width="54" height="54" fill="#000"/>
        </g>
        
        <!-- Finder Pattern 우상단 -->
        <g transform="translate(980, 40)">
          <rect x="0" y="0" width="180" height="180" fill="#000"/>
          <rect x="36" y="36" width="108" height="108" fill="#fff"/>
          <rect x="63" y="63" width="54" height="54" fill="#000"/>
        </g>
        
        <!-- Finder Pattern 좌하단 -->
        <g transform="translate(40, 410)">
          <rect x="0" y="0" width="180" height="180" fill="#000"/>
          <rect x="36" y="36" width="108" height="108" fill="#fff"/>
          <rect x="63" y="63" width="54" height="54" fill="#000"/>
        </g>
        
        <!-- 타이밍 패턴 우하단 -->
        <g transform="translate(980, 480)">
          <rect x="0" y="0" width="12" height="12" fill="#000"/>
          <rect x="20" y="0" width="12" height="12" fill="#000"/>
          <rect x="40" y="0" width="12" height="12" fill="#000"/>
          <rect x="60" y="0" width="12" height="12" fill="#000"/>
          <rect x="80" y="0" width="12" height="12" fill="#000"/>
          <rect x="100" y="0" width="12" height="12" fill="#000"/>
          <rect x="120" y="0" width="12" height="12" fill="#000"/>
        </g>
        
        <!-- 타이틀 -->
        <text x="600" y="315" font-family="Arial, sans-serif" font-size="96" font-weight="700" fill="#000" text-anchor="middle" letter-spacing="-3">QR Visualizer</text>
        
        <!-- 부제목 -->
        <text x="600" y="375" font-family="Arial, sans-serif" font-size="32" font-weight="400" fill="#666" text-anchor="middle" letter-spacing="-0.5">QR 코드의 작동 원리를 시각적으로 설명</text>
      </svg>
    `;

    // SVG를 PNG로 변환
    const pngBuffer = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();

    // OG 이미지 저장
    const ogImagePath = join(publicDir, 'og-image.png');
    await writeFile(ogImagePath, pngBuffer);
    console.log('✅ OG image generated:', ogImagePath);

    // Apple Touch Icon 생성 (180x180) - favicon과 동일한 디자인
    const touchIconSvg = `
      <svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
        <!-- Background -->
        <rect width="180" height="180" fill="white"/>
        
        <!-- QR Finder Pattern (top-left) - 크게 -->
        <!-- Outer black square -->
        <rect x="22" y="22" width="79" height="79" fill="black"/>
        <!-- Inner white square -->
        <rect x="34" y="34" width="55" height="55" fill="white"/>
        <!-- Center black square -->
        <rect x="45" y="45" width="33" height="33" fill="black"/>
        
        <!-- QR Finder Pattern (bottom-right) - 작게 -->
        <!-- Outer black square -->
        <rect x="113" y="113" width="45" height="45" fill="black"/>
        <!-- Inner white square -->
        <rect x="119" y="119" width="33" height="33" fill="white"/>
        <!-- Center black square -->
        <rect x="125" y="125" width="21" height="21" fill="black"/>
        
        <!-- Connecting dots for visual interest -->
        <rect x="113" y="56" width="11" height="11" fill="black"/>
        <rect x="135" y="56" width="11" height="11" fill="black"/>
        <rect x="56" y="113" width="11" height="11" fill="black"/>
        <rect x="56" y="135" width="11" height="11" fill="black"/>
      </svg>
    `;
    
    const touchIconBuffer = await sharp(Buffer.from(touchIconSvg))
      .png()
      .toBuffer();

    const touchIconPath = join(publicDir, 'apple-touch-icon.png');
    await writeFile(touchIconPath, touchIconBuffer);
    console.log('✅ Apple touch icon generated:', touchIconPath);

    // 미리보기용 작은 버전도 생성 (600x315)
    const previewBuffer = await sharp(pngBuffer)
      .resize(600, 315, {
        fit: 'cover',
        position: 'center',
      })
      .png()
      .toBuffer();

    const previewPath = join(publicDir, 'og-preview.png');
    await writeFile(previewPath, previewBuffer);
    console.log('✅ Preview image generated:', previewPath);

  } catch (error) {
    console.error('❌ Error generating OG image:', error);
    process.exit(1);
  }
}

// 스크립트 실행
generateOGImage();