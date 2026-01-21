const chars = "!@#$%^&*()-_=+[{]};:,.<>?/0123456789";

/**
 * Resolves random characters into the final string with a hacker-style animation
 * @param targetText - The final string to display
 * @param suffix - Optional suffix to append after decoding (stays on same line)
 * @param colors - Array of hex colors from theme palette for random coloring during animation
 * @param finalColor - Hex color for resolved text (e.g., foreground color)
 * @param speed - Milliseconds between frames
 */
export async function hackerDecode(
  targetText: string,
  suffix = '',
  colors: string[] = [],
  finalColor?: string,
  speed = 25
): Promise<void> {
  let currentDisplay = Array(targetText.length).fill(' ');
  let resolvedIndices = new Set<number>();

  let frameCount = 0;
  while (resolvedIndices.size < targetText.length) {
    for (let i = 0; i < targetText.length; i++) {
      if (!resolvedIndices.has(i)) {
        // Flash random glitch character
        currentDisplay[i] = chars[Math.floor(Math.random() * chars.length)];

        // Randomly "lock" the correct character
        if (Math.random() < 0.12) {
          currentDisplay[i] = targetText[i];
          resolvedIndices.add(i);
        }
      }
    }

    // Only update terminal every 2 frames to reduce write frequency
    if (frameCount % 2 === 0) {
      // Build string with colors
      let output = '\r';
      for (let i = 0; i < currentDisplay.length; i++) {
        if (resolvedIndices.has(i)) {
          // Resolved: use the same final color for all
          const color = finalColor ? hexToAnsi(finalColor) : '';
          const reset = finalColor ? '\x1b[0m' : '';
          output += `${color}${currentDisplay[i]}${reset}`;
        } else {
          // Unresolved: use random color
          const randomColor = colors.length > 0
            ? hexToAnsi(colors[Math.floor(Math.random() * colors.length)])
            : '';
          const reset = colors.length > 0 ? '\x1b[0m' : '';
          output += `${randomColor}${currentDisplay[i]}${reset}`;
        }
      }
      process.stdout.write(output + suffix);
    }
    frameCount++;
    await new Promise(res => setTimeout(res, speed));
  }

  // Print final string with all characters in the same color
  const color = finalColor ? hexToAnsi(finalColor) : '';
  const reset = finalColor ? '\x1b[0m' : '';
  process.stdout.write(`\r${color}${targetText}${reset}${suffix}`);
}

/**
 * Convert hex color to ANSI 24-bit true color escape code
 */
function hexToAnsi(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `\x1b[38;2;${r};${g};${b}m`;
}
