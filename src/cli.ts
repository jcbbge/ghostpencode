#!/usr/bin/env bun

import { basename } from 'path';
import { extractFromImage, syncFromGhostty, syncFromOpenCode, detectCurrentThemes } from './sync';
import { startWatching } from './watch';

const args = process.argv.slice(2);

function showHelp() {
  console.log(`
ghostpencode - Theme sync for Ghostty & OpenCode

Usage:
  ghostpencode                                      Check sync status
  ghostpencode sync --from <ghostty|opencode>       Manual sync
  ghostpencode detect                               Show current themes
  ghostpencode extract <image> [--name <name>]      Extract from image
  ghostpencode help                                 Show this help

Commands:
  (no args)                 Check if themes are synced, prompt to sync if needed
  
  sync --from <source>      Manual sync (non-interactive)
    --from ghostty          Sync Ghostty → OpenCode
    --from opencode         Sync OpenCode → Ghostty
    --theme <name>          Specific theme (default: current active)

  detect                    Show current active themes
  
  extract <image>           Extract palette from image and create themes
    --name <name>           Custom theme name (default: image filename)

Examples:
  ghostpencode                              # Check status & sync
  ghostpencode sync --from ghostty          # Sync Ghostty → OpenCode
  ghostpencode sync --from opencode         # Sync OpenCode → Ghostty
  ghostpencode extract sunset.png           # Extract from image
`);
}

async function main() {
  if (args[0] === '--help' || args[0] === '-h' || args[0] === '?') {
    showHelp();
    process.exit(0);
  }

  // Default: start watching if no args
  if (args.length === 0) {
    await startWatching();
    return;
  }

  const command = args[0];

  try {
    if (command === 'help') {
      showHelp();
    } else if (command === 'extract') {
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
      await detectCurrentThemes();
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
