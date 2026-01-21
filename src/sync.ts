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

export async function extractFromImage(
  imagePath: string,
  themeName: string
): Promise<void> {
  console.log(`Extracting palette from ${imagePath}...`);
  const palette = await extractPaletteFromImage(imagePath);

  console.log(`Creating Ghostty theme: ${themeName}`);
  const ghosttyPath = writeGhosttyTheme(themeName, palette);
  writeGhosttyConfig(themeName, palette);
  console.log(`✓ Ghostty theme written to ${ghosttyPath}`);

  console.log(`Creating OpenCode theme: ${themeName}`);
  const opencodePath = writeOpenCodeTheme(themeName, palette);
  writeOpenCodeConfig(themeName);
  console.log(`✓ OpenCode theme written to ${opencodePath}`);

  console.log(`\n✨ Theme "${themeName}" created and activated!`);
}

export function syncFromGhostty(themeName?: string, quiet = false): void {
  const theme = themeName || getCurrentGhosttyTheme();
  
  if (!theme) {
    throw new Error('No Ghostty theme specified or active');
  }

  if (!quiet) console.log(`Reading Ghostty theme: ${theme}`);
  const palette = readGhosttyTheme(theme);

  if (!palette) {
    throw new Error(`Could not read Ghostty theme: ${theme}`);
  }

  if (!quiet) console.log(`Syncing to OpenCode...`);
  const opencodePath = writeOpenCodeTheme(theme, palette);
  writeOpenCodeConfig(theme);
  
  if (!quiet) {
    console.log(`✓ OpenCode theme written to ${opencodePath}`);
    console.log(`\n✨ Synced "${theme}" from Ghostty → OpenCode!`);
  }
}

export function syncFromOpenCode(themeName?: string): void {
  const theme = themeName || getCurrentOpenCodeTheme();
  
  if (!theme) {
    throw new Error('No OpenCode theme specified or active');
  }

  console.log(`Reading OpenCode theme: ${theme}`);
  const palette = readOpenCodeTheme(theme);

  if (!palette) {
    throw new Error(`Could not read OpenCode theme: ${theme}`);
  }

  console.log(`Syncing to Ghostty...`);
  const ghosttyPath = writeGhosttyTheme(theme, palette);
  writeGhosttyConfig(theme, palette);
  
  console.log(`✓ Ghostty theme written to ${ghosttyPath}`);
  console.log(`\n✨ Synced "${theme}" from OpenCode → Ghostty!`);
}

function normalizeThemeName(name: string): string {
  return name.toLowerCase().replace(/[\s-_]+/g, '');
}

export async function detectCurrentThemes(): Promise<void> {
  const ghosttyTheme = getCurrentGhosttyTheme() || '(none)';
  const opencodeTheme = getCurrentOpenCodeTheme() || '(none)';

  const isMatch = ghosttyTheme !== '(none)' && opencodeTheme !== '(none)'
    && normalizeThemeName(ghosttyTheme) === normalizeThemeName(opencodeTheme);

  // Match icon without colors
  const matchIcon = isMatch ? "[✔]" : "[✘]";

  // Get color palette from Ghostty theme
  let colors: string[] = [];
  let finalColor: string | undefined;
  if (ghosttyTheme !== '(none)') {
    const palette = readGhosttyTheme(ghosttyTheme);
    if (palette) {
      // Use all the vibrant colors for animation
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
      // Use foreground color for final text (matches terminal text)
      finalColor = palette.foreground;
    }
  }

  // Final Layout
  const finalStr = `SYS_THEME :: [ GHT ] ${ghosttyTheme} ◆ [ OCD ] ${opencodeTheme} ${matchIcon}`;

  await hackerDecode(finalStr, '', colors, finalColor, 25);
  console.log(); // newline after
}
