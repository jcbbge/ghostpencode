import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { extractFromImage } from '../../src/sync';
import { readGhosttyTheme } from '../../src/ghostty';
import { readOpenCodeTheme } from '../../src/opencode';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const FIXTURES_DIR = join(import.meta.dir, '../fixtures');
const GHOSTTY_THEMES_DIR = join(homedir(), '.config/ghostty/themes');
const OPENCODE_THEMES_DIR = join(homedir(), '.config/opencode/themes');

describe('Theme Generation - End-to-End', () => {
  const testThemes = [
    { imageName: 'shopping-cart.png', ghosttyName: 'Shopping Cart', opencodeName: 'shopping-cart' },
    { imageName: 'chute-zone.png', ghosttyName: 'Chute Zone', opencodeName: 'chute-zone' },
    { imageName: 'extension-cord.png', ghosttyName: 'Extension Cord', opencodeName: 'extension-cord' },
    { imageName: 'guard-rail.png', ghosttyName: 'Guard Rail', opencodeName: 'guard-rail' },
  ];

  test('should create both Ghostty and OpenCode theme files', async () => {
    const imagePath = join(FIXTURES_DIR, 'shopping-cart.png');
    await extractFromImage(imagePath, 'shopping-cart');

    const ghosttyPath = join(GHOSTTY_THEMES_DIR, 'Shopping Cart');
    const opencodePath = join(OPENCODE_THEMES_DIR, 'shopping-cart.json');

    expect(existsSync(ghosttyPath)).toBe(true);
    expect(existsSync(opencodePath)).toBe(true);
  });

  test('should use correct naming convention (Title Case for Ghostty, kebab-case for OpenCode)', async () => {
    for (const { imageName, ghosttyName, opencodeName } of testThemes) {
      const imagePath = join(FIXTURES_DIR, imageName);
      const themeName = imageName.replace('.png', '');

      await extractFromImage(imagePath, themeName);

      const ghosttyPath = join(GHOSTTY_THEMES_DIR, ghosttyName);
      const opencodePath = join(OPENCODE_THEMES_DIR, `${opencodeName}.json`);

      expect(existsSync(ghosttyPath)).toBe(true);
      expect(existsSync(opencodePath)).toBe(true);
    }
  });

  test('Ghostty theme should have correct structure (16 palette colors)', async () => {
    const imagePath = join(FIXTURES_DIR, 'chute-zone.png');
    await extractFromImage(imagePath, 'chute-zone');

    const palette = readGhosttyTheme('Chute Zone');

    expect(palette).toBeDefined();
    expect(palette?.background).toMatch(/^#[0-9a-f]{6}$/i);
    expect(palette?.foreground).toMatch(/^#[0-9a-f]{6}$/i);

    // Check all 16 ANSI palette colors
    const ansiColors = [
      'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
      'brightBlack', 'brightRed', 'brightGreen', 'brightYellow',
      'brightBlue', 'brightMagenta', 'brightCyan', 'brightWhite'
    ] as const;

    for (const color of ansiColors) {
      expect(palette?.[color]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  test('OpenCode theme should have correct JSON structure', async () => {
    const imagePath = join(FIXTURES_DIR, 'extension-cord.png');
    await extractFromImage(imagePath, 'extension-cord');

    const palette = readOpenCodeTheme('extension-cord');

    expect(palette).toBeDefined();
    expect(palette?.background).toMatch(/^#[0-9a-f]{6}$/i);
    expect(palette?.foreground).toMatch(/^#[0-9a-f]{6}$/i);

    // OpenCode should also have all ANSI colors
    const ansiColors = [
      'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
      'brightBlack', 'brightRed', 'brightGreen', 'brightYellow',
      'brightBlue', 'brightMagenta', 'brightCyan', 'brightWhite'
    ] as const;

    for (const color of ansiColors) {
      expect(palette?.[color]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  test('both platforms should have matching color palettes', async () => {
    const imagePath = join(FIXTURES_DIR, 'guard-rail.png');
    await extractFromImage(imagePath, 'guard-rail');

    const ghosttyPalette = readGhosttyTheme('Guard Rail');
    const opencodePalette = readOpenCodeTheme('guard-rail');

    expect(ghosttyPalette).toBeDefined();
    expect(opencodePalette).toBeDefined();

    // Compare key colors (allowing for case differences)
    expect(ghosttyPalette?.background.toLowerCase()).toBe(opencodePalette?.background.toLowerCase());
    expect(ghosttyPalette?.foreground.toLowerCase()).toBe(opencodePalette?.foreground.toLowerCase());
    expect(ghosttyPalette?.red.toLowerCase()).toBe(opencodePalette?.red.toLowerCase());
    expect(ghosttyPalette?.green.toLowerCase()).toBe(opencodePalette?.green.toLowerCase());
    expect(ghosttyPalette?.blue.toLowerCase()).toBe(opencodePalette?.blue.toLowerCase());
  });

  test('should handle theme name with various formats', async () => {
    const testCases = [
      { input: 'my-theme', ghostty: 'My Theme', opencode: 'my-theme' },
      { input: 'Another Theme', ghostty: 'Another Theme', opencode: 'another-theme' },
      { input: 'Mixed_Case-Theme', ghostty: 'Mixed Case Theme', opencode: 'mixed-case-theme' },
    ];

    for (const { input, ghostty, opencode } of testCases) {
      const imagePath = join(FIXTURES_DIR, 'shopping-cart.png');
      await extractFromImage(imagePath, input);

      const ghosttyPath = join(GHOSTTY_THEMES_DIR, ghostty);
      const opencodePath = join(OPENCODE_THEMES_DIR, `${opencode}.json`);

      expect(existsSync(ghosttyPath)).toBe(true);
      expect(existsSync(opencodePath)).toBe(true);
    }
  });

  test('generated themes should be valid and loadable', async () => {
    for (const { imageName, ghosttyName, opencodeName } of testThemes) {
      // Both themes should be readable without errors
      const ghosttyPalette = readGhosttyTheme(ghosttyName);
      const opencodePalette = readOpenCodeTheme(opencodeName);

      expect(ghosttyPalette).toBeDefined();
      expect(opencodePalette).toBeDefined();

      // Should have all required fields
      expect(ghosttyPalette?.background).toBeDefined();
      expect(ghosttyPalette?.foreground).toBeDefined();
      expect(opencodePalette?.background).toBeDefined();
      expect(opencodePalette?.foreground).toBeDefined();
    }
  });

  test('Ghostty theme file should follow correct format', async () => {
    const imagePath = join(FIXTURES_DIR, 'shopping-cart.png');
    await extractFromImage(imagePath, 'test-format');

    const themePath = join(GHOSTTY_THEMES_DIR, 'Test Format');
    const content = await Bun.file(themePath).text();

    // Should have comment header
    expect(content).toContain('# Test Format');
    expect(content).toContain('# Generated by ghostpencode');

    // Should have all 16 palette entries (0-15)
    for (let i = 0; i <= 15; i++) {
      expect(content).toContain(`palette = ${i}=#`);
    }

    // Should have required fields
    expect(content).toContain('background = #');
    expect(content).toContain('foreground = #');
    expect(content).toContain('cursor-color = #');
    expect(content).toContain('cursor-text = #');
    expect(content).toContain('selection-background = #');
    expect(content).toContain('selection-foreground = #');
  });

  test('OpenCode theme should have proper JSON schema', async () => {
    const imagePath = join(FIXTURES_DIR, 'chute-zone.png');
    await extractFromImage(imagePath, 'test-json');

    const themePath = join(OPENCODE_THEMES_DIR, 'test-json.json');
    const content = await Bun.file(themePath).text();
    const json = JSON.parse(content);

    // Should have schema reference
    expect(json.$schema).toBe('https://opencode.ai/theme.json');

    // Should have defs section
    expect(json.defs).toBeDefined();
    expect(json.defs.bg).toBeDefined();
    expect(json.defs.fg).toBeDefined();

    // Should have theme section
    expect(json.theme).toBeDefined();
    expect(json.theme.primary).toBeDefined();
    expect(json.theme.accent).toBeDefined();
  });
});
