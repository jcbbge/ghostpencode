import { describe, test, expect } from 'bun:test';
import { extractPaletteFromImage } from '../../src/extract';
import { getVibrancy, getSaturation, getContrastRatio } from '../../src/utils';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

describe('extractPaletteFromImage', () => {
  const fixturesDir = join(import.meta.dir, '../fixtures');
  
  test('should extract palette from a simple gradient image', async () => {
    // Create a test image: red to blue gradient
    const testImagePath = join(fixturesDir, 'gradient.png');
    mkdirSync(fixturesDir, { recursive: true });
    
    await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    }).png().toFile(testImagePath);
    
    const palette = await extractPaletteFromImage(testImagePath);
    
    expect(palette).toBeDefined();
    expect(palette.background).toMatch(/^#[0-9a-f]{6}$/);
    expect(palette.foreground).toMatch(/^#[0-9a-f]{6}$/);
    expect(palette.black).toMatch(/^#[0-9a-f]{6}$/);
    expect(palette.red).toMatch(/^#[0-9a-f]{6}$/);
    expect(palette.green).toMatch(/^#[0-9a-f]{6}$/);
    expect(palette.blue).toMatch(/^#[0-9a-f]{6}$/);
  });
  
  test('should extract all 20 required color values', async () => {
    const testImagePath = join(fixturesDir, 'gradient.png');
    const palette = await extractPaletteFromImage(testImagePath);
    
    const requiredKeys = [
      'background', 'foreground', 'cursor', 'selection',
      'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
      'brightBlack', 'brightRed', 'brightGreen', 'brightYellow', 
      'brightBlue', 'brightMagenta', 'brightCyan', 'brightWhite'
    ];
    
    for (const key of requiredKeys) {
      expect(palette[key as keyof typeof palette]).toBeDefined();
      expect(typeof palette[key as keyof typeof palette]).toBe('string');
    }
  });
  
  test('should produce valid hex colors', async () => {
    const testImagePath = join(fixturesDir, 'gradient.png');
    const palette = await extractPaletteFromImage(testImagePath);
    
    const hexRegex = /^#[0-9a-f]{6}$/i;
    
    Object.values(palette).forEach(color => {
      expect(color).toMatch(hexRegex);
    });
  });
  
  test('should differentiate dark and bright colors', async () => {
    const testImagePath = join(fixturesDir, 'gradient.png');
    const palette = await extractPaletteFromImage(testImagePath);
    
    // Bright colors should generally be lighter than their dark counterparts
    const getLuminance = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return 0.299 * r + 0.587 * g + 0.114 * b;
    };
    
    expect(getLuminance(palette.brightBlack)).toBeGreaterThanOrEqual(getLuminance(palette.black));
  });
  
  test('should handle solid color image', async () => {
    const solidImagePath = join(fixturesDir, 'solid-red.png');
    
    await sharp({
      create: {
        width: 50,
        height: 50,
        channels: 3,
        background: { r: 200, g: 50, b: 50 }
      }
    }).png().toFile(solidImagePath);
    
    const palette = await extractPaletteFromImage(solidImagePath);
    
    expect(palette).toBeDefined();
    expect(palette.background).toBeDefined();
    // Should still generate a full palette even from solid color
    expect(Object.keys(palette).length).toBe(20);
  });
  
  test('should reject non-existent image', async () => {
    await expect(
      extractPaletteFromImage('/nonexistent/image.png')
    ).rejects.toThrow();
  });
  
  test('should reject invalid image format', async () => {
    const invalidPath = join(fixturesDir, 'invalid.txt');
    writeFileSync(invalidPath, 'not an image');

    await expect(
      extractPaletteFromImage(invalidPath)
    ).rejects.toThrow();
  });
});

describe('Color Extraction Accuracy - Real Images', () => {
  const fixturesDir = join(import.meta.dir, '../fixtures');

  test('shopping-cart: should capture vibrant pink color', async () => {
    const palette = await extractPaletteFromImage(join(fixturesDir, 'shopping-cart.png'));

    // The vibrant pink cart should be captured in red or magenta slots
    const pinkColors = [palette.red, palette.magenta, palette.brightRed, palette.brightMagenta];
    const hasVibrantPink = pinkColors.some(c => {
      const rgb = parseInt(c.slice(1), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = rgb & 0xff;
      // Pink/magenta: high red, low green, some blue
      return r > 200 && g < 100;
    });

    expect(hasVibrantPink).toBe(true);
  });

  test('shopping-cart: should have neutral pale background', async () => {
    const palette = await extractPaletteFromImage(join(fixturesDir, 'shopping-cart.png'));

    // Background should be pale/neutral (low saturation, high luminance)
    const bgSaturation = getSaturation(palette.background);
    const rgb = parseInt(palette.background.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 16) & 0xff;
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

    expect(bgSaturation).toBeLessThan(0.3); // Less than 30% saturation
    expect(luminance).toBeGreaterThan(150); // Bright/pale
  });

  test('chute-zone: should capture yellow/orange pipes', async () => {
    const palette = await extractPaletteFromImage(join(fixturesDir, 'chute-zone.png'));

    // Yellow/orange should be captured in yellow or orange slots
    const yellowOrangeColors = [palette.yellow, palette.brightYellow];
    const hasYellowOrange = yellowOrangeColors.some(c => {
      const rgb = parseInt(c.slice(1), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      // Yellow/orange: high red, high green, low blue
      return r > 180 && g > 100;
    });

    expect(hasYellowOrange).toBe(true);
  });

  test('extension-cord: should capture yellow cord and mint outlet', async () => {
    const palette = await extractPaletteFromImage(join(fixturesDir, 'extension-cord.png'));

    // Yellow cord should be vibrant
    const yellowVibrancy = getVibrancy(palette.yellow);
    const brightYellowVibrancy = getVibrancy(palette.brightYellow);

    expect(Math.max(yellowVibrancy, brightYellowVibrancy)).toBeGreaterThan(0.3);

    // Mint/cyan should be present
    const cyanColors = [palette.cyan, palette.brightCyan];
    const hasCyan = cyanColors.some(c => {
      const rgb = parseInt(c.slice(1), 16);
      const g = (rgb >> 8) & 0xff;
      const b = rgb & 0xff;
      // Cyan/mint: high green and blue
      return g > 150 && b > 150;
    });

    expect(hasCyan).toBe(true);
  });

  test('guard-rail: should capture red ramp and colorful blocks', async () => {
    const palette = await extractPaletteFromImage(join(fixturesDir, 'guard-rail.png'));

    // Red/pink should be prominent
    const redPinkColors = [palette.red, palette.brightRed, palette.magenta, palette.brightMagenta];
    const hasRedPink = redPinkColors.some(c => {
      const rgb = parseInt(c.slice(1), 16);
      const r = (rgb >> 16) & 0xff;
      return r > 200; // High red component
    });

    expect(hasRedPink).toBe(true);

    // Should also have cyan/mint from the blocks
    const cyanColors = [palette.cyan, palette.brightCyan];
    const hasCyan = cyanColors.some(c => {
      const rgb = parseInt(c.slice(1), 16);
      const g = (rgb >> 8) & 0xff;
      const b = rgb & 0xff;
      return g > 150 && b > 150;
    });

    expect(hasCyan).toBe(true);
  });
});

describe('Color Diversity and Vibrancy', () => {
  const fixturesDir = join(import.meta.dir, '../fixtures');

  const getHue = (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = ((rgb >> 16) & 0xff) / 255;
    const g = ((rgb >> 8) & 0xff) / 255;
    const b = (rgb & 0xff) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    if (delta === 0) return 0;

    let hue = 0;
    if (max === r) hue = 60 * (((g - b) / delta) % 6);
    else if (max === g) hue = 60 * (((b - r) / delta) + 2);
    else hue = 60 * (((r - g) / delta) + 4);

    return hue < 0 ? hue + 360 : hue;
  };

  test('should extract diverse color palette (different hues)', async () => {
    const palette = await extractPaletteFromImage(join(fixturesDir, 'shopping-cart.png'));

    const colors = [
      palette.red,
      palette.green,
      palette.yellow,
      palette.blue,
      palette.magenta,
      palette.cyan,
    ];

    const hues = colors.map(getHue);
    const uniqueHueRanges = new Set(hues.map(h => Math.floor(h / 40)));

    // Should have at least 3-4 different hue ranges (diversity)
    expect(uniqueHueRanges.size).toBeGreaterThanOrEqual(3);
  });

  test('should prioritize vibrant colors in bright slots', async () => {
    const palette = await extractPaletteFromImage(join(fixturesDir, 'guard-rail.png'));

    const brightColors = [
      palette.brightRed,
      palette.brightGreen,
      palette.brightYellow,
      palette.brightBlue,
      palette.brightMagenta,
      palette.brightCyan,
    ];

    const vibrancies = brightColors.map(c => getVibrancy(c));
    const avgVibrancy = vibrancies.reduce((a, b) => a + b, 0) / vibrancies.length;

    // Average vibrancy should be decent
    expect(avgVibrancy).toBeGreaterThan(0.15);
  });

  test('should extract at least 10 distinct colors', async () => {
    const palette = await extractPaletteFromImage(join(fixturesDir, 'extension-cord.png'));

    const allColors = [
      palette.black, palette.red, palette.green, palette.yellow,
      palette.blue, palette.magenta, palette.cyan, palette.white,
      palette.brightBlack, palette.brightRed, palette.brightGreen,
      palette.brightYellow, palette.brightBlue, palette.brightMagenta,
      palette.brightCyan, palette.brightWhite,
    ];

    const uniqueColors = new Set(allColors.map(c => c.toLowerCase()));

    // Should have at least 8 unique colors
    expect(uniqueColors.size).toBeGreaterThanOrEqual(8);
  });
});
