# Development Guide

## Installation for Development

The tool is installed globally via symlink, so changes are immediately reflected:

```bash
# Initial setup (already done)
cd /Users/jcbbge/ghostpencode
bun install -g .
```

This creates a symlink:
```
~/.bun/bin/ghostpencode → /Users/jcbbge/ghostpencode/src/cli.ts
```

## Dogfooding Workflow

**Every change is immediately live:**

```bash
# 1. Make changes to src/
vim src/extract.ts

# 2. Test immediately
ghostpencode extract test-image.png

# 3. Run tests
bun test

# 4. Commit when satisfied
git commit -m "improve extraction"
```

**No rebuild or reinstall needed!** The symlink means the global `ghostpencode` command runs your local development code.

## Testing

```bash
# All tests
bun test

# Watch mode (runs tests on file changes)
bun run test:watch

# Specific test file
bun test tests/unit/extract.test.ts

# Coverage
bun run test:coverage
```

## Reinstalling After Major Changes

If you modify `package.json` or `bin` config:

```bash
bun install -g .
```

This updates the symlink if needed.

## Uninstalling

```bash
bun uninstall -g ghostpencode
```

## Directory Structure

```
ghostpencode/
├── src/               # Source code (symlinked)
│   ├── cli.ts         # Entry point
│   ├── extract.ts     # Image → palette
│   ├── ghostty.ts     # Ghostty I/O
│   ├── opencode.ts    # OpenCode I/O
│   ├── sync.ts        # Sync logic
│   └── types.ts       # Types
├── tests/             # Test suite
│   ├── unit/          # Unit tests
│   └── integration/   # Integration tests
├── skill/             # OpenCode skill (auto-installed)
└── package.json       # Includes postinstall hook
```

## Publishing to npm

When ready to publish:

```bash
# Update version
npm version patch  # or minor, major

# Publish
npm publish

# Tag release
git tag v0.1.1
git push --tags
```

## Tips

- **Use absolute paths** when testing: `ghostpencode extract ~/Pictures/wallpaper.png`
- **Test with real themes**: Use your actual Ghostty/OpenCode configs
- **Check logs**: Errors are output to stderr
- **Profile performance**: Use `time ghostpencode extract large.png`

## Troubleshooting

**Command not found:**
- Check PATH includes `~/.bun/bin`: `echo $PATH | grep bun`
- Reload shell: `source ~/.zshrc`

**Changes not reflected:**
- Symlink should be active: `ls -la ~/.bun/bin/ghostpencode`
- If broken, reinstall: `bun install -g .`

**Tests failing:**
- Clean fixtures: `rm -rf tests/fixtures`
- Reinstall deps: `bun install`
- Check Bun version: `bun --version` (requires 1.0+)
