const chars = "!@#$%^&*()-_=+[{]};:,.<>?/0123456789";

/**
 * Resolves random characters into the final string with a hacker-style animation
 * @param targetText - The final string to display
 * @param suffix - Optional suffix to append after decoding (e.g., colored icons)
 * @param speed - Milliseconds between frames
 */
export async function hackerDecode(
  targetText: string,
  suffix = '',
  speed = 35
): Promise<void> {
  let currentDisplay = Array(targetText.length).fill(' ');
  let resolvedIndices = new Set<number>();

  while (resolvedIndices.size < targetText.length) {
    for (let i = 0; i < targetText.length; i++) {
      if (!resolvedIndices.has(i)) {
        // Flash random glitch character
        currentDisplay[i] = chars[Math.floor(Math.random() * chars.length)];

        // Randomly "lock" the correct character
        if (Math.random() < 0.15) {
          currentDisplay[i] = targetText[i];
          resolvedIndices.add(i);
        }
      }
    }

    // Write to terminal: Cyan (\x1b[36m), Reset (\x1b[0m)
    process.stdout.write(`\r\x1b[36m${currentDisplay.join('')}\x1b[0m${suffix}`);
    await new Promise(res => setTimeout(res, speed));
  }

  // Print final string with suffix and move to new line
  process.stdout.write(`\r${targetText}${suffix}\n`);
}
