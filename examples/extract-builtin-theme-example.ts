#!/usr/bin/env bun
/**
 * Example: Extract a built-in OpenCode theme
 *
 * This demonstrates how to extract color palettes from OpenCode's built-in themes
 * that are compiled into the binary.
 */

import { extractBuiltinTheme, listBuiltinThemes } from '../src/extract-builtin-themes';

// List all available built-in themes
console.log('Available built-in OpenCode themes:');
console.log(listBuiltinThemes().join(', '));
console.log();

// Extract a specific theme
const themeName = 'dracula';
console.log(`Extracting theme: ${themeName}`);
const palette = extractBuiltinTheme(themeName);

if (palette) {
  console.log(JSON.stringify(palette, null, 2));
} else {
  console.error(`Failed to extract theme: ${themeName}`);
  process.exit(1);
}
