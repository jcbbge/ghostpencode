import { describe, test, expect } from 'bun:test';
import { extractPaletteFromImage } from '../../src/extract';
import { getContrastRatio, meetsContrastStandard, adjustForContrast } from '../../src/utils';
import { join } from 'path';

const FIXTURES_DIR = join(import.meta.dir, '../fixtures');

describe('Accessibility - WCAG Contrast Standards', () => {
  test('shopping-cart: foreground should meet AA contrast with background', async () => {
    const palette = await extractPaletteFromImage(join(FIXTURES_DIR, 'shopping-cart.png'));

    const contrast = getContrastRatio(palette.foreground, palette.background);

    // WCAG AA requires 4.5:1 for normal text
    expect(contrast).toBeGreaterThanOrEqual(4.5);
  });

  test('chute-zone: foreground should meet AA contrast with background', async () => {
    const palette = await extractPaletteFromImage(join(FIXTURES_DIR, 'chute-zone.png'));

    const contrast = getContrastRatio(palette.foreground, palette.background);

    expect(contrast).toBeGreaterThanOrEqual(4.5);
  });

  test('extension-cord: foreground should meet AA contrast with background', async () => {
    const palette = await extractPaletteFromImage(join(FIXTURES_DIR, 'extension-cord.png'));

    const contrast = getContrastRatio(palette.foreground, palette.background);

    expect(contrast).toBeGreaterThanOrEqual(4.5);
  });

  test('guard-rail: foreground should meet AA contrast with background', async () => {
    const palette = await extractPaletteFromImage(join(FIXTURES_DIR, 'guard-rail.png'));

    const contrast = getContrastRatio(palette.foreground, palette.background);

    expect(contrast).toBeGreaterThanOrEqual(4.5);
  });

  test('meetsContrastStandard utility should validate AA correctly', () => {
    // White on black - excellent contrast
    expect(meetsContrastStandard('#ffffff', '#000000', 'AA')).toBe(true);

    // Poor contrast
    expect(meetsContrastStandard('#cccccc', '#dddddd', 'AA')).toBe(false);

    // Borderline AA contrast
    expect(meetsContrastStandard('#767676', '#ffffff', 'AA')).toBe(true);
  });

  test('adjustForContrast should improve low contrast colors', () => {
    const lowContrastFg = '#cccccc';
    const background = '#dddddd';

    const adjusted = adjustForContrast(lowContrastFg, background, 4.5);
    const newContrast = getContrastRatio(adjusted, background);

    expect(newContrast).toBeGreaterThanOrEqual(4.5);
  });

  test('adjustForContrast should not modify already accessible colors', () => {
    const goodFg = '#000000';
    const background = '#ffffff';

    const adjusted = adjustForContrast(goodFg, background, 4.5);

    // Should return the same color (or very close)
    expect(adjusted.toLowerCase()).toBe(goodFg.toLowerCase());
  });

  test('cursor color should be visible on background', async () => {
    const palette = await extractPaletteFromImage(join(FIXTURES_DIR, 'shopping-cart.png'));

    const cursorContrast = getContrastRatio(palette.cursor, palette.background);

    // Cursor should have at least 3:1 contrast for visibility
    expect(cursorContrast).toBeGreaterThanOrEqual(3.0);
  });

  test('selection should be distinguishable from background', async () => {
    const palette = await extractPaletteFromImage(join(FIXTURES_DIR, 'extension-cord.png'));

    // Selection background should be different from main background
    expect(palette.selection.toLowerCase()).not.toBe(palette.background.toLowerCase());

    // There should be some visual difference
    const bgRgb = parseInt(palette.background.slice(1), 16);
    const selRgb = parseInt(palette.selection.slice(1), 16);

    expect(Math.abs(bgRgb - selRgb)).toBeGreaterThan(0);
  });
});

describe('Accessibility - Color Adjustments', () => {
  test('all themes should have legible text colors', async () => {
    const images = ['shopping-cart.png', 'chute-zone.png', 'extension-cord.png', 'guard-rail.png'];

    for (const image of images) {
      const palette = await extractPaletteFromImage(join(FIXTURES_DIR, image));

      // Primary text should be readable
      const fgContrast = getContrastRatio(palette.foreground, palette.background);
      expect(fgContrast).toBeGreaterThanOrEqual(4.5);

      // White text should be readable (used in many terminals)
      const whiteContrast = getContrastRatio(palette.white, palette.background);
      expect(whiteContrast).toBeGreaterThanOrEqual(3.0); // Slightly lower threshold for secondary text
    }
  });

  test('bright colors should maintain reasonable contrast for syntax highlighting', async () => {
    const palette = await extractPaletteFromImage(join(FIXTURES_DIR, 'shopping-cart.png'));

    const brightColors = [
      palette.brightRed,
      palette.brightGreen,
      palette.brightYellow,
      palette.brightBlue,
      palette.brightMagenta,
      palette.brightCyan,
    ];

    // Determine if background is light or dark
    const bgRgb = parseInt(palette.background.slice(1), 16);
    const bgLuminance = (
      0.299 * ((bgRgb >> 16) & 0xff) +
      0.587 * ((bgRgb >> 8) & 0xff) +
      0.114 * (bgRgb & 0xff)
    );
    const isLightBackground = bgLuminance > 150;

    // For light backgrounds, use dark colors instead of bright colors
    const testColors = isLightBackground
      ? [palette.red, palette.green, palette.yellow, palette.blue, palette.magenta, palette.cyan]
      : brightColors;

    // Count how many colors have decent contrast
    const readable = testColors.filter(c =>
      getContrastRatio(c, palette.background) >= 3.0
    );

    // At least 3 out of 6 colors should be readable
    expect(readable.length).toBeGreaterThanOrEqual(3);
  });
});
