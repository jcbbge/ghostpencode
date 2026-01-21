import { getCurrentGhosttyTheme } from './ghostty';
import { getCurrentOpenCodeTheme } from './opencode';
import { syncFromGhostty } from './sync';
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

export async function startWatching(): Promise<void> {
  const ghosttyTheme = getCurrentGhosttyTheme() || '(none)';
  const opencodeTheme = getCurrentOpenCodeTheme() || '(none)';
  
  const inSync = ghosttyTheme === opencodeTheme && ghosttyTheme !== '(none)';
  const status = inSync ? '[✓]' : '[x]';
  
  console.log(`\nGHOSTTY :: ${ghosttyTheme} | OPENCODE :: ${opencodeTheme} ${status}\n`);
  
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
