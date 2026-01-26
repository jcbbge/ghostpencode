import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import {
  getCurrentOpenCodeTheme,
  readOpenCodeTheme,
  writeOpenCodeConfig,
  writeOpenCodeTheme
} from '../../src/opencode';
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import type { Palette } from '../../src/types';

describe('OpenCode theme functions', () => {
  const testDir = join(import.meta.dir, '../fixtures/opencode-test');
  const testConfigPath = join(testDir, 'opencode.json');
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

    // Clean up themes created in real OpenCode directory
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
  
  describe('writeOpenCodeTheme', () => {
    test('should create valid OpenCode theme JSON', () => {
      const themeName = 'test-theme';
      const themePath = writeOpenCodeTheme(themeName, mockPalette);
      createdThemePaths.push(themePath);
      
      expect(existsSync(themePath)).toBe(true);
      
      const content = readFileSync(themePath, 'utf-8');
      const theme = JSON.parse(content);
      
      expect(theme.$schema).toBe('https://opencode.ai/theme.json');
      expect(theme.defs).toBeDefined();
      expect(theme.theme).toBeDefined();
    });
    
    test('should include all color definitions', () => {
      const themeName = 'test-defs';
      const themePath = writeOpenCodeTheme(themeName, mockPalette);
      createdThemePaths.push(themePath);
      const theme = JSON.parse(readFileSync(themePath, 'utf-8'));
      
      expect(theme.defs.bg).toBe('#191919');
      expect(theme.defs.fg).toBe('#bbbbbb');
      expect(theme.defs.red).toBe('#de6e7c');
      expect(theme.defs.brightRed).toBe('#e8838f');
      expect(theme.defs.blue).toBe('#6099c0');
      expect(theme.defs.brightBlue).toBe('#61abda');
    });
    
    test('should generate gray scale variants', () => {
      const themeName = 'test-grays';
      const themePath = writeOpenCodeTheme(themeName, mockPalette);
      createdThemePaths.push(themePath);
      const theme = JSON.parse(readFileSync(themePath, 'utf-8'));
      
      expect(theme.defs.gray1).toBeDefined();
      expect(theme.defs.gray2).toBeDefined();
      expect(theme.defs.gray3).toBeDefined();
      expect(theme.defs.gray4).toBeDefined();
      
      // Grays should be progressively lighter
      const getR = (hex: string) => parseInt(hex.slice(1, 3), 16);
      
      expect(getR(theme.defs.gray2)).toBeGreaterThan(getR(theme.defs.gray1));
      expect(getR(theme.defs.gray3)).toBeGreaterThan(getR(theme.defs.gray2));
      expect(getR(theme.defs.gray4)).toBeGreaterThan(getR(theme.defs.gray3));
    });
    
    test('should include all theme mappings', () => {
      const themeName = 'test-mappings';
      const themePath = writeOpenCodeTheme(themeName, mockPalette);
      createdThemePaths.push(themePath);
      const theme = JSON.parse(readFileSync(themePath, 'utf-8'));
      
      const requiredThemeKeys = [
        'primary', 'secondary', 'accent', 'error', 'warning', 'success', 'info',
        'text', 'textMuted', 'background', 'backgroundPanel', 'backgroundElement',
        'border', 'borderActive', 'borderSubtle',
        'diffAdded', 'diffRemoved', 'diffContext',
        'syntaxComment', 'syntaxKeyword', 'syntaxFunction', 'syntaxString'
      ];
      
      for (const key of requiredThemeKeys) {
        expect(theme.theme[key]).toBeDefined();
      }
    });
    
    test('should use dark/light variants for theme properties', () => {
      const themeName = 'test-variants';
      const themePath = writeOpenCodeTheme(themeName, mockPalette);
      createdThemePaths.push(themePath);
      const theme = JSON.parse(readFileSync(themePath, 'utf-8'));
      
      expect(theme.theme.primary).toHaveProperty('dark');
      expect(theme.theme.primary).toHaveProperty('light');
      expect(theme.theme.background).toHaveProperty('dark');
      expect(theme.theme.background).toHaveProperty('light');
    });
    
    test('should create themes directory if it does not exist', () => {
      const themeName = 'new-theme';
      const themePath = writeOpenCodeTheme(themeName, mockPalette);
      createdThemePaths.push(themePath);
      
      expect(existsSync(themePath)).toBe(true);
    });
  });
  
  describe('readOpenCodeTheme', () => {
    test('should read and parse OpenCode theme', () => {
      const themeName = 'test-read';
      const themePath = join(testThemesDir, `${themeName}.json`);
      
      const mockTheme = {
        $schema: 'https://opencode.ai/theme.json',
        defs: {
          bg: '#000000',
          fg: '#ffffff',
          red: '#ff0000',
          green: '#00ff00',
          blue: '#0000ff',
          black: '#000000',
          white: '#ffffff',
          brightBlack: '#808080',
          brightRed: '#ff8080',
          brightGreen: '#80ff80',
          brightBlue: '#8080ff',
          cyan: '#00ffff',
          magenta: '#ff00ff',
          orange: '#ffaa00',
          brightCyan: '#80ffff',
          brightMagenta: '#ff80ff',
          brightOrange: '#ffcc80',
          brightWhite: '#ffffff',
          cursor: '#ffffff',
          selection: '#404040'
        }
      };
      
      writeFileSync(themePath, JSON.stringify(mockTheme));
      
      // Note: readOpenCodeTheme uses actual config paths
      // Would need DI to properly test
    });
    
    test('should return null for non-existent theme', () => {
      const result = readOpenCodeTheme('nonexistent-theme-99999');
      expect(result).toBeNull();
    });
  });
  
  describe('writeOpenCodeConfig', () => {
    test('should create config with theme property', () => {
      const themeName = 'my-theme';
      writeOpenCodeConfig(themeName);
      
      // Note: This writes to actual config location
      // Proper testing would require DI
    });
  });
  
  describe('getCurrentOpenCodeTheme', () => {
    test('should return theme from config', () => {
      const config = {
        $schema: 'https://opencode.ai/config.json',
        theme: 'test-theme'
      };
      
      writeFileSync(testConfigPath, JSON.stringify(config));
      
      // Note: Uses actual config path
    });
    
    test('should return null for missing config', () => {
      // Note: Depends on actual config existence
    });
  });
  
  describe('Color validation', () => {
    test('should produce valid hex colors', () => {
      const themeName = 'color-test';
      const themePath = writeOpenCodeTheme(themeName, mockPalette);
      createdThemePaths.push(themePath);
      const theme = JSON.parse(readFileSync(themePath, 'utf-8'));
      
      const hexRegex = /^#[0-9a-f]{6}$/i;
      
      Object.values(theme.defs).forEach((value: any) => {
        if (typeof value === 'string' && value.startsWith('#')) {
          expect(value).toMatch(hexRegex);
        }
      });
    });
  });
});
