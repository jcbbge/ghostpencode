import { describe, test, expect } from 'bun:test';
import { extractPaletteFromImage } from '../../src/extract';
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
