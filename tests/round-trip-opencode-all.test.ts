import { test, expect, describe } from 'bun:test';
import { readFileSync, writeFileSync, existsSync, readdirSync, rmSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const TEST_GHOSTTY_DIR = join(homedir(), '.config/ghostty/themes');
const OPENCODE_THEMES_DIR = join(homedir(), '.config/opencode/themes');
const OPENCODE_KV_PATH = join(homedir(), '.local/state/opencode/kv.json');

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

// Built-in OpenCode themes
const BUILTIN_OPENCODE_THEMES = [
  'aura', 'ayu', 'catppuccin', 'catppuccin-frappe', 'catppuccin-macchiato',
  'cobalt2', 'cursor', 'dracula', 'everforest', 'flexoki', 'github', 'gruvbox',
  'kanagawa', 'lucent-orng', 'material', 'matrix', 'mercury', 'monokai',
  'nightowl', 'nord', 'one-dark', 'opencode', 'orng', 'osaka-jade', 'palenight',
  'rosepine', 'solarized', 'synthwave84', 'tokyonight', 'vercel'
];

describe('Round-trip conversion: OpenCode → Ghostty → OpenCode', () => {
  test('All OpenCode themes round-trip correctly', async () => {
    // Setup
    const createdGhosttyThemes: string[] = [];
    let originalKV: any = null;
    let originalGhosttyConfig: string = '';
    const GHOSTTY_CONFIG_PATH = getGhosttyConfigPath();

    if (existsSync(OPENCODE_KV_PATH)) {
      try {
        originalKV = JSON.parse(readFileSync(OPENCODE_KV_PATH, 'utf-8'));
      } catch {}
    }

    if (GHOSTTY_CONFIG_PATH && existsSync(GHOSTTY_CONFIG_PATH)) {
      originalGhosttyConfig = readFileSync(GHOSTTY_CONFIG_PATH, 'utf-8');
    }

    // Test only built-in OpenCode themes
    const allOpencodeThemes = BUILTIN_OPENCODE_THEMES;

    console.log(`\nTesting ${allOpencodeThemes.length} OpenCode themes for round-trip conversion...\n`);

    const failures: Array<{
      theme: string;
      error: string;
      ghosttyName?: string;
      roundtripFilename?: string;
    }> = [];

    const { toTitleCase } = await import('../src/utils');
    const { readGhosttyTheme, writeGhosttyTheme } = await import('../src/ghostty');
    const { readOpenCodeTheme } = await import('../src/opencode');

    for (const opencodeTheme of allOpencodeThemes) {
      try {
        // Step 1: Read OpenCode theme
        const originalPalette = readOpenCodeTheme(opencodeTheme);
        if (!originalPalette) {
          failures.push({
            theme: opencodeTheme,
            error: 'Failed to read OpenCode theme',
          });
          continue;
        }

        // Get or generate Ghostty name
        const storedGhosttyName = (originalPalette as any)._ghosttyName;
        const ghosttyName = storedGhosttyName || toTitleCase(opencodeTheme);

        // Step 2: Convert to Ghostty
        const ghosttyPath = writeGhosttyTheme(ghosttyName, originalPalette, opencodeTheme);
        createdGhosttyThemes.push(ghosttyPath);

        // Step 3: Read back from Ghostty and verify metadata
        const roundtripPalette = readGhosttyTheme(ghosttyName);
        if (!roundtripPalette) {
          failures.push({
            theme: opencodeTheme,
            error: 'Failed to read Ghostty theme back',
            ghosttyName,
          });
          continue;
        }

        // Step 4: Verify OpenCode filename metadata preserved
        const storedOpencodeFilename = (roundtripPalette as any)._opencodeFilename;
        if (storedOpencodeFilename !== opencodeTheme) {
          failures.push({
            theme: opencodeTheme,
            error: 'OpenCode filename metadata not preserved',
            ghosttyName,
            roundtripFilename: storedOpencodeFilename,
          });
        }

      } catch (error) {
        failures.push({
          theme: opencodeTheme,
          error: `Exception: ${error}`,
        });
      }
    }

    // Cleanup
    for (const themePath of createdGhosttyThemes) {
      try {
        if (existsSync(themePath)) rmSync(themePath);
      } catch (err) {
        console.error(`Failed to clean up ${themePath}:`, err);
      }
    }

    // Scrub metadata
    if (existsSync(OPENCODE_KV_PATH)) {
      try {
        const kv = JSON.parse(readFileSync(OPENCODE_KV_PATH, 'utf-8'));
        const testThemeNames = allOpencodeThemes;

        if (kv.theme && testThemeNames.includes(kv.theme)) {
          if (originalKV && originalKV.theme) {
            kv.theme = originalKV.theme;
          } else {
            delete kv.theme;
          }
          writeFileSync(OPENCODE_KV_PATH, JSON.stringify(kv, null, 2), 'utf-8');
        }
      } catch (err) {
        console.error('Failed to clean up OpenCode KV:', err);
      }
    }

    if (GHOSTTY_CONFIG_PATH && existsSync(GHOSTTY_CONFIG_PATH)) {
      try {
        let config = readFileSync(GHOSTTY_CONFIG_PATH, 'utf-8');
        const testThemeNames = createdGhosttyThemes.map(p => p.split('/').pop()!);

        const themeMatch = config.match(/^theme\s*=\s*(.+)$/m);
        if (themeMatch) {
          const currentTheme = themeMatch[1].trim();
          if (testThemeNames.includes(currentTheme)) {
            // Only restore if we had an original config
            if (originalGhosttyConfig) {
              writeFileSync(GHOSTTY_CONFIG_PATH, originalGhosttyConfig, 'utf-8');
            }
            // If no original config, leave current config as-is (don't delete theme line)
          }
        }
      } catch (err) {
        console.error('Failed to clean up Ghostty config:', err);
      }
    }

    // Report results
    if (failures.length === 0) {
      console.log(`✓ All ${allOpencodeThemes.length} OpenCode themes passed round-trip conversion!\n`);
    } else {
      console.log(`✗ ${failures.length}/${allOpencodeThemes.length} themes FAILED:\n`);
      for (const failure of failures.slice(0, 10)) {
        console.log(`  Theme: "${failure.theme}"`);
        console.log(`  Error: ${failure.error}`);
        if (failure.ghosttyName) console.log(`  Ghostty name: "${failure.ghosttyName}"`);
        if (failure.roundtripFilename) console.log(`  Roundtrip filename: "${failure.roundtripFilename}"`);
        console.log('');
      }
      if (failures.length > 10) {
        console.log(`  ... and ${failures.length - 10} more failures\n`);
      }
    }

    expect(failures.length).toBe(0);
  }, 120000);
});
