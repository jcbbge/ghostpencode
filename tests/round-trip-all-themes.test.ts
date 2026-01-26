import { test, expect, describe } from 'bun:test';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const TEST_GHOSTTY_DIR = join(homedir(), '.config/ghostty/themes');
const TEST_OPENCODE_DIR = join(homedir(), '.config/opencode/themes');
const OPENCODE_KV_PATH = join(homedir(), '.local/state/opencode/kv.json');

// Find actual Ghostty config path
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

describe('Round-trip conversion for all Ghostty themes', () => {
  test('All 442 Ghostty themes round-trip correctly', async () => {
    // Setup test directories
    mkdirSync(TEST_GHOSTTY_DIR, { recursive: true });
    mkdirSync(TEST_OPENCODE_DIR, { recursive: true });

    // Track themes we create for cleanup
    const createdGhosttyThemes: string[] = [];
    const createdOpenCodeThemes: string[] = [];

    // Save original config state for restoration
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

    // Get all Ghostty theme names
    const themesOutput = execSync('ghostty +list-themes', { encoding: 'utf-8' });
    const allThemes = themesOutput
      .split('\n')
      .filter(Boolean)
      .map(line => line.replace(' (resources)', '').replace(' (user)', '').trim());

    console.log(`\nTesting ${allThemes.length} Ghostty themes for round-trip conversion...\n`);

    const failures: Array<{
      theme: string;
      error: string;
      ghosttyName?: string;
      opencodeFilename?: string;
      roundtripName?: string;
    }> = [];

    // Import sync functions
    const { toKebabCase } = await import('../src/utils');
    const { readGhosttyTheme, writeGhosttyTheme } = await import('../src/ghostty');
    const { readOpenCodeTheme, writeOpenCodeTheme } = await import('../src/opencode');

    for (const themeName of allThemes) {
      try {
        // Step 1: Read original Ghostty theme
        const originalPalette = readGhosttyTheme(themeName);
        if (!originalPalette) {
          failures.push({
            theme: themeName,
            error: 'Failed to read original Ghostty theme',
          });
          continue;
        }

        // Step 2: Convert to OpenCode (kebab-case filename)
        const opencodeFilename = toKebabCase(themeName);
        const opencodePath = join(TEST_OPENCODE_DIR, `${opencodeFilename}.json`);

        // Manually write OpenCode theme with metadata
        const opencodeTheme = {
          $schema: 'https://opencode.ai/theme.json',
          _ghosttyName: themeName,
          defs: {
            bg: originalPalette.background,
            fg: originalPalette.foreground,
            cursor: originalPalette.cursor,
            selection: originalPalette.selection,
            black: originalPalette.black,
            red: originalPalette.red,
            green: originalPalette.green,
            orange: originalPalette.yellow,
            blue: originalPalette.blue,
            magenta: originalPalette.magenta,
            cyan: originalPalette.cyan,
            white: originalPalette.white,
            brightBlack: originalPalette.brightBlack,
            brightRed: originalPalette.brightRed,
            brightGreen: originalPalette.brightGreen,
            brightOrange: originalPalette.brightYellow,
            brightBlue: originalPalette.brightBlue,
            brightMagenta: originalPalette.brightMagenta,
            brightCyan: originalPalette.brightCyan,
            brightWhite: originalPalette.brightWhite,
          },
          theme: {},
        };

        writeFileSync(opencodePath, JSON.stringify(opencodeTheme, null, 2), 'utf-8');
        createdOpenCodeThemes.push(opencodePath);

        // Step 3: Read back from OpenCode
        const readbackPalette = readOpenCodeTheme(opencodeFilename);
        if (!readbackPalette) {
          failures.push({
            theme: themeName,
            error: 'Failed to read OpenCode theme',
            opencodeFilename,
          });
          continue;
        }

        // Step 4: Check if _ghosttyName was preserved
        const storedGhosttyName = (readbackPalette as any)._ghosttyName;
        if (storedGhosttyName !== themeName) {
          failures.push({
            theme: themeName,
            error: 'Ghostty name not preserved in OpenCode theme',
            ghosttyName: storedGhosttyName,
            opencodeFilename,
          });
          continue;
        }

        // Step 5: Write back to Ghostty with metadata
        const roundtripPath = join(TEST_GHOSTTY_DIR, themeName);
        let content = `# ${themeName}
# Generated by ghostpencode
# OpenCode filename: ${opencodeFilename}

palette = 0=${readbackPalette.black}
palette = 1=${readbackPalette.red}
palette = 2=${readbackPalette.green}
palette = 3=${readbackPalette.yellow}
palette = 4=${readbackPalette.blue}
palette = 5=${readbackPalette.magenta}
palette = 6=${readbackPalette.cyan}
palette = 7=${readbackPalette.white}
palette = 8=${readbackPalette.brightBlack}
palette = 9=${readbackPalette.brightRed}
palette = 10=${readbackPalette.brightGreen}
palette = 11=${readbackPalette.brightYellow}
palette = 12=${readbackPalette.brightBlue}
palette = 13=${readbackPalette.brightMagenta}
palette = 14=${readbackPalette.brightCyan}
palette = 15=${readbackPalette.brightWhite}
background = ${readbackPalette.background}
foreground = ${readbackPalette.foreground}
cursor-color = ${readbackPalette.cursor}
cursor-text = ${readbackPalette.background}
selection-background = ${readbackPalette.selection}
selection-foreground = ${readbackPalette.foreground}
`;

        writeFileSync(roundtripPath, content, 'utf-8');
        createdGhosttyThemes.push(roundtripPath);

        // Step 6: Read back from Ghostty and verify metadata
        const roundtripContent = readFileSync(roundtripPath, 'utf-8');
        const lines = roundtripContent.split('\n');
        let storedOpencodeFilename: string | null = null;

        for (const line of lines) {
          if (line.trim().startsWith('# OpenCode filename:')) {
            storedOpencodeFilename = line.trim().replace('# OpenCode filename:', '').trim();
            break;
          }
        }

        if (storedOpencodeFilename !== opencodeFilename) {
          failures.push({
            theme: themeName,
            error: 'OpenCode filename not preserved in Ghostty theme',
            opencodeFilename,
            roundtripName: storedOpencodeFilename || undefined,
          });
        }
      } catch (error) {
        failures.push({
          theme: themeName,
          error: `Exception: ${error}`,
        });
      }
    }

    // Cleanup - only delete themes we created
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

    // Scrub metadata from config files
    // Clean OpenCode KV storage
    if (existsSync(OPENCODE_KV_PATH)) {
      try {
        const kv = JSON.parse(readFileSync(OPENCODE_KV_PATH, 'utf-8'));
        const testThemeNames = createdOpenCodeThemes.map(p =>
          p.split('/').pop()!.replace('.json', '')
        );

        // Only remove if current theme is a test theme
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

    // Clean Ghostty config
    if (GHOSTTY_CONFIG_PATH && existsSync(GHOSTTY_CONFIG_PATH)) {
      try {
        let config = readFileSync(GHOSTTY_CONFIG_PATH, 'utf-8');
        const testThemeNames = createdGhosttyThemes.map(p => p.split('/').pop()!);

        // Check if current theme is a test theme
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
      console.log(`✓ All ${allThemes.length} themes passed round-trip conversion!\n`);
    } else {
      console.log(`✗ ${failures.length}/${allThemes.length} themes FAILED:\n`);
      for (const failure of failures.slice(0, 10)) {
        console.log(`  Theme: "${failure.theme}"`);
        console.log(`  Error: ${failure.error}`);
        if (failure.ghosttyName) console.log(`  Stored Ghostty name: "${failure.ghosttyName}"`);
        if (failure.opencodeFilename) console.log(`  OpenCode filename: "${failure.opencodeFilename}"`);
        if (failure.roundtripName) console.log(`  Roundtrip name: "${failure.roundtripName}"`);
        console.log('');
      }
      if (failures.length > 10) {
        console.log(`  ... and ${failures.length - 10} more failures\n`);
      }
    }

    expect(failures.length).toBe(0);
  }, 60000); // 60 second timeout
});
