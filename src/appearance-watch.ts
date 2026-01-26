import { spawn } from 'child_process';
import { syncFromGhostty } from './sync';
import { getCurrentGhosttyTheme } from './ghostty';

/**
 * Watch macOS system appearance and sync themes when it changes
 *
 * When macOS switches between Light/Dark mode:
 * 1. Ghostty auto-switches (if configured with light:X,dark:Y)
 * 2. This watcher detects the change
 * 3. Syncs Ghostty's new active theme to OpenCode
 */
export function watchSystemAppearance(): void {
  console.log('👁️  Watching system appearance for theme changes...');
  console.log('   (Ghostty will auto-switch if configured with light:X,dark:Y)');
  console.log('   Press Ctrl+C to stop\n');

  let lastTheme = getCurrentGhosttyTheme();
  console.log(`Current Ghostty theme: ${lastTheme || '(none)'}`);

  // Poll for theme changes every 2 seconds
  // (macOS doesn't have a great native event API for appearance changes in CLI)
  const checkInterval = setInterval(() => {
    const currentTheme = getCurrentGhosttyTheme();

    if (currentTheme && currentTheme !== lastTheme) {
      console.log(`\n🔄 Theme changed: ${lastTheme} → ${currentTheme}`);
      console.log('   Syncing to OpenCode...');

      try {
        syncFromGhostty(currentTheme, true);
        console.log('   ✓ Synced to OpenCode\n');
      } catch (error) {
        console.error(`   ✗ Sync failed: ${error}\n`);
      }

      lastTheme = currentTheme;
    }
  }, 2000);

  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log('\n\n👋 Stopped watching');
    clearInterval(checkInterval);
    process.exit(0);
  });
}
