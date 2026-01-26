import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { spawnSync } from 'child_process';
import { mkdirSync, rmSync, existsSync, writeFileSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import sharp from 'sharp';

describe('CLI Integration Tests', () => {
  const testDir = join(import.meta.dir, '../fixtures/cli-test');
  const cliPath = join(import.meta.dir, '../../src/cli.ts');
  const OPENCODE_THEMES_DIR = join(homedir(), '.config/opencode/themes');
  const GHOSTTY_THEMES_DIR = join(homedir(), '.config/ghostty/themes');
  const OPENCODE_KV_PATH = join(homedir(), '.local/state/opencode/kv.json');

  // Track initial state and cleanup
  let initialOpencodeThemes: string[] = [];
  let initialGhosttyThemes: string[] = [];
  let originalKV: any = null;
  let originalGhosttyConfig: string = '';

  function getGhosttyConfigPath(): string | null {
    const paths = [
      join(homedir(), 'Library/Application Support/com.mitchellh.ghostty/config'),
      join(homedir(), '.config/ghostty/config'),
    ];
    for (const path of paths) {
      if (existsSync(path)) return path;
    }
    return null;
  }

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });

    // Record initial state
    if (existsSync(OPENCODE_THEMES_DIR)) {
      initialOpencodeThemes = readdirSync(OPENCODE_THEMES_DIR);
    }
    if (existsSync(GHOSTTY_THEMES_DIR)) {
      initialGhosttyThemes = readdirSync(GHOSTTY_THEMES_DIR);
    }
    if (existsSync(OPENCODE_KV_PATH)) {
      try {
        originalKV = JSON.parse(readFileSync(OPENCODE_KV_PATH, 'utf-8'));
      } catch {}
    }
    const ghosttyConfigPath = getGhosttyConfigPath();
    if (ghosttyConfigPath && existsSync(ghosttyConfigPath)) {
      originalGhosttyConfig = readFileSync(ghosttyConfigPath, 'utf-8');
    }
  });

  afterEach(() => {
    // Clean up test fixtures
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }

    // Clean up created themes
    if (existsSync(OPENCODE_THEMES_DIR)) {
      const currentThemes = readdirSync(OPENCODE_THEMES_DIR);
      for (const theme of currentThemes) {
        if (!initialOpencodeThemes.includes(theme)) {
          try {
            rmSync(join(OPENCODE_THEMES_DIR, theme));
          } catch (err) {
            console.error(`Failed to clean up OpenCode theme ${theme}:`, err);
          }
        }
      }
    }

    if (existsSync(GHOSTTY_THEMES_DIR)) {
      const currentThemes = readdirSync(GHOSTTY_THEMES_DIR);
      for (const theme of currentThemes) {
        if (!initialGhosttyThemes.includes(theme)) {
          try {
            rmSync(join(GHOSTTY_THEMES_DIR, theme));
          } catch (err) {
            console.error(`Failed to clean up Ghostty theme ${theme}:`, err);
          }
        }
      }
    }

    // Restore original configs
    if (originalKV && existsSync(OPENCODE_KV_PATH)) {
      try {
        writeFileSync(OPENCODE_KV_PATH, JSON.stringify(originalKV, null, 2), 'utf-8');
      } catch (err) {
        console.error('Failed to restore OpenCode KV:', err);
      }
    }

    const ghosttyConfigPath = getGhosttyConfigPath();
    if (originalGhosttyConfig && ghosttyConfigPath && existsSync(ghosttyConfigPath)) {
      try {
        writeFileSync(ghosttyConfigPath, originalGhosttyConfig, 'utf-8');
      } catch (err) {
        console.error('Failed to restore Ghostty config:', err);
      }
    }
  });
  
  const runCLI = (args: string[]) => {
    return spawnSync('bun', ['run', cliPath, ...args], {
      encoding: 'utf-8',
      cwd: testDir
    });
  };
  
  describe('Help command', () => {
    test('should show sync status with no arguments', () => {
      const result = runCLI([]);

      // With no args, it shows sync status
      expect(result.stdout).toContain('GHOSTTY');
      expect(result.stdout).toContain('OPENCODE');
    });
    
    test('should display help with --help flag', () => {
      const result = runCLI(['--help']);
      
      expect(result.stdout).toContain('Usage:');
      expect(result.stdout).toContain('Commands:');
      expect(result.stdout).toContain('Examples:');
      expect(result.status).toBe(0);
    });
    
    test('should display help with -h flag', () => {
      const result = runCLI(['-h']);
      
      expect(result.stdout).toContain('ghostpencode');
      expect(result.status).toBe(0);
    });
  });
  
  describe('Extract command', () => {
    test('should fail with missing image argument', () => {
      const result = runCLI(['extract']);
      
      expect(result.stderr).toContain('Error');
      expect(result.status).not.toBe(0);
    });
    
    test('should fail with non-existent image', () => {
      const result = runCLI(['extract', '/nonexistent/image.png']);
      
      expect(result.stderr || result.stdout).toContain('Error');
      expect(result.status).not.toBe(0);
    });
    
    test('should extract theme from valid image', async () => {
      const imagePath = join(testDir, 'test-image.png');
      
      await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 100, g: 150, b: 200 }
        }
      }).png().toFile(imagePath);
      
      const result = runCLI(['extract', imagePath]);
      
      // Should create themes (though we can't verify actual file writes in isolated test)
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Extracting palette');
    });
    
    test('should use custom theme name with --name flag', async () => {
      const imagePath = join(testDir, 'custom.png');
      
      await sharp({
        create: {
          width: 50,
          height: 50,
          channels: 3,
          background: { r: 50, g: 50, b: 50 }
        }
      }).png().toFile(imagePath);
      
      const result = runCLI(['extract', imagePath, '--name', 'my-custom-theme']);
      
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('my-custom-theme');
    });
    
    test('should auto-name theme from filename', async () => {
      const imagePath = join(testDir, 'sunset-colors.png');
      
      await sharp({
        create: {
          width: 50,
          height: 50,
          channels: 3,
          background: { r: 255, g: 100, b: 50 }
        }
      }).png().toFile(imagePath);
      
      const result = runCLI(['extract', imagePath]);
      
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('sunset-colors');
    });
  });
  
  describe('Sync command', () => {
    test('should fail without --from argument', () => {
      const result = runCLI(['sync']);
      
      expect(result.stderr).toContain('--from');
      expect(result.status).not.toBe(0);
    });
    
    test('should fail with invalid --from value', () => {
      const result = runCLI(['sync', '--from', 'invalid']);
      
      expect(result.stderr).toContain('Invalid source');
      expect(result.status).not.toBe(0);
    });
    
    test('should accept --from ghostty', () => {
      const result = runCLI(['sync', '--from', 'ghostty']);
      
      // May fail due to missing theme, but should recognize the command
      expect(result.status === 0 || result.stderr.includes('theme')).toBe(true);
    });
    
    test('should accept --from opencode', () => {
      const result = runCLI(['sync', '--from', 'opencode']);
      
      // May fail due to missing theme, but should recognize the command
      expect(result.status === 0 || result.stderr.includes('theme')).toBe(true);
    });
    
    test('should accept --theme flag', () => {
      const result = runCLI(['sync', '--from', 'ghostty', '--theme', 'nord']);
      
      // May fail due to missing theme file, but command structure is valid
      expect(result.status === 0 || result.stderr.includes('theme') || result.stderr.includes('nord')).toBe(true);
    });
  });
  
  describe('Detect command', () => {
    test('should run detect command', () => {
      const result = runCLI(['detect']);
      
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Current themes:');
      expect(result.stdout).toContain('Ghostty:');
      expect(result.stdout).toContain('OpenCode:');
    });
    
    test('should show sync status', () => {
      const result = runCLI(['detect']);
      
      expect(result.status).toBe(0);
      // Should show either "in sync" or "differ"
      const output = result.stdout.toLowerCase();
      expect(
        output.includes('sync') || 
        output.includes('differ')
      ).toBe(true);
    });
  });
  
  describe('Unknown command', () => {
    test('should show error for unknown command', () => {
      const result = runCLI(['invalid-command']);
      
      expect(result.stderr).toContain('Unknown command');
      expect(result.status).not.toBe(0);
    });
  });
  
  describe('Edge cases', () => {
    test('should handle image path with spaces', async () => {
      const imagePath = join(testDir, 'image with spaces.png');
      
      await sharp({
        create: {
          width: 50,
          height: 50,
          channels: 3,
          background: { r: 128, g: 128, b: 128 }
        }
      }).png().toFile(imagePath);
      
      const result = runCLI(['extract', imagePath]);
      
      expect(result.status).toBe(0);
    });
    
    test('should handle very long theme name', async () => {
      const imagePath = join(testDir, 'test.png');
      
      await sharp({
        create: {
          width: 50,
          height: 50,
          channels: 3,
          background: { r: 100, g: 100, b: 100 }
        }
      }).png().toFile(imagePath);
      
      const longName = 'a'.repeat(100);
      const result = runCLI(['extract', imagePath, '--name', longName]);
      
      // Should handle gracefully (either accept or reject with clear error)
      expect(result.status === 0 || result.stderr.length > 0).toBe(true);
    });
    
    test('should handle special characters in theme name', async () => {
      const imagePath = join(testDir, 'test2.png');
      
      await sharp({
        create: {
          width: 50,
          height: 50,
          channels: 3,
          background: { r: 100, g: 100, b: 100 }
        }
      }).png().toFile(imagePath);
      
      const result = runCLI(['extract', imagePath, '--name', 'my-theme_v2.0']);
      
      expect(result.status).toBe(0);
    });
  });
});
