import sharp from 'sharp';
import type { Palette } from './types';

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function getLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export async function extractPaletteFromImage(imagePath: string): Promise<Palette> {
  const image = sharp(imagePath);
  const { data, info } = await image
    .resize(100, 100, { fit: 'cover' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Extract dominant colors using simple color quantization
  const colorMap = new Map<string, number>();
  
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Quantize to reduce color space
    const qR = Math.round(r / 32) * 32;
    const qG = Math.round(g / 32) * 32;
    const qB = Math.round(b / 32) * 32;
    
    const key = `${qR},${qG},${qB}`;
    colorMap.set(key, (colorMap.get(key) || 0) + 1);
  }

  // Sort by frequency
  const sortedColors = Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([color]) => {
      const [r, g, b] = color.split(',').map(Number);
      return { r, g, b, luminance: getLuminance(r, g, b) };
    });

  // Separate into dark and bright colors
  const darkColors = sortedColors.filter(c => c.luminance < 128);
  const brightColors = sortedColors.filter(c => c.luminance >= 128);

  // Helper to find color closest to target hue
  const findColorByHue = (colors: typeof sortedColors, targetHue: number, fallback: string) => {
    if (colors.length === 0) return fallback;
    
    const withHue = colors.map(c => {
      const max = Math.max(c.r, c.g, c.b);
      const min = Math.min(c.r, c.g, c.b);
      const delta = max - min;
      
      let hue = 0;
      if (delta !== 0) {
        if (max === c.r) hue = 60 * (((c.g - c.b) / delta) % 6);
        else if (max === c.g) hue = 60 * (((c.b - c.r) / delta) + 2);
        else hue = 60 * (((c.r - c.g) / delta) + 4);
      }
      
      return { ...c, hue: hue < 0 ? hue + 360 : hue };
    });
    
    const closest = withHue.reduce((prev, curr) => {
      const prevDiff = Math.abs(prev.hue - targetHue);
      const currDiff = Math.abs(curr.hue - targetHue);
      return currDiff < prevDiff ? curr : prev;
    });
    
    return rgbToHex(closest.r, closest.g, closest.b);
  };

  // Extract background (darkest) and foreground (brightest)
  const bg = darkColors[0] || sortedColors[0];
  const fg = brightColors[brightColors.length - 1] || sortedColors[sortedColors.length - 1];

  return {
    background: rgbToHex(bg.r, bg.g, bg.b),
    foreground: rgbToHex(fg.r, fg.g, fg.b),
    cursor: rgbToHex(fg.r, fg.g, fg.b),
    selection: rgbToHex(
      Math.round(bg.r * 1.5),
      Math.round(bg.g * 1.5),
      Math.round(bg.b * 1.5)
    ),
    // Dark colors (ANSI 0-7)
    black: rgbToHex(bg.r, bg.g, bg.b),
    red: findColorByHue(darkColors, 0, '#cc6666'),
    green: findColorByHue(darkColors, 120, '#88aa66'),
    yellow: findColorByHue(darkColors, 60, '#ccaa66'),
    blue: findColorByHue(darkColors, 240, '#6688cc'),
    magenta: findColorByHue(darkColors, 300, '#cc66cc'),
    cyan: findColorByHue(darkColors, 180, '#66cccc'),
    white: rgbToHex(fg.r, fg.g, fg.b),
    // Bright colors (ANSI 8-15)
    brightBlack: rgbToHex(
      Math.round(bg.r * 2),
      Math.round(bg.g * 2),
      Math.round(bg.b * 2)
    ),
    brightRed: findColorByHue(brightColors, 0, '#ff8888'),
    brightGreen: findColorByHue(brightColors, 120, '#aacc88'),
    brightYellow: findColorByHue(brightColors, 60, '#ffcc88'),
    brightBlue: findColorByHue(brightColors, 240, '#88aaff'),
    brightMagenta: findColorByHue(brightColors, 300, '#ff88ff'),
    brightCyan: findColorByHue(brightColors, 180, '#88ffff'),
    brightWhite: rgbToHex(
      Math.min(255, Math.round(fg.r * 1.1)),
      Math.min(255, Math.round(fg.g * 1.1)),
      Math.min(255, Math.round(fg.b * 1.1))
    ),
  };
}
