import { getCurrentGhosttyTheme } from './ghostty';
import { getCurrentOpenCodeTheme } from './opencode';
import { syncFromGhostty } from './sync';
import { hackerDecode } from './hacker-decode';
import * as readline from 'readline';

async function promptUser(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim() === 'y' || answer.toLowerCase().trim() === 'yes');
    });
  });
}

function normalizeThemeName(name: string): string {
  return name.toLowerCase().replace(/[\s-_]+/g, '');
}

export async function startWatching(): Promise<void> {
  const ghosttyTheme = getCurrentGhosttyTheme() || '(none)';
  const opencodeTheme = getCurrentOpenCodeTheme() || '(none)';

  const inSync = ghosttyTheme !== '(none)' && opencodeTheme !== '(none)'
    && normalizeThemeName(ghosttyTheme) === normalizeThemeName(opencodeTheme);

  // ANSI Colors: Bold Green [✔] or Bold Red [✘]
  const matchIcon = inSync ? "\x1b[1;32m[✔]\x1b[0m" : "\x1b[1;31m[✘]\x1b[0m";

  // Display with hacker decode animation
  const finalStr = `SYS_THEME :: [ GHT ] ${ghosttyTheme} ◆ [ OCD ] ${opencodeTheme} `;
  console.log(); // blank line before
  await hackerDecode(finalStr, matchIcon);
  console.log(); // blank line after

  if (inSync) {
    process.exit(0);
  }

  if (ghosttyTheme === '(none)') {
    console.log('No Ghostty theme detected.\n');
    process.exit(1);
  }

  const shouldSync = await promptUser('Sync? (y/n): ');

  if (shouldSync) {
    try {
      syncFromGhostty(ghosttyTheme, true);
      console.log('Done.\n');
    } catch (error) {
      console.error(`Failed: ${error}\n`);
      process.exit(1);
    }
  } else {
    console.log();
    process.exit(0);
  }
}
