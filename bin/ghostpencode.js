#!/usr/bin/env node

// Wrapper to run TypeScript CLI with Bun
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cliPath = join(__dirname, '..', 'src', 'cli.ts');

// Check if bun is available
const useBun = process.versions.bun !== undefined;

if (useBun) {
  // Running with Bun - import directly
  import(cliPath);
} else {
  // Running with Node - try to use bun
  const child = spawn('bun', ['run', cliPath, ...process.argv.slice(2)], {
    stdio: 'inherit',
    shell: true
  });

  child.on('error', (err) => {
    if (err.code === 'ENOENT') {
      console.error('Error: Bun is required to run ghostpencode');
      console.error('Install Bun: https://bun.sh');
      process.exit(1);
    } else {
      throw err;
    }
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}

