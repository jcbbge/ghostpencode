import { test, expect, describe } from 'bun:test';
import { readFileSync, writeFileSync, existsSync, rmSync } from 'fs';
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

// Built-in OpenCode themes that need extraction from binary
const BUILTIN_OPENCODE_THEMES = [
  'aura', 'ayu', 'catppuccin', 'catppuccin-frappe', 'catppuccin-macchiato',
  'cobalt2', 'cursor', 'dracula', 'everforest', 'flexoki', 'github', 'gruvbox',
  'kanagawa', 'lucent-orng', 'material', 'matrix', 'mercury', 'monokai',
  'nightowl', 'nord', 'one-dark', 'opencode', 'orng', 'osaka-jade', 'palenight',
  'rosepine', 'solarized', 'synthwave84', 'tokyonight', 'vercel'
];

describe('Round-trip conversion: Built-in OpenCode (binary) → Ghostty → OpenCode', () => {
  test('All built-in OpenCode themes extract and round-trip correctly', async () => {
    // Setup
    const createdGhosttyThemes: string[] = [];
    const createdOpenCodeThemes: string[] = [];
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

    console.log(`\nTesting ${BUILTIN_OPENCODE_THEMES.length} built-in OpenCode themes for extraction and round-trip conversion...\n`);

    const failures: Array<{
      theme: string;
      step: string;
      error: string;
      details?: any;
    }> = [];

    const { toTitleCase } = await import('../src/utils');
    const { readGhosttyTheme, writeGhosttyTheme } = await import('../src/ghostty');
    const { readOpenCodeTheme, writeOpenCodeTheme } = await import('../src/opencode');
    const { extractBuiltinTheme } = await import('../src/extract-builtin-themes');

    for (const opencodeTheme of BUILTIN_OPENCODE_THEMES) {
      try {
        // Step 1: Extract built-in OpenCode theme from binary
        const originalPalette = extractBuiltinTheme(opencodeTheme);
        if (!originalPalette) {
          failures.push({
            theme: opencodeTheme,
            step: 'extract',
            error: 'Failed to extract built-in theme from OpenCode binary',
          });
          continue;
        }

        // Verify extracted palette has all required fields
        const requiredFields = [
          'background', 'foreground', 'cursor', 'selection',
          'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
          'brightBlack', 'brightRed', 'brightGreen', 'brightYellow',
          'brightBlue', 'brightMagenta', 'brightCyan', 'brightWhite'
        ];

        for (const field of requiredFields) {
          if (!originalPalette[field as keyof typeof originalPalette]) {
            failures.push({
              theme: opencodeTheme,
              step: 'extract-validate',
              error: `Missing required field: ${field}`,
            });
            continue;
          }
        }

        // Generate Ghostty theme name
        const ghosttyName = toTitleCase(opencodeTheme);

        // Step 2: Convert to Ghostty
        const ghosttyPath = writeGhosttyTheme(ghosttyName, originalPalette, opencodeTheme);
        createdGhosttyThemes.push(ghosttyPath);

        if (!existsSync(ghosttyPath)) {
          failures.push({
            theme: opencodeTheme,
            step: 'write-ghostty',
            error: 'Ghostty theme file was not created',
            details: { path: ghosttyPath },
          });
          continue;
        }

        // Step 3: Read back from Ghostty
        const ghosttyPalette = readGhosttyTheme(ghosttyName);
        if (!ghosttyPalette) {
          failures.push({
            theme: opencodeTheme,
            step: 'read-ghostty',
            error: 'Failed to read Ghostty theme back',
            details: { ghosttyName },
          });
          continue;
        }

        // Step 4: Verify colors preserved in Ghostty conversion
        const colorMismatches: string[] = [];
        for (const field of requiredFields) {
          const originalColor = originalPalette[field as keyof typeof originalPalette];
          const ghosttyColor = ghosttyPalette[field as keyof typeof ghosttyPalette];

          if (originalColor.toLowerCase() !== ghosttyColor?.toLowerCase()) {
            colorMismatches.push(
              `${field}: ${originalColor} !== ${ghosttyColor || 'undefined'}`
            );
          }
        }

        if (colorMismatches.length > 0) {
          failures.push({
            theme: opencodeTheme,
            step: 'verify-ghostty',
            error: 'Color mismatches in Ghostty conversion',
            details: { mismatches: colorMismatches },
          });
          continue;
        }

        // Step 5: Convert back to OpenCode
        const roundtripName = `test-roundtrip-${opencodeTheme}`;
        const opencodePath = writeOpenCodeTheme(roundtripName, ghosttyPalette);
        createdOpenCodeThemes.push(opencodePath);

        if (!existsSync(opencodePath)) {
          failures.push({
            theme: opencodeTheme,
            step: 'write-opencode',
            error: 'OpenCode theme file was not created',
            details: { path: opencodePath },
          });
          continue;
        }

        // Step 6: Read back from OpenCode
        const roundtripPalette = readOpenCodeTheme(roundtripName);
        if (!roundtripPalette) {
          failures.push({
            theme: opencodeTheme,
            step: 'read-opencode',
            error: 'Failed to read OpenCode theme back',
            details: { roundtripName },
          });
          continue;
        }

        // Step 7: Verify full round-trip color fidelity
        const roundtripMismatches: string[] = [];
        for (const field of requiredFields) {
          const originalColor = originalPalette[field as keyof typeof originalPalette];
          const roundtripColor = roundtripPalette[field as keyof typeof roundtripPalette];

          if (originalColor.toLowerCase() !== roundtripColor?.toLowerCase()) {
            roundtripMismatches.push(
              `${field}: ${originalColor} !== ${roundtripColor || 'undefined'}`
            );
          }
        }

        if (roundtripMismatches.length > 0) {
          failures.push({
            theme: opencodeTheme,
            step: 'verify-roundtrip',
            error: 'Color mismatches in full round-trip',
            details: { mismatches: roundtripMismatches },
          });
        }

      } catch (error) {
        failures.push({
          theme: opencodeTheme,
          step: 'exception',
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

    for (const themePath of createdOpenCodeThemes) {
      try {
        if (existsSync(themePath)) rmSync(themePath);
      } catch (err) {
        console.error(`Failed to clean up ${themePath}:`, err);
      }
    }

    // Scrub metadata from KV
    if (existsSync(OPENCODE_KV_PATH)) {
      try {
        const kv = JSON.parse(readFileSync(OPENCODE_KV_PATH, 'utf-8'));
        const testThemeNames = BUILTIN_OPENCODE_THEMES.concat(
          BUILTIN_OPENCODE_THEMES.map(t => `test-roundtrip-${t}`)
        );

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

    // Scrub metadata from Ghostty config
    if (GHOSTTY_CONFIG_PATH && existsSync(GHOSTTY_CONFIG_PATH)) {
      try {
        let config = readFileSync(GHOSTTY_CONFIG_PATH, 'utf-8');
        const testThemeNames = createdGhosttyThemes.map(p => {
          const filename = p.split('/').pop()!;
          return filename;
        });

        const themeMatch = config.match(/^theme\s*=\s*(.+)$/m);
        if (themeMatch) {
          const currentTheme = themeMatch[1].trim();
          if (testThemeNames.includes(currentTheme)) {
            if (originalGhosttyConfig) {
              config = originalGhosttyConfig;
            } else {
              config = config.replace(/^theme\s*=.*$/m, '');
            }
            writeFileSync(GHOSTTY_CONFIG_PATH, config, 'utf-8');
          }
        }
      } catch (err) {
        console.error('Failed to clean up Ghostty config:', err);
      }
    }

    // Report results
    if (failures.length === 0) {
      console.log(`✓ All ${BUILTIN_OPENCODE_THEMES.length} built-in OpenCode themes passed extraction and round-trip conversion!\n`);
    } else {
      console.log(`✗ ${failures.length}/${BUILTIN_OPENCODE_THEMES.length} themes FAILED:\n`);
      for (const failure of failures.slice(0, 10)) {
        console.log(`  Theme: "${failure.theme}"`);
        console.log(`  Step: ${failure.step}`);
        console.log(`  Error: ${failure.error}`);
        if (failure.details) {
          console.log(`  Details:`, JSON.stringify(failure.details, null, 2));
        }
        console.log('');
      }
      if (failures.length > 10) {
        console.log(`  ... and ${failures.length - 10} more failures\n`);
      }
    }

    expect(failures.length).toBe(0);
  }, 120000); // 2 minute timeout for all 30 themes
});
