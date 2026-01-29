import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import type { Palette } from './types';

const OPENCODE_KV_PATH = join(homedir(), '.local/state/opencode/kv.json');
const OPENCODE_THEMES_DIR = join(homedir(), '.config/opencode/themes');

export function getCurrentOpenCodeTheme(): string | null {
  // Read from KV storage (where /themes command stores selection)
  if (!existsSync(OPENCODE_KV_PATH)) return null;

  try {
    const kv = JSON.parse(readFileSync(OPENCODE_KV_PATH, 'utf-8'));
    return kv.theme || null;
  } catch {
    return null;
  }
}

export function readOpenCodeTheme(themeName: string): Palette | null {
  const themePath = join(OPENCODE_THEMES_DIR, `${themeName}.json`);

  // First try to read from user themes directory
  if (existsSync(themePath)) {
    try {
      const theme = JSON.parse(readFileSync(themePath, 'utf-8'));
      const defs = theme.defs || {};

      // Extract colors from defs
      const palette = {
        background: defs.bg || defs.background || '#000000',
        foreground: defs.fg || defs.foreground || '#ffffff',
        cursor: defs.cursor || defs.fg || '#ffffff',
        selection: defs.selection || '#404040',
        black: defs.black || '#000000',
        red: defs.red || '#cc0000',
        green: defs.green || '#00cc00',
        yellow: defs.orange || defs.yellow || '#cccc00',
        blue: defs.blue || '#0000cc',
        magenta: defs.magenta || '#cc00cc',
        cyan: defs.cyan || '#00cccc',
        white: defs.white || '#cccccc',
        brightBlack: defs.brightBlack || '#808080',
        brightRed: defs.brightRed || '#ff0000',
        brightGreen: defs.brightGreen || '#00ff00',
        brightYellow: defs.brightOrange || defs.brightYellow || '#ffff00',
        brightBlue: defs.brightBlue || '#0000ff',
        brightMagenta: defs.brightMagenta || '#ff00ff',
        brightCyan: defs.brightCyan || '#00ffff',
        brightWhite: defs.brightWhite || '#ffffff',
      };

      // Store original Ghostty name if present
      if (theme._ghosttyName) {
        (palette as any)._ghosttyName = theme._ghosttyName;
      }

      return palette;
    } catch {
      return null;
    }
  }

  // If not in user themes, try built-in themes
  const { extractBuiltinTheme } = require('./extract-builtin-themes');
  return extractBuiltinTheme(themeName);
}

export function writeOpenCodeConfig(themeName: string): void {
  // Write to KV storage ONLY (mimics OpenCode's /themes command)
  // This ensures theme changes persist without overriding user's config file
  const kvDir = join(homedir(), '.local/state/opencode');
  if (!existsSync(kvDir)) {
    mkdirSync(kvDir, { recursive: true });
  }

  let kv: any = {};
  if (existsSync(OPENCODE_KV_PATH)) {
    try {
      kv = JSON.parse(readFileSync(OPENCODE_KV_PATH, 'utf-8'));
    } catch {
      kv = {};
    }
  }

  kv.theme = themeName;
  const kvTempPath = OPENCODE_KV_PATH + '.tmp';
  writeFileSync(kvTempPath, JSON.stringify(kv, null, 2), 'utf-8');
  renameSync(kvTempPath, OPENCODE_KV_PATH);
}

export function writeOpenCodeAdaptiveTheme(themeName: string, lightPalette: Palette, darkPalette: Palette, lightGhosttyName?: string, darkGhosttyName?: string): string {
  if (!existsSync(OPENCODE_THEMES_DIR)) {
    mkdirSync(OPENCODE_THEMES_DIR, { recursive: true });
  }

  const themePath = join(OPENCODE_THEMES_DIR, `${themeName}.json`);

  const theme: any = {
    $schema: 'https://opencode.ai/theme.json',
  };

  // Store original Ghostty names for round-trip conversion
  if (lightGhosttyName || darkGhosttyName) {
    theme._ghosttyAdaptive = {
      light: lightGhosttyName,
      dark: darkGhosttyName,
    };
  }

  theme.defs = {
    // Light mode colors (prefixed with light_)
    light_bg: lightPalette.background,
      light_fg: lightPalette.foreground,
      light_cursor: lightPalette.cursor,
      light_selection: lightPalette.selection,
      light_black: lightPalette.black,
      light_red: lightPalette.red,
      light_green: lightPalette.green,
      light_orange: lightPalette.yellow,
      light_blue: lightPalette.blue,
      light_magenta: lightPalette.magenta,
      light_cyan: lightPalette.cyan,
      light_white: lightPalette.white,
      light_brightBlack: lightPalette.brightBlack,
      light_brightRed: lightPalette.brightRed,
      light_brightGreen: lightPalette.brightGreen,
      light_brightOrange: lightPalette.brightYellow,
      light_brightBlue: lightPalette.brightBlue,
      light_brightMagenta: lightPalette.brightMagenta,
      light_brightCyan: lightPalette.brightCyan,
      light_brightWhite: lightPalette.brightWhite,
      light_gray1: adjustBrightness(lightPalette.background, 0.95),
      light_gray2: adjustBrightness(lightPalette.background, 0.9),
      light_gray3: adjustBrightness(lightPalette.background, 0.85),
      light_gray4: adjustBrightness(lightPalette.background, 0.8),

      // Dark mode colors (prefixed with dark_)
      dark_bg: darkPalette.background,
      dark_fg: darkPalette.foreground,
      dark_cursor: darkPalette.cursor,
      dark_selection: darkPalette.selection,
      dark_black: darkPalette.black,
      dark_red: darkPalette.red,
      dark_green: darkPalette.green,
      dark_orange: darkPalette.yellow,
      dark_blue: darkPalette.blue,
      dark_magenta: darkPalette.magenta,
      dark_cyan: darkPalette.cyan,
      dark_white: darkPalette.white,
      dark_brightBlack: darkPalette.brightBlack,
      dark_brightRed: darkPalette.brightRed,
      dark_brightGreen: darkPalette.brightGreen,
      dark_brightOrange: darkPalette.brightYellow,
      dark_brightBlue: darkPalette.brightBlue,
      dark_brightMagenta: darkPalette.brightMagenta,
      dark_brightCyan: darkPalette.brightCyan,
      dark_brightWhite: darkPalette.brightWhite,
    dark_gray1: adjustBrightness(darkPalette.background, 1.2),
    dark_gray2: adjustBrightness(darkPalette.background, 1.5),
    dark_gray3: adjustBrightness(darkPalette.background, 2),
    dark_gray4: adjustBrightness(darkPalette.background, 2.5),
  };

  theme.theme = {
      primary: { dark: 'dark_brightBlue', light: 'light_brightBlue' },
      secondary: { dark: 'dark_cyan', light: 'light_cyan' },
      accent: { dark: 'dark_magenta', light: 'light_magenta' },
      error: { dark: 'dark_brightRed', light: 'light_brightRed' },
      warning: { dark: 'dark_brightOrange', light: 'light_brightOrange' },
      success: { dark: 'dark_brightGreen', light: 'light_brightGreen' },
      info: { dark: 'dark_brightCyan', light: 'light_brightCyan' },
      text: { dark: 'dark_fg', light: 'light_fg' },
      textMuted: { dark: 'dark_brightBlack', light: 'light_brightBlack' },
      background: { dark: 'dark_bg', light: 'light_bg' },
      backgroundPanel: { dark: 'dark_gray1', light: 'light_gray1' },
      backgroundElement: { dark: 'dark_gray2', light: 'light_gray2' },
      border: { dark: 'dark_gray3', light: 'light_gray3' },
      borderActive: { dark: 'dark_brightBlue', light: 'light_brightBlue' },
      borderSubtle: { dark: 'dark_gray2', light: 'light_gray2' },
      diffAdded: { dark: 'dark_brightGreen', light: 'light_brightGreen' },
      diffRemoved: { dark: 'dark_brightRed', light: 'light_brightRed' },
      diffContext: { dark: 'dark_brightBlack', light: 'light_brightBlack' },
      diffHunkHeader: { dark: 'dark_gray3', light: 'light_gray3' },
      diffHighlightAdded: { dark: 'dark_brightGreen', light: 'light_brightGreen' },
      diffHighlightRemoved: { dark: 'dark_brightRed', light: 'light_brightRed' },
      diffAddedBg: { dark: '#1a2e1a', light: '#e6ffe6' },
      diffRemovedBg: { dark: '#2e1a1a', light: '#ffe6e6' },
      diffContextBg: { dark: 'dark_gray1', light: 'light_gray1' },
      diffLineNumber: { dark: 'dark_gray4', light: 'light_gray4' },
      diffAddedLineNumberBg: { dark: '#1a2e1a', light: '#e6ffe6' },
      diffRemovedLineNumberBg: { dark: '#2e1a1a', light: '#ffe6e6' },
      markdownText: { dark: 'dark_fg', light: 'light_fg' },
      markdownHeading: { dark: 'dark_brightBlue', light: 'light_brightBlue' },
      markdownLink: { dark: 'dark_brightCyan', light: 'light_brightCyan' },
      markdownLinkText: { dark: 'dark_cyan', light: 'light_cyan' },
      markdownCode: { dark: 'dark_brightGreen', light: 'light_brightGreen' },
      markdownBlockQuote: { dark: 'dark_brightBlack', light: 'light_brightBlack' },
      markdownEmph: { dark: 'dark_brightOrange', light: 'light_brightOrange' },
      markdownStrong: { dark: 'dark_brightRed', light: 'light_brightRed' },
      markdownHorizontalRule: { dark: 'dark_gray3', light: 'light_gray3' },
      markdownListItem: { dark: 'dark_brightBlue', light: 'light_brightBlue' },
      markdownListEnumeration: { dark: 'dark_cyan', light: 'light_cyan' },
      markdownImage: { dark: 'dark_magenta', light: 'light_magenta' },
      markdownImageText: { dark: 'dark_brightMagenta', light: 'light_brightMagenta' },
      markdownCodeBlock: { dark: 'dark_fg', light: 'light_fg' },
      syntaxComment: { dark: 'dark_brightBlack', light: 'light_brightBlack' },
      syntaxKeyword: { dark: 'dark_magenta', light: 'light_magenta' },
      syntaxFunction: { dark: 'dark_brightBlue', light: 'light_brightBlue' },
      syntaxVariable: { dark: 'dark_cyan', light: 'light_cyan' },
      syntaxString: { dark: 'dark_brightGreen', light: 'light_brightGreen' },
      syntaxNumber: { dark: 'dark_brightMagenta', light: 'light_brightMagenta' },
      syntaxType: { dark: 'dark_brightCyan', light: 'light_brightCyan' },
    syntaxOperator: { dark: 'dark_brightOrange', light: 'light_brightOrange' },
    syntaxPunctuation: { dark: 'dark_fg', light: 'light_fg' },
  };

  writeFileSync(themePath, JSON.stringify(theme, null, 2), 'utf-8');
  return themePath;
}

export function writeOpenCodeTheme(themeName: string, palette: Palette, ghosttyName?: string): string {
  if (!existsSync(OPENCODE_THEMES_DIR)) {
    mkdirSync(OPENCODE_THEMES_DIR, { recursive: true });
  }

  const themePath = join(OPENCODE_THEMES_DIR, `${themeName}.json`);

  const theme: any = {
    $schema: 'https://opencode.ai/theme.json',
  };

  // Store original Ghostty name for round-trip conversion
  if (ghosttyName) {
    theme._ghosttyName = ghosttyName;
  }

  theme.defs = {
    bg: palette.background,
    fg: palette.foreground,
    cursor: palette.cursor,
    selection: palette.selection,
    black: palette.black,
    red: palette.red,
    green: palette.green,
    orange: palette.yellow,
    blue: palette.blue,
    magenta: palette.magenta,
    cyan: palette.cyan,
    white: palette.white,
    brightBlack: palette.brightBlack,
    brightRed: palette.brightRed,
    brightGreen: palette.brightGreen,
    brightOrange: palette.brightYellow,
    brightBlue: palette.brightBlue,
    brightMagenta: palette.brightMagenta,
    brightCyan: palette.brightCyan,
    brightWhite: palette.brightWhite,
    gray1: adjustBrightness(palette.background, 1.2),
    gray2: adjustBrightness(palette.background, 1.5),
    gray3: adjustBrightness(palette.background, 2),
    gray4: adjustBrightness(palette.background, 2.5),
  };

  // For non-adaptive themes, only use dark mode (no light property)
  // This prevents OpenCode from switching to light backgrounds
  theme.theme = {
      primary: 'brightBlue',
      secondary: 'cyan',
      accent: 'magenta',
      error: 'brightRed',
      warning: 'brightOrange',
      success: 'brightGreen',
      info: 'brightCyan',
      text: 'fg',
      textMuted: 'brightBlack',
      background: 'bg',
      backgroundPanel: 'gray1',
      backgroundElement: 'gray2',
      border: 'gray3',
      borderActive: 'brightBlue',
      borderSubtle: 'gray2',
      diffAdded: 'brightGreen',
      diffRemoved: 'brightRed',
      diffContext: 'brightBlack',
      diffHunkHeader: 'gray3',
      diffHighlightAdded: 'brightGreen',
      diffHighlightRemoved: 'brightRed',
      diffAddedBg: '#1a2e1a',
      diffRemovedBg: '#2e1a1a',
      diffContextBg: 'gray1',
      diffLineNumber: 'gray4',
      diffAddedLineNumberBg: '#1a2e1a',
      diffRemovedLineNumberBg: '#2e1a1a',
      markdownText: 'fg',
      markdownHeading: 'brightBlue',
      markdownLink: 'brightCyan',
      markdownLinkText: 'cyan',
      markdownCode: 'brightGreen',
      markdownBlockQuote: 'brightBlack',
      markdownEmph: 'brightOrange',
      markdownStrong: 'brightRed',
      markdownHorizontalRule: 'gray3',
      markdownListItem: 'brightBlue',
      markdownListEnumeration: 'cyan',
      markdownImage: 'magenta',
      markdownImageText: 'brightMagenta',
      markdownCodeBlock: 'fg',
      syntaxComment: 'brightBlack',
      syntaxKeyword: 'magenta',
      syntaxFunction: 'brightBlue',
      syntaxVariable: 'cyan',
      syntaxString: 'brightGreen',
      syntaxNumber: 'brightMagenta',
      syntaxType: 'brightCyan',
    syntaxOperator: 'brightOrange',
    syntaxPunctuation: 'fg',
  };

  writeFileSync(themePath, JSON.stringify(theme, null, 2), 'utf-8');
  return themePath;
}

function adjustBrightness(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const newR = Math.min(255, Math.round(r * factor));
  const newG = Math.min(255, Math.round(g * factor));
  const newB = Math.min(255, Math.round(b * factor));

  return '#' + [newR, newG, newB].map(x => x.toString(16).padStart(2, '0')).join('');
}
