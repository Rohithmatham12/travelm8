import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';

// SVG for main icon: orange bg, white road + car
const iconSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" rx="180" fill="#F97316"/>
  <!-- Road (dashed center line) -->
  <rect x="460" y="300" width="104" height="424" rx="52" fill="rgba(255,255,255,0.25)"/>
  <!-- Dashes on road -->
  <rect x="500" y="320" width="24" height="60" rx="12" fill="white" opacity="0.9"/>
  <rect x="500" y="420" width="24" height="60" rx="12" fill="white" opacity="0.9"/>
  <rect x="500" y="520" width="24" height="60" rx="12" fill="white" opacity="0.9"/>
  <rect x="500" y="620" width="24" height="60" rx="12" fill="white" opacity="0.9"/>
  <!-- Car body -->
  <rect x="340" y="480" width="344" height="160" rx="24" fill="white"/>
  <!-- Car roof -->
  <path d="M400 480 L440 400 L584 400 L624 480Z" fill="white"/>
  <!-- Windshield -->
  <path d="M430 480 L456 420 L568 420 L594 480Z" fill="#F97316" opacity="0.7"/>
  <!-- Wheels -->
  <circle cx="408" cy="648" r="52" fill="#1A1A1A"/>
  <circle cx="408" cy="648" r="28" fill="#F97316"/>
  <circle cx="616" cy="648" r="52" fill="#1A1A1A"/>
  <circle cx="616" cy="648" r="28" fill="#F97316"/>
  <!-- Headlights -->
  <rect x="668" y="510" width="20" height="36" rx="8" fill="#FEF9C3"/>
  <!-- Tail lights -->
  <rect x="336" y="510" width="20" height="36" rx="8" fill="#FCA5A5"/>
</svg>`;

// SVG for foreground (adaptive icon, transparent bg)
const foregroundSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <!-- Car body -->
  <rect x="280" y="440" width="464" height="190" rx="28" fill="white"/>
  <!-- Car roof -->
  <path d="M348 440 L400 350 L624 350 L676 440Z" fill="white"/>
  <!-- Windshield -->
  <path d="M382 440 L418 370 L606 370 L642 440Z" fill="#F97316" opacity="0.7"/>
  <!-- Wheels -->
  <circle cx="380" cy="642" r="62" fill="white"/>
  <circle cx="380" cy="642" r="32" fill="#F97316"/>
  <circle cx="644" cy="642" r="62" fill="white"/>
  <circle cx="644" cy="642" r="32" fill="#F97316"/>
  <!-- Headlights -->
  <rect x="728" y="474" width="22" height="44" rx="8" fill="#FEF9C3"/>
  <!-- Tail lights -->
  <rect x="274" y="474" width="22" height="44" rx="8" fill="#FCA5A5"/>
  <!-- Speed lines -->
  <rect x="160" y="490" width="90" height="14" rx="7" fill="white" opacity="0.7"/>
  <rect x="130" y="530" width="120" height="14" rx="7" fill="white" opacity="0.5"/>
  <rect x="150" y="570" width="80" height="14" rx="7" fill="white" opacity="0.3"/>
</svg>`;

// Splash screen SVG
const splashSvg = `<svg width="1284" height="2778" viewBox="0 0 1284 2778" xmlns="http://www.w3.org/2000/svg">
  <rect width="1284" height="2778" fill="#FAFAF9"/>
  <!-- Orange accent circle -->
  <circle cx="642" cy="1160" r="280" fill="#FFF7ED"/>
  <!-- Car icon -->
  <rect x="470" y="1080" width="344" height="160" rx="24" fill="#F97316"/>
  <path d="M530 1080 L570 1000 L714 1000 L754 1080Z" fill="#F97316"/>
  <path d="M560 1080 L586 1020 L698 1020 L724 1080Z" fill="white" opacity="0.4"/>
  <circle cx="538" cy="1248" r="52" fill="#1A1A1A"/>
  <circle cx="538" cy="1248" r="28" fill="#F97316"/>
  <circle cx="746" cy="1248" r="52" fill="#1A1A1A"/>
  <circle cx="746" cy="1248" r="28" fill="#F97316"/>
  <!-- App name -->
  <text x="642" y="1420" font-family="system-ui, -apple-system, sans-serif" font-size="80" font-weight="800" fill="#111827" text-anchor="middle">TravelM8</text>
  <text x="642" y="1490" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="400" fill="#6B7280" text-anchor="middle">Your road trip copilot</text>
</svg>`;

async function generate() {
  // Main icon (1024x1024)
  await sharp(Buffer.from(iconSvg)).resize(1024, 1024).png().toFile('assets/icon.png');
  console.log('✓ icon.png');

  // Favicon (48x48)
  await sharp(Buffer.from(iconSvg)).resize(48, 48).png().toFile('assets/favicon.png');
  console.log('✓ favicon.png');

  // Android adaptive foreground (1024x1024, transparent bg)
  await sharp(Buffer.from(foregroundSvg)).resize(1024, 1024).png().toFile('assets/android-icon-foreground.png');
  console.log('✓ android-icon-foreground.png');

  // Android adaptive background (solid orange)
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 249, g: 115, b: 22, alpha: 1 } } })
    .png().toFile('assets/android-icon-background.png');
  console.log('✓ android-icon-background.png');

  // Android monochrome
  await sharp(Buffer.from(foregroundSvg)).resize(1024, 1024).grayscale().png().toFile('assets/android-icon-monochrome.png');
  console.log('✓ android-icon-monochrome.png');

  // Splash icon (centered, used by expo-splash-screen)
  await sharp(Buffer.from(iconSvg)).resize(200, 200).png().toFile('assets/splash-icon.png');
  console.log('✓ splash-icon.png');

  console.log('\nAll icons generated!');
}

generate().catch(console.error);
