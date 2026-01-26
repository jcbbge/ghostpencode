import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import { extractPaletteFromImage } from '../../src/extract';
import { writeGhosttyTheme } from '../../src/ghostty';
import { writeOpenCodeTheme } from '../../src/opencode';

describe('End-to-End Integration Tests', () => {
  const testDir = join(import.meta.dir, '../fixtures/e2e-test');
  const ghosttyThemesDir = join(testDir, 'ghostty-themes');
  const opencodeThemesDir = join(testDir, 'opencode-themes');

  // Track themes created during tests for cleanup
  const createdThemePaths: string[] = [];

  beforeAll(() => {
    mkdirSync(ghosttyThemesDir, { recursive: true });
    mkdirSync(opencodeThemesDir, { recursive: true });
  });

  afterAll(() => {
    // Clean up test fixtures directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }

    // Clean up themes created in real directories
    for (const themePath of createdThemePaths) {
      try {
        if (existsSync(themePath)) {
          rmSync(themePath);
        }
      } catch (err) {
        console.error(`Failed to clean up ${themePath}:`, err);
      }
    }
  });
  
  describe('Complete workflow: Image → Themes', () => {
    test('should extract palette and create both theme formats', async () => {
      // 1. Create test image
      const imagePath = join(testDir, 'workflow-test.png');
      await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 30, g: 30, b: 40 }
        }
      }).png().toFile(imagePath);
      
      // 2. Extract palette
      const palette = await extractPaletteFromImage(imagePath);
      
      expect(palette).toBeDefined();
      expect(palette.background).toBeDefined();
      expect(palette.foreground).toBeDefined();
      
      // 3. Create Ghostty theme
      const ghosttyPath = writeGhosttyTheme('workflow-theme', palette);
      createdThemePaths.push(ghosttyPath);
      expect(existsSync(ghosttyPath)).toBe(true);
      
      const ghosttyContent = readFileSync(ghosttyPath, 'utf-8');
      expect(ghosttyContent).toContain('palette = 0=');
      expect(ghosttyContent).toContain('background =');
      
      // 4. Create OpenCode theme
      const opencodePath = writeOpenCodeTheme('workflow-theme', palette);
      createdThemePaths.push(opencodePath);
      expect(existsSync(opencodePath)).toBe(true);
      
      const opencodeContent = readFileSync(opencodePath, 'utf-8');
      const opencodeTheme = JSON.parse(opencodeContent);
      expect(opencodeTheme.defs).toBeDefined();
      expect(opencodeTheme.theme).toBeDefined();
      
      // 5. Verify color consistency
      expect(palette.background.toLowerCase()).toContain(
        opencodeTheme.defs.bg.toLowerCase()
      );
    });
    
    test('should maintain color fidelity across formats', async () => {
      // Create image with known colors
      const imagePath = join(testDir, 'fidelity-test.png');
      await sharp({
        create: {
          width: 200,
          height: 200,
          channels: 3,
          background: { r: 50, g: 100, b: 150 }
        }
      }).png().toFile(imagePath);
      
      const palette = await extractPaletteFromImage(imagePath);
      
      // Create both themes
      const ghosttyPath = writeGhosttyTheme('fidelity-theme', palette);
      createdThemePaths.push(ghosttyPath);
      const opencodePath = writeOpenCodeTheme('fidelity-theme', palette);
      createdThemePaths.push(opencodePath);
      
      // Parse both
      const ghosttyContent = readFileSync(ghosttyPath, 'utf-8');
      const opencodeTheme = JSON.parse(readFileSync(opencodePath, 'utf-8'));
      
      // Extract background color from Ghostty format
      const ghosttyBgMatch = ghosttyContent.match(/background = (#[0-9a-f]{6})/i);
      const ghosttyBg = ghosttyBgMatch ? ghosttyBgMatch[1] : null;
      
      const opencodeBg = opencodeTheme.defs.bg;
      
      expect(ghosttyBg).toBeDefined();
      expect(opencodeBg).toBeDefined();
      expect(ghosttyBg!.toLowerCase()).toBe(opencodeBg.toLowerCase());
    });
  });
  
  describe('Theme synchronization scenarios', () => {
    test('should preserve all ANSI colors during sync', async () => {
      const imagePath = join(testDir, 'ansi-test.png');
      await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 20, g: 20, b: 30 }
        }
      }).png().toFile(imagePath);
      
      const palette = await extractPaletteFromImage(imagePath);
      
      const ghosttyPath = writeGhosttyTheme('ansi-theme', palette);
      createdThemePaths.push(ghosttyPath);
      const ghosttyContent = readFileSync(ghosttyPath, 'utf-8');
      
      // Verify all 16 ANSI colors are present
      for (let i = 0; i <= 15; i++) {
        expect(ghosttyContent).toContain(`palette = ${i}=`);
      }
      
      const opencodePath = writeOpenCodeTheme('ansi-theme', palette);
      createdThemePaths.push(opencodePath);
      const opencodeTheme = JSON.parse(readFileSync(opencodePath, 'utf-8'));
      
      // Verify all color defs exist
      const colorKeys = [
        'black', 'red', 'green', 'orange', 'blue', 'magenta', 'cyan', 'white',
        'brightBlack', 'brightRed', 'brightGreen', 'brightOrange', 
        'brightBlue', 'brightMagenta', 'brightCyan', 'brightWhite'
      ];
      
      for (const key of colorKeys) {
        expect(opencodeTheme.defs[key]).toBeDefined();
      }
    });
  });
  
  describe('Theme naming and detection', () => {
    test('should handle theme name variations', () => {
      const variations = [
        'My Theme',
        'my-theme',
        'my_theme',
        'MY_THEME',
        'MyTheme'
      ];
      
      const normalize = (name: string) => 
        name.toLowerCase().replace(/[\s-_]+/g, '');
      
      const normalized = variations.map(normalize);
      
      // All should normalize similarly for comparison
      expect(new Set(normalized).size).toBeLessThanOrEqual(2);
    });
  });
  
  describe('Error handling and edge cases', () => {
    test('should handle corrupted image gracefully', async () => {
      const corruptPath = join(testDir, 'corrupt.png');
      writeFileSync(corruptPath, 'not a real image');
      
      await expect(extractPaletteFromImage(corruptPath)).rejects.toThrow();
    });
    
    test('should handle very small image', async () => {
      const tinyPath = join(testDir, 'tiny.png');
      await sharp({
        create: {
          width: 1,
          height: 1,
          channels: 3,
          background: { r: 128, g: 128, b: 128 }
        }
      }).png().toFile(tinyPath);
      
      const palette = await extractPaletteFromImage(tinyPath);
      
      expect(palette).toBeDefined();
      expect(Object.keys(palette).length).toBe(20);
    });
    
    test('should handle large image efficiently', async () => {
      const largePath = join(testDir, 'large.png');
      await sharp({
        create: {
          width: 4000,
          height: 3000,
          channels: 3,
          background: { r: 100, g: 100, b: 150 }
        }
      }).png().toFile(largePath);
      
      const startTime = Date.now();
      const palette = await extractPaletteFromImage(largePath);
      const duration = Date.now() - startTime;
      
      expect(palette).toBeDefined();
      // Should complete in reasonable time (< 5 seconds)
      expect(duration).toBeLessThan(5000);
    });
  });
  
  describe('Color accuracy', () => {
    test('should extract predominant colors correctly', async () => {
      // Create image with specific red tone
      const redPath = join(testDir, 'red-image.png');
      await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 200, g: 50, b: 50 }
        }
      }).png().toFile(redPath);
      
      const palette = await extractPaletteFromImage(redPath);
      
      // Background should be reddish
      const getRed = (hex: string) => parseInt(hex.slice(1, 3), 16);
      const getGreen = (hex: string) => parseInt(hex.slice(3, 5), 16);
      const getBlue = (hex: string) => parseInt(hex.slice(5, 7), 16);
      
      const r = getRed(palette.background);
      const g = getGreen(palette.background);
      const b = getBlue(palette.background);
      
      // Red component should be dominant
      expect(r).toBeGreaterThan(g);
      expect(r).toBeGreaterThan(b);
    });
  });
  
  describe('Performance benchmarks', () => {
    test('should process typical wallpaper size efficiently', async () => {
      const wallpaperPath = join(testDir, 'wallpaper.png');
      await sharp({
        create: {
          width: 1920,
          height: 1080,
          channels: 3,
          background: { r: 80, g: 100, b: 120 }
        }
      }).png().toFile(wallpaperPath);
      
      const iterations = 3;
      const times: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await extractPaletteFromImage(wallpaperPath);
        times.push(Date.now() - start);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      
      // Should average under 2 seconds
      expect(avgTime).toBeLessThan(2000);
    });
  });
});
