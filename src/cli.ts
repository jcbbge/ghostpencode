#!/usr/bin/env bun

import { basename } from 'path';
import { extractFromImage, syncFromGhostty, syncFromOpenCode, detectCurrentThemes } from './sync';

const args = process.argv.slice(2);

function showHelp() {
  console.log(`
ghostpencode - Bi-directional theme sync for Ghostty & OpenCode

Usage:
  ghostpencode extract <image> [--name <theme-name>]
  ghostpencode sync --from <ghostty|opencode> [--theme <name>]
  ghostpencode detect

Commands:
  extract <image>           Extract palette from image and create themes
    --name <name>           Custom theme name (default: image filename)

  sync --from <source>      Sync themes between Ghostty and OpenCode
    --from ghostty          Sync Ghostty → OpenCode
    --from opencode         Sync OpenCode → Ghostty
    --theme <name>          Specific theme name (default: current active)

  detect                    Show current active themes

Examples:
  ghostpencode extract sunset.png
  ghostpencode extract moody.jpg --name dark-ocean
  ghostpencode sync --from ghostty
  ghostpencode sync --from opencode --theme nord
  ghostpencode detect
`);
}

async function main() {
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    process.exit(0);
  }

  const command = args[0];

  try {
    if (command === 'extract') {
      const imagePath = args[1];
      if (!imagePath) {
        console.error('Error: Image path required');
        console.log('Usage: ghostpencode extract <image> [--name <theme-name>]');
        process.exit(1);
      }

      const nameIndex = args.indexOf('--name');
      const themeName = nameIndex >= 0 && args[nameIndex + 1]
        ? args[nameIndex + 1]
        : basename(imagePath).replace(/\.[^.]+$/, '');

      await extractFromImage(imagePath, themeName);
    } else if (command === 'sync') {
      const fromIndex = args.indexOf('--from');
      if (fromIndex < 0 || !args[fromIndex + 1]) {
        console.error('Error: --from <ghostty|opencode> required');
        console.log('Usage: ghostpencode sync --from <ghostty|opencode> [--theme <name>]');
        process.exit(1);
      }

      const source = args[fromIndex + 1];
      const themeIndex = args.indexOf('--theme');
      const themeName = themeIndex >= 0 ? args[themeIndex + 1] : undefined;

      if (source === 'ghostty') {
        syncFromGhostty(themeName);
      } else if (source === 'opencode') {
        syncFromOpenCode(themeName);
      } else {
        console.error(`Error: Invalid source "${source}". Use "ghostty" or "opencode"`);
        process.exit(1);
      }
    } else if (command === 'detect') {
      detectCurrentThemes();
    } else {
      console.error(`Error: Unknown command "${command}"`);
      showHelp();
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main();
