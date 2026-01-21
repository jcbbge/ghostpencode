import { getCurrentGhosttyTheme, readGhosttyTheme } from './ghostty';
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

  // Match icon without colors
  const matchIcon = inSync ? "[✔]" : "[✘]";

  // Get color palette from Ghostty theme
  let colors: string[] = [];
  let finalColor: string | undefined;
  if (ghosttyTheme !== '(none)') {
    const palette = readGhosttyTheme(ghosttyTheme);
    if (palette) {
      // Use all the vibrant colors for animation
      colors = [
        palette.cyan,
        palette.brightCyan,
        palette.blue,
        palette.brightBlue,
        palette.magenta,
        palette.brightMagenta,
        palette.green,
        palette.brightGreen,
      ];
      // Use foreground color for final text (matches terminal text)
      finalColor = palette.foreground;
    }
  }

  if (inSync) {
    // Display only (no sync prompt)
    const finalStr = `SYS_THEME :: [ GHT ] ${ghosttyTheme} ◆ [ OCD ] ${opencodeTheme} ${matchIcon}`;
    await hackerDecode(finalStr, '', colors, finalColor, 25);
    console.log(); // newline after
    process.exit(0);
  }

  if (ghosttyTheme === '(none)') {
    console.log('No Ghostty theme detected.');
    process.exit(1);
  }

  // Display + sync prompt on same line (themes don't match)
  const finalStr = `SYS_THEME :: [ GHT ] ${ghosttyTheme} ◆ [ OCD ] ${opencodeTheme} ${matchIcon} | Sync? (y/n): `;
  await hackerDecode(finalStr, '', colors, finalColor, 25);

  // Now read the answer WITHOUT using readline's question (which clears)
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const shouldSync = await new Promise<boolean>((resolve) => {
    process.stdin.once('data', (data) => {
      const answer = data.toString().trim().toLowerCase();
      rl.close();
      console.log(); // newline after answer
      resolve(answer === 'y' || answer === 'yes');
    });
  });

  if (shouldSync) {
    try {
      syncFromGhostty(ghosttyTheme, true);
      console.log('Done.');
    } catch (error) {
      console.error(`Failed: ${error}`);
      process.exit(1);
    }
  } else {
    process.exit(0);
  }
}
