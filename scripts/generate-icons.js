import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Standard icon SVG (for general icons)
const svgPath = path.join(publicDir, 'icon.svg');

// 2. Maskable icon SVG (with safe-zone 15% padding and full-bleed background for Android adaptive icon)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A" />
      <stop offset="50%" stop-color="#1E1B4B" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#C026D3" />
      <stop offset="50%" stop-color="#8B5CF6" />
      <stop offset="100%" stop-color="#4F46E5" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#06B6D4" />
      <stop offset="100%" stop-color="#3B82F6" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="16" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Full bleed square background without rounded corners for maskable adaptive clipping -->
  <rect width="512" height="512" fill="url(#bgGrad)" />

  <!-- Background decorative glow in safe zone -->
  <circle cx="256" cy="256" r="110" fill="url(#primaryGrad)" opacity="0.25" filter="url(#glow)" />

  <!-- Centered within 70% safe zone to never clip on Android launcher -->
  <g transform="translate(256, 256) scale(0.92) translate(-128, -128)">
    <path d="M 50 128 L 74 128" stroke="url(#accentGrad)" stroke-width="16" stroke-linecap="round" />
    <path d="M 44 98 L 44 158" stroke="url(#accentGrad)" stroke-width="14" stroke-linecap="round" />
    
    <path d="M 206 128 L 182 128" stroke="url(#accentGrad)" stroke-width="16" stroke-linecap="round" />
    <path d="M 212 98 L 212 158" stroke="url(#accentGrad)" stroke-width="14" stroke-linecap="round" />

    <path d="M 148 36 L 90 140 L 126 140 L 108 220 L 176 116 L 140 116 Z" 
          fill="url(#primaryGrad)" 
          filter="url(#glow)" />
    
    <path d="M 68 186 L 96 186 L 108 166 L 124 206 L 138 186 L 188 186" 
          fill="none" 
          stroke="url(#accentGrad)" 
          stroke-width="7" 
          stroke-linecap="round" 
          stroke-linejoin="round"
          opacity="0.9" />
  </g>
</svg>`;

async function generate() {
  console.log('Generating PWA icons...');
  const svgBuffer = fs.readFileSync(svgPath);
  const maskableBuffer = Buffer.from(maskableSvg);

  // 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  // 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  // 512x512 maskable with safe zone
  await sharp(maskableBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  // 180x180 apple-touch-icon
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // favicon.ico (64x64 png as favicon or ico)
  await sharp(svgBuffer)
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));

  console.log('All icons generated successfully!');
}

generate().catch(console.error);
