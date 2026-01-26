/**
 * Extract built-in OpenCode themes by running OpenCode with each theme
 * and capturing the generated config/theme data
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir, tmpdir } from 'os';
import type { Palette } from './types';

const KV_PATH = join(homedir(), '.local/state/opencode/kv.json');

// Built-in theme names from CLAUDE.md
const BUILTIN_THEMES = [
  'aura', 'ayu', 'catppuccin', 'catppuccin-frappe', 'catppuccin-macchiato',
  'cobalt2', 'cursor', 'dracula', 'everforest', 'flexoki', 'github', 'gruvbox',
  'kanagawa', 'lucent-orng', 'material', 'matrix', 'mercury', 'monokai',
  'nightowl', 'nord', 'one-dark', 'opencode', 'orng', 'osaka-jade', 'palenight',
  'rosepine', 'solarized', 'synthwave84', 'tokyonight', 'vercel'
];

// Cache for extracted themes to avoid repeated binary reads
const themeCache = new Map<string, Palette | null>();

/**
 * Extract a built-in theme by parsing it from the OpenCode binary
 */
export function extractBuiltinTheme(themeName: string): Palette | null {
  // Check cache first
  if (themeCache.has(themeName)) {
    return themeCache.get(themeName)!;
  }

  try {
    // Find the OpenCode binary
    const binaryPath = findOpenCodeBinary();
    if (!binaryPath) {
      console.error('Could not find OpenCode binary');
      themeCache.set(themeName, null);
      return null;
    }

    // Extract theme data from binary using grep -a (binary text search)
    // This preserves the complete JavaScript including closing braces
    const themeVarName = `${themeName.replace(/-/g, '_')}_default`;
    const output = execSync(
      `grep -a -A 250 'var ${themeVarName} = {' "${binaryPath}" | head -260`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );

    // Parse the JavaScript object
    const themeData = parseThemeJavaScript(output, themeName);
    if (!themeData) {
      themeCache.set(themeName, null);
      return null;
    }

    // Convert to Palette format
    const palette = convertOpenCodeThemeToPalette(themeData);
    themeCache.set(themeName, palette);
    return palette;

  } catch (error) {
    console.error(`Failed to extract theme ${themeName}:`, error);
    themeCache.set(themeName, null);
    return null;
  }
}

/**
 * Find the OpenCode binary path
 */
function findOpenCodeBinary(): string | null {
  try {
    // Try the standard Bun global install path first
    const homeDir = homedir();
    const platform = process.platform === 'darwin' ? 'darwin' : process.platform;
    const arch = process.arch;
    const binaryPackage = `opencode-${platform}-${arch}`;

    const bunPath = join(homeDir, '.bun/install/global/node_modules', binaryPackage, 'bin', 'opencode');
    if (existsSync(bunPath)) {
      return bunPath;
    }

    // Fallback: try to find it via which command
    try {
      const whichOutput = execSync('which opencode', { encoding: 'utf-8' }).trim();
      // Follow symlinks to find the wrapper script
      const wrapperPath = execSync(`readlink "${whichOutput}" || echo "${whichOutput}"`, { encoding: 'utf-8' }).trim();

      // The wrapper is at opencode-ai/bin/opencode, we need opencode-darwin-arm64/bin/opencode
      const wrapperDir = join(wrapperPath, '..');
      const nodeModules = join(wrapperDir, '../../node_modules');
      const binaryPath = join(nodeModules, binaryPackage, 'bin', 'opencode');

      if (existsSync(binaryPath)) {
        return binaryPath;
      }
    } catch {}

    return null;
  } catch {
    return null;
  }
}

/**
 * Parse theme JavaScript extracted from binary
 */
function parseThemeJavaScript(jsOutput: string, themeName: string): any {
  let jsStr = '';
  try {
    // Extract just the object literal (between first { and where it seems to end)
    const lines = jsOutput.split('\n');
    let braceCount = 0;
    let started = false;

    for (const line of lines) {
      if (!started && line.includes('var ') && line.includes('_default = {')) {
        started = true;
        const afterEquals = line.substring(line.indexOf('= {') + 1);
        jsStr += afterEquals;
        braceCount += (afterEquals.match(/{/g) || []).length;
        braceCount -= (afterEquals.match(/}/g) || []).length;
        continue;
      }

      if (started) {
        jsStr += '\n' + line;
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;

        // Stop when brace count reaches 0 (complete object)
        if (braceCount === 0) {
          break;
        }
      }
    }

    if (!jsStr.trim()) {
      console.error(`No JavaScript found for theme ${themeName}`);
      return null;
    }

    // Remove any trailing semicolon and cleanup
    jsStr = jsStr.replace(/};?\s*$/, '}').trim();

    // Evaluate the JavaScript object literal
    // This is safe because we're only evaluating the object literal, not arbitrary code
    const themeObj = eval(`(${jsStr})`);
    return themeObj;
  } catch (error) {
    console.error(`Failed to parse theme JavaScript for ${themeName}:`, error);
    // Try to log what we were trying to parse for debugging
    if (jsStr) {
      console.error('JavaScript string (first 1000 chars):', jsStr.substring(0, 1000));
      console.error('JavaScript string (last 200 chars):', jsStr.substring(jsStr.length - 200));
    }
    return null;
  }
}

/**
 * Convert OpenCode theme format to Ghostty Palette format
 */
function convertOpenCodeThemeToPalette(themeData: any): Palette {
  const defs = themeData.defs || {};

  // Resolve color references (colors can reference other colors in defs)
  const resolveColor = (value: string): string => {
    if (value.startsWith('#')) {
      return value;
    }
    return defs[value] || value;
  };

  // Map OpenCode theme to Ghostty palette
  // Use camelCase for field names to match Palette type
  return {
    background: resolveColor(defs.background || '#000000'),
    foreground: resolveColor(defs.foreground || '#ffffff'),
    cursor: resolveColor(defs.cursor || defs.foreground || '#ffffff'),
    selection: resolveColor(defs.selection || defs.currentLine || '#444444'),
    black: resolveColor(defs.black || '#000000'),
    red: resolveColor(defs.red || '#ff0000'),
    green: resolveColor(defs.green || '#00ff00'),
    yellow: resolveColor(defs.yellow || '#ffff00'),
    blue: resolveColor(defs.blue || defs.cyan || '#0000ff'),
    magenta: resolveColor(defs.magenta || defs.purple || defs.pink || '#ff00ff'),
    cyan: resolveColor(defs.cyan || '#00ffff'),
    white: resolveColor(defs.white || defs.foreground || '#ffffff'),
    brightBlack: resolveColor(defs.brightBlack || defs.comment || '#666666'),
    brightRed: resolveColor(defs.brightRed || defs.red || '#ff0000'),
    brightGreen: resolveColor(defs.brightGreen || defs.green || '#00ff00'),
    brightYellow: resolveColor(defs.brightYellow || defs.yellow || '#ffff00'),
    brightBlue: resolveColor(defs.brightBlue || defs.blue || defs.cyan || '#0000ff'),
    brightMagenta: resolveColor(defs.brightMagenta || defs.magenta || defs.purple || defs.pink || '#ff00ff'),
    brightCyan: resolveColor(defs.brightCyan || defs.cyan || '#00ffff'),
    brightWhite: resolveColor(defs.brightWhite || defs.white || defs.foreground || '#ffffff'),
  };
}

/**
 * List all available built-in OpenCode themes
 */
export function listBuiltinThemes(): string[] {
  return [...BUILTIN_THEMES];
}
