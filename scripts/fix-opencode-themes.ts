#!/usr/bin/env bun
/**
 * Migration script to fix OpenCode themes
 * 
 * Problem: Themes created before the fix had both 'dark' and 'light' properties
 * in theme.theme, causing OpenCode to use light backgrounds for dark themes.
 * 
 * Solution: Convert { dark: 'value', light: 'value' } to just 'value'
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const OPENCODE_THEMES_DIR = join(homedir(), '.config/opencode/themes');

function fixThemeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  // Check if this is a { dark: X, light: Y } object
  if ('dark' in obj && 'light' in obj && Object.keys(obj).length === 2) {
    // Return just the dark value (since these are non-adaptive themes)
    return obj.dark;
  }

  // Recursively fix nested objects
  const fixed: any = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    fixed[key] = fixThemeObject(obj[key]);
  }
  return fixed;
}

function fixThemeFile(themePath: string): boolean {
  try {
    const content = readFileSync(themePath, 'utf-8');
    const theme = JSON.parse(content);

    // Skip if this is an adaptive theme (has both light_ and dark_ prefixed defs)
    if (theme.defs && theme.defs.light_bg && theme.defs.dark_bg) {
      console.log(`  ⏭️  Skipping adaptive theme: ${themePath}`);
      return false;
    }

    // Check if theme.theme exists and needs fixing
    if (!theme.theme) {
      console.log(`  ⏭️  No theme.theme object: ${themePath}`);
      return false;
    }

    // Check if it needs fixing (has dark/light structure)
    const needsFix = Object.values(theme.theme).some(
      (val: any) => typeof val === 'object' && val !== null && 'dark' in val && 'light' in val
    );

    if (!needsFix) {
      console.log(`  ✓ Already fixed: ${themePath}`);
      return false;
    }

    // Fix the theme object
    theme.theme = fixThemeObject(theme.theme);

    // Write back
    writeFileSync(themePath, JSON.stringify(theme, null, 2), 'utf-8');
    console.log(`  ✅ Fixed: ${themePath}`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error fixing ${themePath}:`, error);
    return false;
  }
}

async function main() {
  console.log('🔧 Fixing OpenCode themes...\n');
  console.log(`Directory: ${OPENCODE_THEMES_DIR}\n`);

  const files = readdirSync(OPENCODE_THEMES_DIR).filter(f => f.endsWith('.json'));
  
  if (files.length === 0) {
    console.log('No theme files found.');
    return;
  }

  let fixedCount = 0;
  for (const file of files) {
    const themePath = join(OPENCODE_THEMES_DIR, file);
    if (fixThemeFile(themePath)) {
      fixedCount++;
    }
  }

  console.log(`\n✨ Done! Fixed ${fixedCount} of ${files.length} themes.`);
}

main();

