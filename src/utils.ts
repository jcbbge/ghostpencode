/**
 * Converts a theme name to kebab-case format for OpenCode
 * Examples:
 *   'Shopping Cart' -> 'shopping-cart'
 *   'shopping-cart' -> 'shopping-cart'
 *   'Tokyo Night Storm' -> 'tokyo-night-storm'
 */
export function toKebabCase(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Converts a theme name to Title Case format for Ghostty
 * Examples:
 *   'shopping-cart' -> 'Shopping Cart'
 *   'Shopping Cart' -> 'Shopping Cart'
 *   'tokyo-night-storm' -> 'Tokyo Night Storm'
 */
export function toTitleCase(name: string): string {
  return name
    .trim()
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Calculate relative luminance for WCAG contrast ratio
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function getRelativeLuminance(hex: string): number {
  const rgb = parseInt(hex.slice(1), 16);
  const r = ((rgb >> 16) & 0xff) / 255;
  const g = ((rgb >> 8) & 0xff) / 255;
  const b = (rgb & 0xff) / 255;

  const [rs, gs, bs] = [r, g, b].map(c =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getRelativeLuminance(color1);
  const l2 = getRelativeLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standard for normal text (4.5:1)
 */
export function meetsContrastStandard(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return level === 'AAA' ? ratio >= 7 : ratio >= 4.5;
}

/**
 * Adjust color brightness to meet minimum contrast ratio
 */
export function adjustForContrast(
  foreground: string,
  background: string,
  minRatio = 4.5
): string {
  const currentRatio = getContrastRatio(foreground, background);
  if (currentRatio >= minRatio) return foreground;

  const bgLum = getRelativeLuminance(background);
  const rgb = parseInt(foreground.slice(1), 16);
  let r = (rgb >> 16) & 0xff;
  let g = (rgb >> 8) & 0xff;
  let b = rgb & 0xff;

  // Determine if we should make it lighter or darker
  const shouldLighten = bgLum < 0.5;
  const step = shouldLighten ? 10 : -10;
  const limit = shouldLighten ? 255 : 0;

  // Iteratively adjust until we meet the contrast ratio
  for (let i = 0; i < 25; i++) {
    const adjusted = `#${[r, g, b]
      .map(c => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0'))
      .join('')}`;

    if (getContrastRatio(adjusted, background) >= minRatio) {
      return adjusted;
    }

    if ((shouldLighten && r >= limit) || (!shouldLighten && r <= limit)) break;

    r = Math.max(0, Math.min(255, r + step));
    g = Math.max(0, Math.min(255, g + step));
    b = Math.max(0, Math.min(255, b + step));
  }

  // Fallback to white or black
  return shouldLighten ? '#ffffff' : '#000000';
}

/**
 * Calculate color saturation (0-1)
 */
export function getSaturation(hex: string): number {
  const rgb = parseInt(hex.slice(1), 16);
  const r = ((rgb >> 16) & 0xff) / 255;
  const g = ((rgb >> 8) & 0xff) / 255;
  const b = (rgb & 0xff) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  if (max === 0) return 0;

  return (max - min) / max;
}

/**
 * Calculate color vibrancy score (combination of saturation and brightness)
 */
export function getVibrancy(hex: string): number {
  const rgb = parseInt(hex.slice(1), 16);
  const r = ((rgb >> 16) & 0xff) / 255;
  const g = ((rgb >> 8) & 0xff) / 255;
  const b = (rgb & 0xff) / 255;

  const max = Math.max(r, g, b);
  const saturation = getSaturation(hex);

  // Vibrancy is a combination of saturation and brightness
  // We want colors that are both saturated AND bright
  return saturation * max;
}

/**
 * Convert RGB to HSL color space
 */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    if (max === r) h = 60 * (((g - b) / delta) % 6);
    else if (max === g) h = 60 * (((b - r) / delta) + 2);
    else h = 60 * (((r - g) / delta) + 4);
  }

  if (h < 0) h += 360;

  return { h, s, l };
}

/**
 * Convert HSL to RGB color space
 */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

/**
 * Adjust color for contrast while preserving hue and saturation
 * Works in HSL space to maintain color character
 */
export function adjustForContrastPreservingHue(
  foreground: string,
  background: string,
  minRatio = 4.5
): string {
  const currentRatio = getContrastRatio(foreground, background);
  if (currentRatio >= minRatio) return foreground;

  const bgLum = getRelativeLuminance(background);
  const rgb = parseInt(foreground.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = rgb & 0xff;

  const hsl = rgbToHsl(r, g, b);

  // Determine if we should make it lighter or darker
  const shouldLighten = bgLum < 0.5;

  // Adjust lightness while preserving hue and saturation
  let { h, s, l } = hsl;
  const step = 0.05; // 5% lightness steps

  for (let i = 0; i < 20; i++) {
    if (shouldLighten) {
      l = Math.min(1, l + step);
    } else {
      l = Math.max(0, l - step);
    }

    const adjusted = hslToRgb(h, s, l);
    const adjustedHex = `#${[adjusted.r, adjusted.g, adjusted.b]
      .map(c => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0'))
      .join('')}`;

    if (getContrastRatio(adjustedHex, background) >= minRatio) {
      return adjustedHex;
    }

    // If we've maxed out lightness, try reducing saturation
    if ((shouldLighten && l >= 0.95) || (!shouldLighten && l <= 0.05)) {
      if (s > 0.1) {
        s = Math.max(0.1, s - 0.1);
        l = shouldLighten ? 0.9 : 0.1;
      } else {
        break;
      }
    }
  }

  // Fallback to white or black
  return shouldLighten ? '#ffffff' : '#000000';
}
