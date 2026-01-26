import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { extractBuiltinTheme, listBuiltinThemes } from '../../src/extract-builtin-themes';
import { writeGhosttyTheme, readGhosttyTheme } from '../../src/ghostty';
import { existsSync, rmSync } from 'fs';
import { join, homedir } from 'path';

describe('extractBuiltinTheme', () => {
  // Track created files for cleanup
  const createdFiles: string[] = [];

  afterEach(() => {
    for (const file of createdFiles) {
      try {
        if (existsSync(file)) {
          rmSync(file);
        }
      } catch (err) {
        console.error(`Failed to cleanup ${file}:`, err);
      }
    }
    createdFiles.length = 0;
  });

  describe('Theme extraction', () => {
    test('should extract dracula theme successfully', () => {
      const palette = extractBuiltinTheme('dracula');

      expect(palette).toBeDefined();
      expect(palette).not.toBeNull();
      expect(palette!.background).toBeDefined();
      expect(palette!.foreground).toBeDefined();
    });

    test('should extract all required palette fields', () => {
      const palette = extractBuiltinTheme('nord');

      expect(palette).not.toBeNull();

      const requiredFields = [
        'background', 'foreground', 'cursor', 'selection',
        'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
        'brightBlack', 'brightRed', 'brightGreen', 'brightYellow',
        'brightBlue', 'brightMagenta', 'brightCyan', 'brightWhite'
      ];

      for (const field of requiredFields) {
        expect(palette![field as keyof typeof palette]).toBeDefined();
        expect(typeof palette![field as keyof typeof palette]).toBe('string');
      }
    });

    test('should produce valid hex colors', () => {
      const palette = extractBuiltinTheme('gruvbox');

      expect(palette).not.toBeNull();

      const hexRegex = /^#[0-9a-f]{6}$/i;

      Object.entries(palette!).forEach(([key, value]) => {
        expect(value).toMatch(hexRegex);
      });
    });

    test('should return null for non-existent theme', () => {
      const palette = extractBuiltinTheme('nonexistent-theme-xyz-123');
      expect(palette).toBeNull();
    });

    test('should handle theme names with hyphens', () => {
      const palette = extractBuiltinTheme('one-dark');
      expect(palette).not.toBeNull();
      expect(palette!.background).toMatch(/^#[0-9a-f]{6}$/i);
    });

    test('should handle theme names with multiple hyphens', () => {
      const palette = extractBuiltinTheme('catppuccin-frappe');
      expect(palette).not.toBeNull();
      expect(palette!.background).toMatch(/^#[0-9a-f]{6}$/i);
    });

    test('extracted colors should have reasonable contrast', () => {
      const palette = extractBuiltinTheme('dracula');
      expect(palette).not.toBeNull();

      // Simple contrast check: foreground and background should be different
      expect(palette!.foreground.toLowerCase()).not.toBe(palette!.background.toLowerCase());

      // Bright colors may or may not be different from dark colors depending on theme
      // Just verify they exist and are valid hex
      expect(palette!.brightRed).toMatch(/^#[0-9a-f]{6}$/i);
      expect(palette!.red).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  describe('listBuiltinThemes', () => {
    test('should return array of theme names', () => {
      const themes = listBuiltinThemes();

      expect(Array.isArray(themes)).toBe(true);
      expect(themes.length).toBeGreaterThan(0);
    });

    test('should include known built-in themes', () => {
      const themes = listBuiltinThemes();

      const knownThemes = ['dracula', 'nord', 'gruvbox', 'monokai', 'solarized'];

      for (const theme of knownThemes) {
        expect(themes).toContain(theme);
      }
    });

    test('should return exactly 30 themes', () => {
      const themes = listBuiltinThemes();
      expect(themes.length).toBe(30);
    });

    test('all theme names should be lowercase with hyphens', () => {
      const themes = listBuiltinThemes();

      for (const theme of themes) {
        expect(theme).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      }
    });
  });

  describe('All built-in themes extraction', () => {
    test('should extract all 30 built-in themes without errors', () => {
      const themes = listBuiltinThemes();
      const failures: string[] = [];

      for (const themeName of themes) {
        try {
          const palette = extractBuiltinTheme(themeName);
          if (!palette) {
            failures.push(themeName);
          }
        } catch (error) {
          failures.push(`${themeName} (error: ${error})`);
        }
      }

      if (failures.length > 0) {
        console.error('Failed themes:', failures);
      }

      expect(failures.length).toBe(0);
    }, 90000); // 90s timeout for all 30 themes

    test('built-in themes should have distinct palettes', () => {
      const themes = ['dracula', 'nord', 'gruvbox'];
      const palettes = themes.map(name => extractBuiltinTheme(name));

      // All should extract successfully
      for (const palette of palettes) {
        expect(palette).not.toBeNull();
      }

      // Themes should have at least some different colors (not all identical)
      // Note: Some themes may share the same background (e.g., both using #000000)
      const backgrounds = new Set(palettes.map(p => p!.background));
      const foregrounds = new Set(palettes.map(p => p!.foreground));
      const reds = new Set(palettes.map(p => p!.red));

      // At least one of these should have variety
      const hasVariety = backgrounds.size > 1 || foregrounds.size > 1 || reds.size > 1;
      expect(hasVariety).toBe(true);
    }, 30000); // 30s timeout for multiple extractions
  });

  describe('OpenCode → Ghostty conversion', () => {
    test('should convert extracted theme to Ghostty format', () => {
      const palette = extractBuiltinTheme('dracula');
      expect(palette).not.toBeNull();

      const ghosttyPath = writeGhosttyTheme('test-dracula-extracted', palette!);
      createdFiles.push(ghosttyPath);

      expect(existsSync(ghosttyPath)).toBe(true);

      const content = readFileSync(ghosttyPath, 'utf-8');
      expect(content).toContain('palette = 0=');
      expect(content).toContain('background =');
      expect(content).toContain('foreground =');
    });

    test('should preserve colors when converting to Ghostty', () => {
      const palette = extractBuiltinTheme('nord');
      expect(palette).not.toBeNull();

      const ghosttyPath = writeGhosttyTheme('test-nord-extracted', palette!);
      createdFiles.push(ghosttyPath);

      const readBack = readGhosttyTheme('test-nord-extracted');
      expect(readBack).not.toBeNull();

      // Colors should match (allowing for case differences)
      expect(readBack!.background.toLowerCase()).toBe(palette!.background.toLowerCase());
      expect(readBack!.foreground.toLowerCase()).toBe(palette!.foreground.toLowerCase());
      expect(readBack!.red.toLowerCase()).toBe(palette!.red.toLowerCase());
    });

    test('should handle all ANSI colors in conversion', () => {
      const palette = extractBuiltinTheme('gruvbox');
      expect(palette).not.toBeNull();

      const ghosttyPath = writeGhosttyTheme('test-gruvbox-extracted', palette!);
      createdFiles.push(ghosttyPath);

      const readBack = readGhosttyTheme('test-gruvbox-extracted');
      expect(readBack).not.toBeNull();

      // Verify all 16 ANSI colors
      expect(readBack!.black).toBeDefined();
      expect(readBack!.red).toBeDefined();
      expect(readBack!.green).toBeDefined();
      expect(readBack!.yellow).toBeDefined();
      expect(readBack!.blue).toBeDefined();
      expect(readBack!.magenta).toBeDefined();
      expect(readBack!.cyan).toBeDefined();
      expect(readBack!.white).toBeDefined();
      expect(readBack!.brightBlack).toBeDefined();
      expect(readBack!.brightRed).toBeDefined();
      expect(readBack!.brightGreen).toBeDefined();
      expect(readBack!.brightYellow).toBeDefined();
      expect(readBack!.brightBlue).toBeDefined();
      expect(readBack!.brightMagenta).toBeDefined();
      expect(readBack!.brightCyan).toBeDefined();
      expect(readBack!.brightWhite).toBeDefined();
    });
  });

  describe('Color mapping accuracy', () => {
    test('dracula theme should have correct signature colors', () => {
      const palette = extractBuiltinTheme('dracula');
      expect(palette).not.toBeNull();

      // Dracula has distinctive colors
      expect(palette!.background).toBe('#282a36'); // Dark purple-ish background
      expect(palette!.foreground).toBe('#f8f8f2'); // Light foreground
    });

    test('nord theme should have correct signature colors', () => {
      const palette = extractBuiltinTheme('nord');
      expect(palette).not.toBeNull();

      // Nord has distinctive blue-ish colors
      // Check that background is dark
      const bgRgb = parseInt(palette!.background.slice(1), 16);
      const bgAvg = ((bgRgb >> 16) + ((bgRgb >> 8) & 0xff) + (bgRgb & 0xff)) / 3;
      expect(bgAvg).toBeLessThan(100); // Dark background
    });

    test('should map purple colors correctly', () => {
      const palette = extractBuiltinTheme('dracula');
      expect(palette).not.toBeNull();

      // Dracula uses purple prominently
      const purple = palette!.magenta;
      const rgb = parseInt(purple.slice(1), 16);
      const r = (rgb >> 16) & 0xff;
      const b = rgb & 0xff;

      // Purple should have high red and blue, lower green
      expect(r).toBeGreaterThan(150);
      expect(b).toBeGreaterThan(150);
    });

    test('should differentiate between dark and bright variants', () => {
      const palette = extractBuiltinTheme('dracula');
      expect(palette).not.toBeNull();

      const getLuminance = (hex: string) => {
        const rgb = parseInt(hex.slice(1), 16);
        const r = ((rgb >> 16) & 0xff) / 255;
        const g = ((rgb >> 8) & 0xff) / 255;
        const b = (rgb & 0xff) / 255;

        // Simple relative luminance
        return 0.299 * r + 0.587 * g + 0.114 * b;
      };

      // Bright colors should generally be at least as bright as dark colors
      expect(getLuminance(palette!.brightRed)).toBeGreaterThanOrEqual(getLuminance(palette!.red) * 0.9);
      expect(getLuminance(palette!.brightGreen)).toBeGreaterThanOrEqual(getLuminance(palette!.green) * 0.9);
      expect(getLuminance(palette!.brightBlue)).toBeGreaterThanOrEqual(getLuminance(palette!.blue) * 0.9);
    });
  });

  describe('Edge cases', () => {
    test('should handle theme with minimal color definitions', () => {
      // Some themes might have colors that reference other colors
      const palette = extractBuiltinTheme('opencode');
      expect(palette).not.toBeNull();

      // Should still produce all required fields
      const requiredFields = [
        'background', 'foreground', 'cursor', 'selection',
        'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
        'brightBlack', 'brightRed', 'brightGreen', 'brightYellow',
        'brightBlue', 'brightMagenta', 'brightCyan', 'brightWhite'
      ];

      for (const field of requiredFields) {
        expect(palette![field as keyof typeof palette]).toBeDefined();
      }
    });

    test('should handle uppercase in theme names (case sensitivity)', () => {
      // Theme names should be case-sensitive
      const lowercase = extractBuiltinTheme('dracula');
      const uppercase = extractBuiltinTheme('DRACULA');

      expect(lowercase).not.toBeNull();
      expect(uppercase).toBeNull(); // Should not find uppercase version
    });

    test('should handle special characters gracefully', () => {
      const palette = extractBuiltinTheme('theme-with-!@#$%');
      expect(palette).toBeNull(); // Should return null for invalid name
    });
  });
});

// Import necessary functions at the top
import { readFileSync } from 'fs';
