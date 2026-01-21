import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

describe('Sync functions', () => {
  const testDir = join(import.meta.dir, '../fixtures/sync-test');

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Theme name conversion - OpenCode to Ghostty', () => {
    const toTitleCase = (kebab: string): string => {
      return kebab
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    test('should convert dracula to Dracula', () => {
      expect(toTitleCase('dracula')).toBe('Dracula');
    });

    test('should convert night-owl to Night Owl', () => {
      expect(toTitleCase('night-owl')).toBe('Night Owl');
    });

    test('should convert synthwave to Synthwave', () => {
      expect(toTitleCase('synthwave')).toBe('Synthwave');
    });

    test('should convert liquid-carbon-transparent to Liquid Carbon Transparent', () => {
      expect(toTitleCase('liquid-carbon-transparent')).toBe('Liquid Carbon Transparent');
    });

    test('should convert my-image-generated-theme to My Image Generated Theme', () => {
      expect(toTitleCase('my-image-generated-theme')).toBe('My Image Generated Theme');
    });

    test('should convert nord to Nord', () => {
      expect(toTitleCase('nord')).toBe('Nord');
    });

    test('should convert galizur to Galizur', () => {
      expect(toTitleCase('galizur')).toBe('Galizur');
    });
  });

  describe('Theme name conversion - Ghostty to OpenCode', () => {
    const toKebabCase = (title: string): string => {
      return title.toLowerCase().replace(/\s+/g, '-');
    };

    test('should convert Synthwave to synthwave', () => {
      expect(toKebabCase('Synthwave')).toBe('synthwave');
    });

    test('should convert Liquid Carbon Transparent to liquid-carbon-transparent', () => {
      expect(toKebabCase('Liquid Carbon Transparent')).toBe('liquid-carbon-transparent');
    });

    test('should convert Galizur to galizur', () => {
      expect(toKebabCase('Galizur')).toBe('galizur');
    });

    test('should convert Night Owl to night-owl', () => {
      expect(toKebabCase('Night Owl')).toBe('night-owl');
    });

    test('should convert Dracula to dracula', () => {
      expect(toKebabCase('Dracula')).toBe('dracula');
    });

    test('should convert Nord to nord', () => {
      expect(toKebabCase('Nord')).toBe('nord');
    });

    test('should convert Liquid Carbon to liquid-carbon', () => {
      expect(toKebabCase('Liquid Carbon')).toBe('liquid-carbon');
    });
  });

  describe('Theme name normalization for comparison', () => {
    const normalize = (name: string) =>
      name.toLowerCase().replace(/[\s-_]+/g, '');

    test('should consider Nord and nord as same theme', () => {
      expect(normalize('Nord')).toBe(normalize('nord'));
    });

    test('should consider Night Owl and night-owl as same theme', () => {
      expect(normalize('Night Owl')).toBe(normalize('night-owl'));
    });

    test('should consider Liquid Carbon Transparent and liquid-carbon-transparent as same theme', () => {
      expect(normalize('Liquid Carbon Transparent')).toBe(normalize('liquid-carbon-transparent'));
    });

    test('should detect when themes differ', () => {
      expect(normalize('Dracula')).not.toBe(normalize('Synthwave'));
      expect(normalize('Nord')).not.toBe(normalize('Night Owl'));
    });
  });

  describe('extractFromImage', () => {
    test('should handle missing image file gracefully', async () => {
      const { extractFromImage } = await import('../../src/sync');

      await expect(
        extractFromImage('/nonexistent/image.png', 'wallpaper-theme')
      ).rejects.toThrow();
    });
  });

  describe('syncFromGhostty', () => {
    test('should throw error if theme cannot be read', async () => {
      const { syncFromGhostty } = await import('../../src/sync');

      // Trying to sync a non-existent Ghostty theme
      expect(() => syncFromGhostty('Tokyo Night Ultimate Edition')).toThrow('Could not read Ghostty theme');
    });
  });

  describe('syncFromOpenCode', () => {
    test('should throw error if theme cannot be read', async () => {
      const { syncFromOpenCode } = await import('../../src/sync');

      // Trying to sync a non-existent OpenCode theme
      expect(() => syncFromOpenCode('gruvbox-material-dark')).toThrow('Could not read OpenCode theme');
    });
  });

  describe('detectCurrentThemes', () => {
    test('should output current themes status without throwing', async () => {
      const { detectCurrentThemes } = await import('../../src/sync');

      // Should not throw
      expect(() => detectCurrentThemes()).not.toThrow();
    });
  });
});
