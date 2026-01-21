import sharp from 'sharp';
import type { Palette } from './types';
import { getVibrancy, getSaturation, adjustForContrast } from './utils';

interface ColorInfo {
  r: number;
  g: number;
  b: number;
  hex: string;
  count: number;
  luminance: number;
  saturation: number;
  vibrancy: number;
  hue: number;
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  return '#' + [clamp(r), clamp(g), clamp(b)]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
}

function getLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function rgbToHSV(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = 60 * (((g - b) / delta) % 6);
    else if (max === g) h = 60 * (((b - r) / delta) + 2);
    else h = 60 * (((r - g) / delta) + 4);
  }
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : delta / max;
  const v = max;

  return { h, s, v };
}

export async function extractPaletteFromImage(imagePath: string): Promise<Palette> {
  const image = sharp(imagePath);
  const { data } = await image
    .resize(150, 150, { fit: 'cover' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Extract colors with detailed information
  const colorMap = new Map<string, ColorInfo>();

  for (let i = 0; i < data.length; i += 3) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Quantize more aggressively to reduce color space but preserve vibrancy
    const qR = Math.round(r / 24) * 24;
    const qG = Math.round(g / 24) * 24;
    const qB = Math.round(b / 24) * 24;

    const key = `${qR},${qG},${qB}`;
    const hex = rgbToHex(qR, qG, qB);

    if (!colorMap.has(key)) {
      const hsv = rgbToHSV(qR, qG, qB);
      const luminance = getLuminance(qR, qG, qB);
      const saturation = getSaturation(hex);
      const vibrancy = getVibrancy(hex);

      colorMap.set(key, {
        r: qR,
        g: qG,
        b: qB,
        hex,
        count: 1,
        luminance,
        saturation,
        vibrancy,
        hue: hsv.h,
      });
    } else {
      const color = colorMap.get(key)!;
      color.count++;
    }
  }

  // Convert to array and sort by multiple criteria
  let allColors = Array.from(colorMap.values());

  // Calculate a score that balances frequency, vibrancy, and diversity
  const scoredColors = allColors.map(c => ({
    ...c,
    score: Math.log(c.count + 1) * 0.3 + c.vibrancy * 40 + c.saturation * 30,
  }));

  // Sort by score (higher is better)
  scoredColors.sort((a, b) => b.score - a.score);

  // Extract diverse colors by ensuring hue diversity
  const diverseColors: ColorInfo[] = [];
  const minHueDistance = 15; // Minimum hue difference in degrees

  for (const color of scoredColors) {
    if (diverseColors.length === 0) {
      diverseColors.push(color);
      continue;
    }

    // Check if this color is sufficiently different from existing colors
    const isDiverse = diverseColors.every(existing => {
      const hueDiff = Math.min(
        Math.abs(color.hue - existing.hue),
        360 - Math.abs(color.hue - existing.hue)
      );
      return hueDiff > minHueDistance || Math.abs(color.luminance - existing.luminance) > 40;
    });

    if (isDiverse && diverseColors.length < 30) {
      diverseColors.push(color);
    }
  }

  // Separate into categories
  const darkColors = diverseColors.filter(c => c.luminance < 100);
  const midColors = diverseColors.filter(c => c.luminance >= 100 && c.luminance < 180);
  const brightColors = diverseColors.filter(c => c.luminance >= 180);

  // Find background: most common color, strongly preferring low saturation
  const bgCandidates = allColors
    .sort((a, b) => {
      // Background should be common AND neutral (low saturation)
      const scoreA = a.count * 10 - a.saturation * 500 - Math.abs(a.luminance - 128) * 2;
      const scoreB = b.count * 10 - b.saturation * 500 - Math.abs(b.luminance - 128) * 2;
      return scoreB - scoreA;
    });

  // Find foreground: bright color that contrasts well with background
  // Also prefer low saturation for readability
  const bgLum = bgCandidates[0].luminance;
  const fgCandidates = allColors
    .filter(c => Math.abs(c.luminance - bgLum) > 100) // Good contrast
    .sort((a, b) => {
      const scoreA = a.count * 5 - a.saturation * 200 + (bgLum < 128 ? a.luminance : -a.luminance);
      const scoreB = b.count * 5 - b.saturation * 200 + (bgLum < 128 ? b.luminance : -b.luminance);
      return scoreB - scoreA;
    });

  const background = bgCandidates[0];
  const foreground = fgCandidates[0] || (bgLum < 128 ?
    { hex: '#ffffff', r: 255, g: 255, b: 255, luminance: 255, saturation: 0, vibrancy: 0, hue: 0, count: 0 } :
    { hex: '#000000', r: 0, g: 0, b: 0, luminance: 0, saturation: 0, vibrancy: 0, hue: 0, count: 0 }
  );

  // Helper to find best color for a target hue with vibrancy preference
  const findColorByHue = (
    colorSet: ColorInfo[],
    targetHue: number,
    preferVibrant: boolean,
    fallback: string
  ): string => {
    if (colorSet.length === 0) return fallback;

    const candidates = colorSet.map(c => {
      const hueDiff = Math.min(Math.abs(c.hue - targetHue), 360 - Math.abs(c.hue - targetHue));
      const hueScore = 1 - hueDiff / 180;
      const vibrancyScore = preferVibrant ? c.vibrancy * 2 : c.vibrancy * 0.5;
      return { color: c, score: hueScore * 50 + vibrancyScore * 30 + c.saturation * 20 };
    });

    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].color.hex;
  };

  // Build palette with improved color selection
  const palette: Palette = {
    background: background.hex,
    foreground: adjustForContrast(foreground.hex, background.hex, 4.5),
    cursor: foreground.hex,
    selection: rgbToHex(
      Math.min(255, Math.round(background.r * 1.8)),
      Math.min(255, Math.round(background.g * 1.8)),
      Math.min(255, Math.round(background.b * 1.8))
    ),

    // Dark colors (ANSI 0-7) - prioritize vibrancy
    black: background.hex,
    red: findColorByHue([...darkColors, ...midColors], 0, true, '#cc6666'),
    green: findColorByHue([...darkColors, ...midColors], 120, true, '#88aa66'),
    yellow: findColorByHue([...darkColors, ...midColors], 60, true, '#ccaa66'),
    blue: findColorByHue([...darkColors, ...midColors], 240, true, '#6688cc'),
    magenta: findColorByHue([...darkColors, ...midColors], 320, true, '#cc66cc'),
    cyan: findColorByHue([...darkColors, ...midColors], 180, true, '#66cccc'),
    white: foreground.hex,

    // Bright colors (ANSI 8-15) - maximize vibrancy
    brightBlack: rgbToHex(
      Math.min(255, Math.round(background.r * 2.5)),
      Math.min(255, Math.round(background.g * 2.5)),
      Math.min(255, Math.round(background.b * 2.5))
    ),
    brightRed: findColorByHue([...midColors, ...brightColors], 0, true, '#ff8888'),
    brightGreen: findColorByHue([...midColors, ...brightColors], 120, true, '#aacc88'),
    brightYellow: findColorByHue([...midColors, ...brightColors], 60, true, '#ffcc88'),
    brightBlue: findColorByHue([...midColors, ...brightColors], 240, true, '#88aaff'),
    brightMagenta: findColorByHue([...midColors, ...brightColors], 320, true, '#ff88ff'),
    brightCyan: findColorByHue([...midColors, ...brightColors], 180, true, '#88ffff'),
    brightWhite: rgbToHex(
      Math.min(255, Math.round(foreground.r * 1.05)),
      Math.min(255, Math.round(foreground.g * 1.05)),
      Math.min(255, Math.round(foreground.b * 1.05))
    ),
  };

  // Ensure foreground has good contrast with background
  palette.foreground = adjustForContrast(palette.foreground, palette.background, 4.5);
  palette.white = adjustForContrast(palette.white, palette.background, 3.0);

  return palette;
}
