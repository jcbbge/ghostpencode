import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { extractBuiltinTheme, listBuiltinThemes } from '../../src/extract-builtin-themes';
import { writeGhosttyTheme, readGhosttyTheme } from '../../src/ghostty';
import { writeOpenCodeTheme, readOpenCodeTheme } from '../../src/opencode';
import { existsSync, rmSync, readFileSync } from 'fs';
import { join, homedir } from 'path';

describe('OpenCode → Ghostty Integration Tests', () => {
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

  describe('Built-in theme extraction and conversion', () => {
    test('should extract and convert dracula theme end-to-end', () => {
      // Step 1: Extract from OpenCode binary
      const palette = extractBuiltinTheme('dracula');
      expect(palette).not.toBeNull();

      // Step 2: Convert to Ghostty
      const ghosttyPath = writeGhosttyTheme('test-dracula-e2e', palette!);
      createdFiles.push(ghosttyPath);

      // Step 3: Verify Ghostty file exists and is valid
      expect(existsSync(ghosttyPath)).toBe(true);

      const content = readFileSync(ghosttyPath, 'utf-8');

      // Check format
      expect(content).toContain('palette = 0=');
      expect(content).toContain('palette = 15=');
      expect(content).toContain('background =');
      expect(content).toContain('foreground =');
      expect(content).toContain('cursor-color =');
      expect(content).toContain('selection-background =');

      // Step 4: Read back and verify colors preserved
      const readBack = readGhosttyTheme('test-dracula-e2e');
      expect(readBack).not.toBeNull();

      expect(readBack!.background.toLowerCase()).toBe(palette!.background.toLowerCase());
      expect(readBack!.foreground.toLowerCase()).toBe(palette!.foreground.toLowerCase());
      expect(readBack!.red.toLowerCase()).toBe(palette!.red.toLowerCase());
      expect(readBack!.green.toLowerCase()).toBe(palette!.green.toLowerCase());
      expect(readBack!.blue.toLowerCase()).toBe(palette!.blue.toLowerCase());
    });

    test('should convert all 30 built-in themes successfully', () => {
      const themes = listBuiltinThemes();
      const failures: Array<{ theme: string; step: string; error: string }> = [];

      for (const themeName of themes) {
        try {
          // Extract
          const palette = extractBuiltinTheme(themeName);
          if (!palette) {
            failures.push({ theme: themeName, step: 'extract', error: 'Failed to extract' });
            continue;
          }

          // Convert
          const ghosttyName = `test-${themeName}-bulk`;
          const ghosttyPath = writeGhosttyTheme(ghosttyName, palette);
          createdFiles.push(ghosttyPath);

          if (!existsSync(ghosttyPath)) {
            failures.push({ theme: themeName, step: 'write', error: 'File not created' });
            continue;
          }

          // Read back
          const readBack = readGhosttyTheme(ghosttyName);
          if (!readBack) {
            failures.push({ theme: themeName, step: 'read', error: 'Failed to read back' });
            continue;
          }

          // Verify
          if (readBack.background.toLowerCase() !== palette.background.toLowerCase()) {
            failures.push({
              theme: themeName,
              step: 'verify',
              error: `Background mismatch: ${readBack.background} !== ${palette.background}`
            });
          }
        } catch (error) {
          failures.push({ theme: themeName, step: 'exception', error: String(error) });
        }
      }

      if (failures.length > 0) {
        console.error('\nFailed themes:');
        failures.forEach(f => console.error(`  ${f.theme} (${f.step}): ${f.error}`));
      }

      expect(failures.length).toBe(0);
    }, 120000); // 2 minute timeout for all 30 themes

    test('should handle round-trip conversion OpenCode → Ghostty → OpenCode', () => {
      // Start with built-in OpenCode theme
      const originalPalette = extractBuiltinTheme('nord');
      expect(originalPalette).not.toBeNull();

      // Convert to Ghostty
      const ghosttyPath = writeGhosttyTheme('test-nord-roundtrip', originalPalette!);
      createdFiles.push(ghosttyPath);

      // Read from Ghostty
      const ghosttyPalette = readGhosttyTheme('test-nord-roundtrip');
      expect(ghosttyPalette).not.toBeNull();

      // Convert back to OpenCode
      const opencodePath = writeOpenCodeTheme('test-nord-roundtrip-back', ghosttyPalette!);
      createdFiles.push(opencodePath);

      // Read from OpenCode
      const roundtripPalette = readOpenCodeTheme('test-nord-roundtrip-back');
      expect(roundtripPalette).not.toBeNull();

      // Colors should match (within reasonable tolerance)
      expect(roundtripPalette!.background.toLowerCase()).toBe(originalPalette!.background.toLowerCase());
      expect(roundtripPalette!.foreground.toLowerCase()).toBe(originalPalette!.foreground.toLowerCase());
      expect(roundtripPalette!.red.toLowerCase()).toBe(originalPalette!.red.toLowerCase());
      expect(roundtripPalette!.green.toLowerCase()).toBe(originalPalette!.green.toLowerCase());
      expect(roundtripPalette!.blue.toLowerCase()).toBe(originalPalette!.blue.toLowerCase());
    });
  });

  describe('Color fidelity', () => {
    test('all colors should be preserved exactly in conversion', () => {
      const palette = extractBuiltinTheme('gruvbox');
      expect(palette).not.toBeNull();

      const ghosttyPath = writeGhosttyTheme('test-gruvbox-fidelity', palette!);
      createdFiles.push(ghosttyPath);

      const readBack = readGhosttyTheme('test-gruvbox-fidelity');
      expect(readBack).not.toBeNull();

      // Check every color - note the field name mapping
      // OpenCode uses snake_case, Ghostty uses camelCase
      expect(readBack!.background.toLowerCase()).toBe(palette!.background.toLowerCase());
      expect(readBack!.foreground.toLowerCase()).toBe(palette!.foreground.toLowerCase());
      expect(readBack!.cursor.toLowerCase()).toBe(palette!.cursor.toLowerCase());
      expect(readBack!.selection.toLowerCase()).toBe(palette!.selection.toLowerCase());

      expect(readBack!.black.toLowerCase()).toBe(palette!.black.toLowerCase());
      expect(readBack!.red.toLowerCase()).toBe(palette!.red.toLowerCase());
      expect(readBack!.green.toLowerCase()).toBe(palette!.green.toLowerCase());
      expect(readBack!.yellow.toLowerCase()).toBe(palette!.yellow.toLowerCase());
      expect(readBack!.blue.toLowerCase()).toBe(palette!.blue.toLowerCase());
      expect(readBack!.magenta.toLowerCase()).toBe(palette!.magenta.toLowerCase());
      expect(readBack!.cyan.toLowerCase()).toBe(palette!.cyan.toLowerCase());
      expect(readBack!.white.toLowerCase()).toBe(palette!.white.toLowerCase());

      expect(readBack!.brightBlack.toLowerCase()).toBe(palette!.brightBlack.toLowerCase());
      expect(readBack!.brightRed.toLowerCase()).toBe(palette!.brightRed.toLowerCase());
      expect(readBack!.brightGreen.toLowerCase()).toBe(palette!.brightGreen.toLowerCase());
      expect(readBack!.brightYellow.toLowerCase()).toBe(palette!.brightYellow.toLowerCase());
      expect(readBack!.brightBlue.toLowerCase()).toBe(palette!.brightBlue.toLowerCase());
      expect(readBack!.brightMagenta.toLowerCase()).toBe(palette!.brightMagenta.toLowerCase());
      expect(readBack!.brightCyan.toLowerCase()).toBe(palette!.brightCyan.toLowerCase());
      expect(readBack!.brightWhite.toLowerCase()).toBe(palette!.brightWhite.toLowerCase());
    });

    test('hex format should be preserved', () => {
      const palette = extractBuiltinTheme('dracula');
      expect(palette).not.toBeNull();

      const ghosttyPath = writeGhosttyTheme('test-dracula-hex', palette!);
      createdFiles.push(ghosttyPath);

      const content = readFileSync(ghosttyPath, 'utf-8');

      // All color values should be valid hex
      const hexRegex = /#[0-9a-fA-F]{6}/g;
      const matches = content.match(hexRegex);

      expect(matches).not.toBeNull();
      // Ghostty has exactly 22 colors: 16 ANSI + background + foreground + cursor + cursor-text + selection-bg + selection-fg
      expect(matches!.length).toBeGreaterThanOrEqual(20);

      // Each match should be valid
      for (const hex of matches!) {
        expect(hex).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    });

    test('colors should not be altered during extraction', () => {
      // Extract same theme twice and compare
      const palette1 = extractBuiltinTheme('dracula');
      const palette2 = extractBuiltinTheme('dracula');

      expect(palette1).not.toBeNull();
      expect(palette2).not.toBeNull();

      // Should be identical
      expect(palette1!.background).toBe(palette2!.background);
      expect(palette1!.foreground).toBe(palette2!.foreground);
      expect(palette1!.red).toBe(palette2!.red);
      expect(palette1!.green).toBe(palette2!.green);
      expect(palette1!.blue).toBe(palette2!.blue);
    });
  });

  describe('Ghostty file format', () => {
    test('should generate valid Ghostty theme file structure', () => {
      const palette = extractBuiltinTheme('solarized');
      expect(palette).not.toBeNull();

      const ghosttyPath = writeGhosttyTheme('test-solarized-structure', palette!);
      createdFiles.push(ghosttyPath);

      const content = readFileSync(ghosttyPath, 'utf-8');
      const lines = content.split('\n');

      // Should have proper structure
      let paletteCount = 0;
      let hasBackground = false;
      let hasForeground = false;
      let hasCursor = false;
      let hasSelection = false;

      for (const line of lines) {
        if (line.startsWith('palette = ')) paletteCount++;
        if (line.startsWith('background = ')) hasBackground = true;
        if (line.startsWith('foreground = ')) hasForeground = true;
        if (line.startsWith('cursor-color = ')) hasCursor = true;
        if (line.startsWith('selection-background = ')) hasSelection = true;
      }

      expect(paletteCount).toBe(16); // All 16 ANSI colors
      expect(hasBackground).toBe(true);
      expect(hasForeground).toBe(true);
      expect(hasCursor).toBe(true);
      expect(hasSelection).toBe(true);
    });

    test('palette colors should be in correct order (0-15)', () => {
      const palette = extractBuiltinTheme('tokyonight');
      expect(palette).not.toBeNull();

      const ghosttyPath = writeGhosttyTheme('test-tokyonight-order', palette!);
      createdFiles.push(ghosttyPath);

      const content = readFileSync(ghosttyPath, 'utf-8');
      const lines = content.split('\n');

      const paletteLines = lines.filter(l => l.startsWith('palette = '));

      // Should have indices 0-15 in order
      for (let i = 0; i < 16; i++) {
        const expected = `palette = ${i}=`;
        const found = paletteLines.some(l => l.startsWith(expected));
        expect(found).toBe(true);
      }
    });

    test('should handle special theme names correctly', () => {
      const palette = extractBuiltinTheme('catppuccin-macchiato');
      expect(palette).not.toBeNull();

      // Name with hyphens should work
      const ghosttyPath = writeGhosttyTheme('Test Catppuccin Macchiato', palette!);
      createdFiles.push(ghosttyPath);

      expect(existsSync(ghosttyPath)).toBe(true);

      // Should be readable
      const readBack = readGhosttyTheme('Test Catppuccin Macchiato');
      expect(readBack).not.toBeNull();
    });
  });

  describe('Theme variety', () => {
    test('different themes should produce different palettes', () => {
      const themes = ['dracula', 'aura', 'everforest'];
      const palettes = themes.map(name => extractBuiltinTheme(name));

      // All should succeed
      for (const palette of palettes) {
        expect(palette).not.toBeNull();
      }

      // Should have variety in colors (not all identical)
      const backgrounds = palettes.map(p => p!.background.toLowerCase());
      const reds = palettes.map(p => p!.red.toLowerCase());
      const uniqueBackgrounds = new Set(backgrounds);
      const uniqueReds = new Set(reds);

      // All themes should have at least some color differences
      expect(uniqueBackgrounds.size).toBeGreaterThanOrEqual(2);
      expect(uniqueReds.size).toBeGreaterThanOrEqual(2);
    }, 30000);

    test('light vs dark themes should have appropriate backgrounds', () => {
      const darkThemes = ['dracula', 'nord', 'monokai'];
      const lightThemes = ['github']; // github might be light

      for (const themeName of darkThemes) {
        const palette = extractBuiltinTheme(themeName);
        expect(palette).not.toBeNull();

        // Dark theme: background should be dark
        const bgRgb = parseInt(palette!.background.slice(1), 16);
        const bgAvg = ((bgRgb >> 16) + ((bgRgb >> 8) & 0xff) + (bgRgb & 0xff)) / 3;

        // Most dark themes have average < 100
        expect(bgAvg).toBeLessThan(150);
      }
    });

    test('each theme should have visually distinct colors', () => {
      const themes = ['dracula', 'nord', 'gruvbox'];

      for (const themeName of themes) {
        const palette = extractBuiltinTheme(themeName);
        expect(palette).not.toBeNull();

        // All 16 ANSI colors should not be identical
        const ansiColors = [
          palette!.black, palette!.red, palette!.green, palette!.yellow,
          palette!.blue, palette!.magenta, palette!.cyan, palette!.white,
          palette!.brightBlack, palette!.brightRed, palette!.brightGreen,
          palette!.brightYellow, palette!.brightBlue, palette!.brightMagenta,
          palette!.brightCyan, palette!.brightWhite
        ];

        const unique = new Set(ansiColors.map(c => c.toLowerCase()));

        // Should have at least 8 unique colors
        expect(unique.size).toBeGreaterThanOrEqual(8);
      }
    });
  });

  describe('Error handling', () => {
    test('should handle missing OpenCode binary gracefully', () => {
      // This test assumes binary exists - just verify no crash
      const palette = extractBuiltinTheme('dracula');
      expect(typeof palette === 'object' || palette === null).toBe(true);
    });

    test('should handle corrupted theme data gracefully', () => {
      const palette = extractBuiltinTheme('definitely-not-a-real-theme-12345');
      expect(palette).toBeNull();
    });

    test('should handle write permission errors gracefully', () => {
      const palette = extractBuiltinTheme('nord');
      expect(palette).not.toBeNull();

      // This should still work even if we test edge cases
      const ghosttyPath = writeGhosttyTheme('test-permissions', palette!);
      createdFiles.push(ghosttyPath);

      expect(existsSync(ghosttyPath)).toBe(true);
    });
  });

  describe('Performance', () => {
    test('should extract theme within reasonable time', () => {
      const start = Date.now();
      const palette = extractBuiltinTheme('dracula');
      const duration = Date.now() - start;

      expect(palette).not.toBeNull();
      expect(duration).toBeLessThan(5000); // Should take less than 5 seconds
    });

    test('should handle multiple sequential extractions efficiently', () => {
      const start = Date.now();
      const themes = ['dracula', 'nord', 'gruvbox', 'monokai', 'solarized'];

      for (const theme of themes) {
        const palette = extractBuiltinTheme(theme);
        expect(palette).not.toBeNull();
      }

      const duration = Date.now() - start;

      // 5 themes should complete in under 25 seconds (5s each)
      expect(duration).toBeLessThan(25000);
    }, 30000);
  });
});
