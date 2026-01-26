import { extractPaletteFromImage } from './extract';
import {
  getCurrentGhosttyTheme,
  readGhosttyTheme,
  writeGhosttyConfig,
  writeGhosttyTheme,
} from './ghostty';
import {
  getCurrentOpenCodeTheme,
  readOpenCodeTheme,
  writeOpenCodeConfig,
  writeOpenCodeTheme,
} from './opencode';
import { hackerDecode } from './hacker-decode';
import { toKebabCase, toTitleCase } from './utils';

export async function extractFromImage(
  imagePath: string,
  themeName: string
): Promise<void> {
  console.log(`Extracting palette from ${imagePath}...`);
  const palette = await extractPaletteFromImage(imagePath);

  // Convert theme name to appropriate format for each platform
  const ghosttyName = toTitleCase(themeName);
  const opencodeName = toKebabCase(themeName);

  console.log(`Creating Ghostty theme: ${ghosttyName}`);
  const ghosttyPath = writeGhosttyTheme(ghosttyName, palette);
  writeGhosttyConfig(ghosttyName, palette);
  console.log(`✓ Ghostty theme written to ${ghosttyPath}`);

  console.log(`Creating OpenCode theme: ${opencodeName}`);
  const opencodePath = writeOpenCodeTheme(opencodeName, palette);
  writeOpenCodeConfig(opencodeName);
  console.log(`✓ OpenCode theme written to ${opencodePath}`);

  console.log(`\n✨ Themes created and activated!`);
  console.log(`  Ghostty: "${ghosttyName}"`);
  console.log(`  OpenCode: "${opencodeName}"`);
}

export function syncFromGhostty(themeName?: string, quiet = false): void {
  // Check if Ghostty is using adaptive themes
  const { getGhosttyThemeConfig } = require('./ghostty');
  const themeConfig = getGhosttyThemeConfig();

  if (themeConfig.adaptive && !themeName) {
    // Adaptive theme mode: sync both light and dark
    if (!quiet) {
      console.log(`Syncing adaptive Ghostty themes:`);
      console.log(`  Light: ${themeConfig.light}`);
      console.log(`  Dark: ${themeConfig.dark}`);
    }

    const lightPalette = readGhosttyTheme(themeConfig.light!);
    const darkPalette = readGhosttyTheme(themeConfig.dark!);

    if (!lightPalette || !darkPalette) {
      throw new Error('Could not read Ghostty adaptive themes');
    }

    // Create OpenCode theme with both palettes
    const { writeOpenCodeAdaptiveTheme } = require('./opencode');
    const opencodeTheme = 'adaptive-theme';
    const opencodePath = writeOpenCodeAdaptiveTheme(opencodeTheme, lightPalette, darkPalette);
    writeOpenCodeConfig(opencodeTheme);

    if (!quiet) {
      console.log(`✓ OpenCode theme written to ${opencodePath}`);
      console.log(`\n✨ Synced adaptive themes from Ghostty → OpenCode!`);
      console.log(`  Light: "${themeConfig.light}" → OpenCode light mode`);
      console.log(`  Dark: "${themeConfig.dark}" → OpenCode dark mode`);
    }
    return;
  }

  // Single theme mode (original behavior)
  const ghosttyTheme = themeName || getCurrentGhosttyTheme();

  if (!ghosttyTheme) {
    throw new Error('No Ghostty theme specified or active');
  }

  if (!quiet) console.log(`Reading Ghostty theme: ${ghosttyTheme}`);
  const palette = readGhosttyTheme(ghosttyTheme);

  if (!palette) {
    throw new Error(`Could not read Ghostty theme: ${ghosttyTheme}`);
  }

  // Convert Ghostty theme name (Title Case) to OpenCode format (kebab-case)
  const opencodeTheme = toKebabCase(ghosttyTheme);

  if (!quiet) console.log(`Syncing to OpenCode...`);
  const opencodePath = writeOpenCodeTheme(opencodeTheme, palette);
  writeOpenCodeConfig(opencodeTheme);

  if (!quiet) {
    console.log(`✓ OpenCode theme written to ${opencodePath}`);
    console.log(`\n✨ Synced from Ghostty → OpenCode!`);
    console.log(`  Ghostty: "${ghosttyTheme}"`);
    console.log(`  OpenCode: "${opencodeTheme}"`);
  }
}

export function syncFromOpenCode(themeName?: string): void {
  const opencodeTheme = themeName || getCurrentOpenCodeTheme();

  if (!opencodeTheme) {
    throw new Error('No OpenCode theme specified or active');
  }

  console.log(`Reading OpenCode theme: ${opencodeTheme}`);
  const palette = readOpenCodeTheme(opencodeTheme);

  if (!palette) {
    throw new Error(`Could not read OpenCode theme: ${opencodeTheme}`);
  }

  // Convert OpenCode theme name (kebab-case) to Ghostty format (Title Case)
  const ghosttyTheme = toTitleCase(opencodeTheme);

  console.log(`Syncing to Ghostty...`);
  const ghosttyPath = writeGhosttyTheme(ghosttyTheme, palette);
  writeGhosttyConfig(ghosttyTheme, palette);

  console.log(`✓ Ghostty theme written to ${ghosttyPath}`);
  console.log(`\n✨ Synced from OpenCode → Ghostty!`);
  console.log(`  OpenCode: "${opencodeTheme}"`);
  console.log(`  Ghostty: "${ghosttyTheme}"`);
}

function normalizeThemeName(name: string): string {
  return name.toLowerCase().replace(/[\s-_]+/g, '');
}

export async function detectCurrentThemes(): Promise<void> {
  const ghosttyTheme = getCurrentGhosttyTheme() || '(none)';
  const opencodeTheme = getCurrentOpenCodeTheme() || '(none)';

  const isMatch = ghosttyTheme !== '(none)' && opencodeTheme !== '(none)'
    && normalizeThemeName(ghosttyTheme) === normalizeThemeName(opencodeTheme);

  const matchIcon = isMatch ? "[✔]" : "[✘]";

  // Get color palette from Ghostty theme
  let colors: string[] = [];
  let finalColor: string | undefined;
  if (ghosttyTheme !== '(none)') {
    const palette = readGhosttyTheme(ghosttyTheme);
    if (palette) {
      colors = [
        palette.cyan,
        palette.brightCyan,
        palette.blue,
        palette.brightBlue,
        palette.magenta,
        palette.brightMagenta,
        palette.green,
        palette.brightGreen,
      ];
      finalColor = palette.foreground;
    }
  }

  const finalStr = `SYS_THEME :: [ GHT ] ${ghosttyTheme} ◆ [ OCD ] ${opencodeTheme} ${matchIcon}`;

  await hackerDecode(finalStr, '', colors, finalColor, 25);
  console.log();
}
