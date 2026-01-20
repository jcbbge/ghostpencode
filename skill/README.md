# Theme Sync Skill

Bi-directional theme synchronization between Ghostty terminal and OpenCode using `ghostpencode`.

## When to Use

This skill activates when the user mentions:
- "sync my themes"
- "update my Ghostty/OpenCode theme"
- "extract colors from this image"
- "make my terminal and OpenCode match"
- Shows you an image and asks about themes

## Capabilities

### 1. Extract Theme from Image
When user provides an image and wants to create a theme:

```bash
ghostpencode extract <image-path>
```

- Automatically extracts 16-color palette using k-means clustering
- Creates both Ghostty and OpenCode themes
- Activates themes in both configs
- Theme name defaults to image filename (can override with `--name`)

### 2. Sync from Ghostty → OpenCode
When user changes their Ghostty theme and wants OpenCode to match:

```bash
ghostpencode sync --from ghostty
```

- Reads current active Ghostty theme
- Generates matching OpenCode theme
- Updates OpenCode config

### 3. Sync from OpenCode → Ghostty
When user likes an OpenCode theme and wants Ghostty to match:

```bash
ghostpencode sync --from opencode
```

- Reads current active OpenCode theme
- Generates matching Ghostty theme
- Updates Ghostty config

### 4. Detect Current Themes
Check what themes are currently active:

```bash
ghostpencode detect
```

Shows current theme for both Ghostty and OpenCode, and whether they're in sync.

## Examples

**Extract from image:**
```bash
# User: "Hey, can you extract a theme from this sunset image?"
ghostpencode extract ~/Downloads/sunset.png

# Custom name:
ghostpencode extract ~/Downloads/moody-photo.jpg --name dark-ocean
```

**Sync themes:**
```bash
# User: "I changed my Ghostty theme to Nord, update OpenCode"
ghostpencode sync --from ghostty --theme Nord

# User: "I love this OpenCode theme, make Ghostty match it"
ghostpencode sync --from opencode

# User: "Are my themes in sync?"
ghostpencode detect
```

## Workflow

1. **User mentions theme sync** → Check which direction
2. **User provides image** → Use `extract`
3. **User changed Ghostty** → Use `sync --from ghostty`
4. **User changed OpenCode** → Use `sync --from opencode`
5. **User asks about current state** → Use `detect`

## Technical Details

- **Palette extraction**: K-means clustering on resized image (100x100)
- **Color mapping**: Intelligently maps colors to ANSI 0-15 slots by hue and luminance
- **Config locations**:
  - Ghostty: `~/Library/Application Support/com.mitchellh.ghostty/config`
  - Ghostty themes: `~/.config/ghostty/themes/`
  - OpenCode: `~/.config/opencode/opencode.json`
  - OpenCode themes: `~/.config/opencode/themes/`

## Installation

The skill is automatically installed when the user runs:
```bash
bun install -g ghostpencode
```

No manual setup required.

## Error Handling

- If Ghostty config not found → Inform user, ask for path
- If OpenCode config not found → Create it automatically
- If theme not found → List available themes
- If image invalid → Request valid image path

## Response Pattern

Always:
1. Confirm what action you're taking
2. Run the command
3. Verify success
4. Inform user of the result
5. Store the interaction in memory for future reference

Example response:
> "I'll extract a theme from that sunset image and sync both Ghostty and OpenCode. Let me run that now..."
> 
> [runs command]
> 
> "✨ Created and activated 'sunset' theme for both Ghostty and OpenCode! The palette has warm oranges and deep blues from your image."
