import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import type { Palette } from './types';

const OPENCODE_CONFIG_PATH = join(homedir(), '.config/opencode/opencode.json');
const OPENCODE_THEMES_DIR = join(homedir(), '.config/opencode/themes');

export function getCurrentOpenCodeTheme(): string | null {
  if (!existsSync(OPENCODE_CONFIG_PATH)) return null;

  try {
    const config = JSON.parse(readFileSync(OPENCODE_CONFIG_PATH, 'utf-8'));
    return config.theme || null;
  } catch {
    return null;
  }
}

export function readOpenCodeTheme(themeName: string): Palette | null {
  const themePath = join(OPENCODE_THEMES_DIR, `${themeName}.json`);
  if (!existsSync(themePath)) return null;

  try {
    const theme = JSON.parse(readFileSync(themePath, 'utf-8'));
    const defs = theme.defs || {};

    // Extract colors from defs
    return {
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
  } catch {
    return null;
  }
}

export function writeOpenCodeConfig(themeName: string): void {
  if (!existsSync(OPENCODE_CONFIG_PATH)) {
    const dir = join(homedir(), '.config/opencode');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  let config: any = {};

  if (existsSync(OPENCODE_CONFIG_PATH)) {
    try {
      config = JSON.parse(readFileSync(OPENCODE_CONFIG_PATH, 'utf-8'));
    } catch {
      config = {};
    }
  }

  config.theme = themeName;
  config.$schema = 'https://opencode.ai/config.json';

  // Atomic write: write to temp file, then rename
  const tempPath = OPENCODE_CONFIG_PATH + '.tmp';
  writeFileSync(tempPath, JSON.stringify(config, null, 2), 'utf-8');
  renameSync(tempPath, OPENCODE_CONFIG_PATH);
}

export function writeOpenCodeTheme(themeName: string, palette: Palette): string {
  if (!existsSync(OPENCODE_THEMES_DIR)) {
    mkdirSync(OPENCODE_THEMES_DIR, { recursive: true });
  }

  const themePath = join(OPENCODE_THEMES_DIR, `${themeName}.json`);

  const theme = {
    $schema: 'https://opencode.ai/theme.json',
    defs: {
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
    },
    theme: {
      primary: { dark: 'brightBlue', light: 'blue' },
      secondary: { dark: 'cyan', light: 'cyan' },
      accent: { dark: 'magenta', light: 'magenta' },
      error: { dark: 'brightRed', light: 'red' },
      warning: { dark: 'brightOrange', light: 'orange' },
      success: { dark: 'brightGreen', light: 'green' },
      info: { dark: 'brightCyan', light: 'cyan' },
      text: { dark: 'fg', light: 'black' },
      textMuted: { dark: 'brightWhite', light: 'brightBlack' },
      background: { dark: 'bg', light: 'white' },
      backgroundPanel: { dark: 'gray1', light: 'white' },
      backgroundElement: { dark: 'gray2', light: 'white' },
      border: { dark: 'gray3', light: 'gray4' },
      borderActive: { dark: 'brightBlue', light: 'blue' },
      borderSubtle: { dark: 'gray2', light: 'gray3' },
      diffAdded: { dark: 'brightGreen', light: 'green' },
      diffRemoved: { dark: 'brightRed', light: 'red' },
      diffContext: { dark: 'brightBlack', light: 'gray4' },
      diffHunkHeader: { dark: 'gray3', light: 'gray3' },
      diffHighlightAdded: { dark: 'brightGreen', light: 'green' },
      diffHighlightRemoved: { dark: 'brightRed', light: 'red' },
      diffAddedBg: { dark: '#1a2e1a', light: '#e6ffe6' },
      diffRemovedBg: { dark: '#2e1a1a', light: '#ffe6e6' },
      diffContextBg: { dark: 'gray1', light: 'white' },
      diffLineNumber: { dark: 'gray4', light: 'gray3' },
      diffAddedLineNumberBg: { dark: '#1a2e1a', light: '#e6ffe6' },
      diffRemovedLineNumberBg: { dark: '#2e1a1a', light: '#ffe6e6' },
      markdownText: { dark: 'fg', light: 'black' },
      markdownHeading: { dark: 'brightBlue', light: 'blue' },
      markdownLink: { dark: 'brightCyan', light: 'cyan' },
      markdownLinkText: { dark: 'cyan', light: 'cyan' },
      markdownCode: { dark: 'brightGreen', light: 'green' },
      markdownBlockQuote: { dark: 'brightBlack', light: 'gray3' },
      markdownEmph: { dark: 'brightOrange', light: 'orange' },
      markdownStrong: { dark: 'brightRed', light: 'red' },
      markdownHorizontalRule: { dark: 'gray3', light: 'gray3' },
      markdownListItem: { dark: 'brightBlue', light: 'blue' },
      markdownListEnumeration: { dark: 'cyan', light: 'cyan' },
      markdownImage: { dark: 'magenta', light: 'magenta' },
      markdownImageText: { dark: 'brightMagenta', light: 'magenta' },
      markdownCodeBlock: { dark: 'fg', light: 'black' },
      syntaxComment: { dark: 'brightBlack', light: 'gray4' },
      syntaxKeyword: { dark: 'magenta', light: 'magenta' },
      syntaxFunction: { dark: 'brightBlue', light: 'blue' },
      syntaxVariable: { dark: 'cyan', light: 'cyan' },
      syntaxString: { dark: 'brightGreen', light: 'green' },
      syntaxNumber: { dark: 'brightMagenta', light: 'magenta' },
      syntaxType: { dark: 'brightCyan', light: 'cyan' },
      syntaxOperator: { dark: 'brightOrange', light: 'orange' },
      syntaxPunctuation: { dark: 'fg', light: 'black' },
    },
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
