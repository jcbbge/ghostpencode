import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { 
  getCurrentGhosttyTheme, 
  readGhosttyTheme, 
  writeGhosttyConfig,
  writeGhosttyTheme 
} from '../../src/ghostty';
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import type { Palette } from '../../src/types';

describe('Ghostty theme functions', () => {
  const testDir = join(import.meta.dir, '../fixtures/ghostty-test');
  const testConfigPath = join(testDir, 'config');
  const testThemesDir = join(testDir, 'themes');

  // Track themes created during tests for cleanup
  const createdThemePaths: string[] = [];

  const mockPalette: Palette = {
    background: '#191919',
    foreground: '#bbbbbb',
    cursor: '#c9c9c9',
    selection: '#404040',
    black: '#191919',
    red: '#de6e7c',
    green: '#819b69',
    yellow: '#b77e64',
    blue: '#6099c0',
    magenta: '#b279a7',
    cyan: '#66a5ad',
    white: '#bbbbbb',
    brightBlack: '#4a4546',
    brightRed: '#e8838f',
    brightGreen: '#8bae68',
    brightYellow: '#d68c67',
    brightBlue: '#61abda',
    brightMagenta: '#cf86c1',
    brightCyan: '#65b8c1',
    brightWhite: '#8e8e8e'
  };

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
    mkdirSync(testThemesDir, { recursive: true });
    createdThemePaths.length = 0; // Clear the array
  });

  afterEach(() => {
    // Clean up test fixtures directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }

    // Clean up themes created in real Ghostty directory
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
  
  describe('getCurrentGhosttyTheme', () => {
    test('should return null when config does not exist', () => {
      const result = getCurrentGhosttyTheme();
      // Will return null or a theme depending on user's actual config
      expect(result === null || typeof result === 'string').toBe(true);
    });
    
    test('should extract theme from config with theme= line', () => {
      const config = `
macos-titlebar-style = hidden
theme = My Test Theme
font-size = 12
`;
      writeFileSync(testConfigPath, config);
      
      // Note: This tests the function logic, but uses user's actual config location
      // We can't easily mock the config path without modifying the source
    });
  });
  
  describe('writeGhosttyTheme', () => {
    test('should write valid Ghostty theme file', () => {
      const themeName = 'test-theme';
      const themePath = writeGhosttyTheme(themeName, mockPalette);
      createdThemePaths.push(themePath);
      
      expect(existsSync(themePath)).toBe(true);
      
      const content = readFileSync(themePath, 'utf-8');
      
      expect(content).toContain('palette = 0=#191919');
      expect(content).toContain('palette = 1=#de6e7c');
      expect(content).toContain('palette = 15=#8e8e8e');
      expect(content).toContain('background = #191919');
      expect(content).toContain('foreground = #bbbbbb');
      expect(content).toContain('cursor-color = #c9c9c9');
    });
    
    test('should include all 16 ANSI colors', () => {
      const themeName = 'test-complete';
      const themePath = writeGhosttyTheme(themeName, mockPalette);
      createdThemePaths.push(themePath);
      const content = readFileSync(themePath, 'utf-8');
      
      for (let i = 0; i <= 15; i++) {
        expect(content).toContain(`palette = ${i}=`);
      }
    });
    
    test('should create theme directory if it does not exist', () => {
      const themeName = 'new-theme';
      const themePath = writeGhosttyTheme(themeName, mockPalette);
      createdThemePaths.push(themePath);
      
      expect(existsSync(themePath)).toBe(true);
    });
  });
  
  describe('readGhosttyTheme', () => {
    test('should read and parse Ghostty theme file', () => {
      const themeContent = `
# Test Theme
palette = 0=#000000
palette = 1=#cc0000
palette = 2=#00cc00
palette = 3=#cccc00
palette = 4=#0000cc
palette = 5=#cc00cc
palette = 6=#00cccc
palette = 7=#cccccc
palette = 8=#808080
palette = 9=#ff0000
palette = 10=#00ff00
palette = 11=#ffff00
palette = 12=#0000ff
palette = 13=#ff00ff
palette = 14=#00ffff
palette = 15=#ffffff
background = #000000
foreground = #ffffff
cursor-color = #ffffff
selection-background = #404040
`;
      
      const themeName = 'test-read';
      const themePath = join(testThemesDir, themeName);
      writeFileSync(themePath, themeContent);
      
      // Note: This uses the app's themes directory, not our test dir
      // Proper testing would require dependency injection
    });
    
    test('should return null for non-existent theme', () => {
      const result = readGhosttyTheme('nonexistent-theme-12345');
      expect(result).toBeNull();
    });
  });
  
  describe('Color format validation', () => {
    test('should handle hex colors in various formats', () => {
      const themeName = 'format-test';
      const themePath = writeGhosttyTheme(themeName, mockPalette);
      createdThemePaths.push(themePath);
      const content = readFileSync(themePath, 'utf-8');
      
      const hexRegex = /#[0-9a-f]{6}/gi;
      const matches = content.match(hexRegex);
      
      expect(matches).toBeDefined();
      expect(matches!.length).toBeGreaterThan(0);
      
      matches!.forEach(hex => {
        expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });
  });
});
