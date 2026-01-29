# Assets

This directory contains demo GIFs and other media assets for the README.

## Demo GIFs

### demo-sync.gif
Demo showing the quick sync workflow:
1. Run `ghostpencode` (no arguments)
2. See current theme status
3. Auto-prompt to sync if themes don't match
4. Show instant sync result

### demo-extract.gif
Demo showing image palette extraction:
1. Run `ghostpencode extract photo.jpg --name 'My Theme'`
2. Show k-means color extraction process
3. Display created theme files
4. Show theme activated in both Ghostty and OpenCode

## Recording Demo GIFs

Recommended tools:
- **VHS**: https://github.com/charmbracelet/vhs (declarative, reproducible)
- **asciinema + agg**: https://asciinema.org/ (terminal recording)
- **Terminalizer**: https://github.com/faressoft/terminalizer

### Tips:
- Keep demos under 10 seconds
- Use a clean terminal with readable font (16-18pt)
- Show real output, not mocked
- Optimize GIF file size (use gifsicle or online tools)
