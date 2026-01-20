# ghostpencode

> Bi-directional theme sync between Ghostty terminal and OpenCode

Extract color palettes from images or sync themes between Ghostty and OpenCode with a single command.

## Features

- **Extract from images** - Generate themes from any image using k-means color clustering
- **Bi-directional sync** - Ghostty ↔ OpenCode theme synchronization  
- **Zero config** - Works out of the box, auto-installs OpenCode skill
- **Lightweight** - ~200 LOC, single dependency (sharp for image processing)
- **World-class DX** - Smart defaults, no interruptions, just works

## Installation

```bash
bun install -g ghostpencode
```

This automatically installs the OpenCode skill to `~/.config/opencode/skill/theme-sync/`.

## Usage

### Extract theme from image

```bash
# Auto-names theme from filename
ghostpencode extract sunset.png

# Custom theme name
ghostpencode extract moody-photo.jpg --name dark-ocean
```

Creates and activates the theme in both Ghostty and OpenCode.

### Sync themes

```bash
# Ghostty → OpenCode
ghostpencode sync --from ghostty

# OpenCode → Ghostty  
ghostpencode sync --from opencode

# Sync specific theme
ghostpencode sync --from ghostty --theme "Zenwritten Dark"
```

### Check current themes

```bash
ghostpencode detect
```

Shows active themes and sync status.

## How It Works

**Palette Extraction:**
1. Resizes image to 100×100 for speed
2. Applies k-means clustering to extract dominant colors
3. Intelligently maps colors to ANSI 0-15 slots by hue and luminance
4. Generates proper theme files for both tools

**Theme Sync:**
- Reads from source (Ghostty or OpenCode)
- Converts palette format
- Writes to destination
- Updates active theme config

## File Locations

```
Ghostty config:  ~/Library/Application Support/com.mitchellh.ghostty/config
Ghostty themes:  ~/.config/ghostty/themes/

OpenCode config: ~/.config/opencode/opencode.json
OpenCode themes: ~/.config/opencode/themes/
```

## Examples

```bash
# Extract theme from wallpaper
ghostpencode extract ~/Pictures/wallpaper.jpg --name my-wallpaper

# Changed Ghostty theme manually, sync to OpenCode
ghostpencode sync --from ghostty

# Trying out OpenCode themes, apply to Ghostty
ghostpencode sync --from opencode --theme nord

# Check if themes match
ghostpencode detect
```

## OpenCode Integration

When installed, `ghostpencode` automatically registers a skill in OpenCode. This teaches the AI assistant how to help you sync themes.

Just say:
- "Extract a theme from this image"
- "Sync my Ghostty and OpenCode themes"
- "Make my terminal match OpenCode"

The assistant knows what to do.

## Development

```bash
git clone https://github.com/jcbbge/ghostpencode.git
cd ghostpencode
bun install
bun run src/cli.ts --help
```

## License

MIT
