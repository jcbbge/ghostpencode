# Theme Issues Fixed

## Summary

Fixed two critical issues with the ghostpencode theme system:

1. **OpenCode themes appearing with light backgrounds** - Dark themes were being rendered with light color palettes
2. **Extract command auto-applying themes** - No user confirmation or palette preview before applying

## Issue 1: Light Theme Corruption

### Problem

All OpenCode themes created by ghostpencode had both `dark` and `light` properties in the `theme.theme` object:

```json
{
  "theme": {
    "primary": { "dark": "brightBlue", "light": "brightBlue" },
    "background": { "dark": "bg", "light": "bg" }
  }
}
```

This caused OpenCode to treat these as adaptive themes and switch to "light mode" colors when the system appearance was light, resulting in dark themes appearing with light backgrounds.

### Root Cause

The `writeOpenCodeTheme()` function in `src/opencode.ts` was incorrectly setting both `dark` and `light` properties for non-adaptive themes. This structure is only appropriate for adaptive themes (which have separate `light_*` and `dark_*` color definitions).

### Solution

Modified `src/opencode.ts` line 266-319 to use simple string values instead of objects:

```json
{
  "theme": {
    "primary": "brightBlue",
    "background": "bg"
  }
}
```

This tells OpenCode to use these colors regardless of system appearance, which is correct for non-adaptive themes.

### Migration

Created `scripts/fix-opencode-themes.ts` to automatically fix all existing themes:

```bash
bun scripts/fix-opencode-themes.ts
```

This script:
- Scans `~/.config/opencode/themes/`
- Detects themes with the problematic structure
- Converts `{ dark: X, light: Y }` to just `X`
- Skips adaptive themes (which correctly use the dual structure)
- Backs up nothing (writes in place)

**Result:** Fixed 6 of 7 themes (1 was already an adaptive theme).

## Issue 2: Extract Command UX

### Problem

The `ghostpencode extract <image>` command would:
1. Extract palette from image
2. **Immediately apply** to both Ghostty and OpenCode
3. Show "themes activated" message
4. **Not display** the extracted color palette
5. **Not prompt** for confirmation

This violated the user's expectation:
- No visual preview of extracted colors
- No choice to review before applying
- Ghostty config changed without confirmation
- OpenCode theme changed without confirmation

### Solution

Modified `src/sync.ts` `extractFromImage()` function (lines 19-65):

**New flow:**
1. Extract palette from image
2. **Display colored blocks** showing the 16 ANSI colors
3. Create theme files (Ghostty + OpenCode)
4. **Prompt user:** "APPLY THEMES NOW? [y/n]"
5. If yes:
   - Apply to Ghostty config
   - Apply to OpenCode config
   - Reload Ghostty (SIGUSR2)
   - Show success message
6. If no:
   - Show "theme files created (not activated)"
   - Show command to apply later

**Added features:**
- Exported `displayColoredBlocks()` from `src/recalibrate.ts`
- Exported `prompt()` from `src/recalibrate.ts`
- Added `reloadGhosttyConfig()` call after applying
- Added helpful message about restarting OpenCode

### Example Output

```
Extracting palette from sunset.png...

Extracted palette:
████████████████

Creating Ghostty theme: Sunset
✓ Ghostty theme written to ~/.config/ghostty/themes/Sunset

Creating OpenCode theme: sunset
✓ OpenCode theme written to ~/.config/opencode/themes/sunset.json

APPLY THEMES NOW? [y/n]: y

✨ Themes created and activated!
  Ghostty: "Sunset"
  OpenCode: "sunset"

ℹ️  Restart OpenCode to see the new theme.
```

## Files Changed

1. `src/opencode.ts` - Fixed theme.theme structure (line 266-319)
2. `src/sync.ts` - Added palette display and prompt (line 1-65)
3. `src/recalibrate.ts` - Exported `displayColoredBlocks` and `prompt` (lines 192, 280)
4. `scripts/fix-opencode-themes.ts` - New migration script

## Testing

Run the migration script to fix existing themes:
```bash
bun scripts/fix-opencode-themes.ts
```

Test the extract command:
```bash
ghostpencode extract test-image.png --name test-theme
```

Verify themes are no longer corrupted:
```bash
cat ~/.config/opencode/themes/zenburn.json | grep -A 5 '"theme"'
```

## Notes

- **Adaptive themes** (with `light_*` and `dark_*` defs) still correctly use the dual structure
- **Ghostty reload** now happens automatically via SIGUSR2 signal
- **OpenCode** still requires manual restart (no reload mechanism available)
- **No data loss** - all theme files preserved, just structure corrected

