#!/usr/bin/env bun

import { existsSync, mkdirSync, cpSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const OPENCODE_SKILL_DIR = join(homedir(), '.config/opencode/skill/theme-sync');

function installSkill() {
  // Check if OpenCode config directory exists
  const opencodeDir = join(homedir(), '.config/opencode');
  if (!existsSync(opencodeDir)) {
    // User doesn't have OpenCode, skip silently
    return;
  }

  // Get the skill directory from our package
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const skillSource = join(currentDir, '../skill');

  if (!existsSync(skillSource)) {
    console.warn('Warning: Skill source directory not found');
    return;
  }

  // Create skill directory if it doesn't exist
  const skillDir = join(homedir(), '.config/opencode/skill');
  if (!existsSync(skillDir)) {
    mkdirSync(skillDir, { recursive: true });
  }

  // Copy skill files
  try {
    cpSync(skillSource, OPENCODE_SKILL_DIR, { recursive: true });
    console.log('✓ Installed OpenCode theme-sync skill');
  } catch (error) {
    // Silent fail - don't break installation
  }
}

installSkill();
