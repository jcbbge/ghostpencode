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

export function syncFromGhostty(themeName?: string): void {
  const theme = themeName || getCurrentGhosttyTheme();
  
  if (!theme) {
    throw new Error('No Ghostty theme specified or active');
  }

  console.log(`Reading Ghostty theme: ${theme}`);
  const palette = readGhosttyTheme(theme);

  if (!palette) {
    throw new Error(`Could not read Ghostty theme: ${theme}`);
  }

  console.log(`Syncing to OpenCode...`);
  const opencodePath = writeOpenCodeTheme(theme, palette);
  writeOpenCodeConfig(theme);
  
  console.log(`✓ OpenCode theme written to ${opencodePath}`);
  console.log(`\n✨ Synced "${theme}" from Ghostty → OpenCode!`);
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

export function detectCurrentThemes(): void {
  const ghosttyTheme = getCurrentGhosttyTheme();
  const opencodeTheme = getCurrentOpenCodeTheme();

  console.log('Current themes:');
  console.log(`  Ghostty:  ${ghosttyTheme || '(none)'}`);
  console.log(`  OpenCode: ${opencodeTheme || '(none)'}`);

  if (ghosttyTheme && opencodeTheme) {
    const normalized1 = normalizeThemeName(ghosttyTheme);
    const normalized2 = normalizeThemeName(opencodeTheme);
    
    if (normalized1 === normalized2) {
      console.log(`\n✓ Themes are in sync!`);
    } else {
      console.log(`\n⚠ Themes differ. Run sync to align them.`);
    }
  }
}
