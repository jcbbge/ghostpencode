# Installation Guide

Choose your preferred installation method:

## 🚀 Quick Install (Recommended)

### macOS / Linux

```bash
curl -fsSL https://raw.githubusercontent.com/jcbbge/ghostpencode/main/install.sh | bash
```

### Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/jcbbge/ghostpencode/main/install.ps1 | iex
```

---

## 📦 Package Managers

### npm / Bun (All platforms)

```bash
# With Bun (recommended)
bun install -g ghostpencode

# With npm
npm install -g ghostpencode

# With pnpm
pnpm install -g ghostpencode

# Zero-install (no installation needed)
bunx ghostpencode --help
npx ghostpencode --help
```

### Homebrew (macOS)

```bash
# Add tap
brew tap jcbbge/tap

# Install
brew install ghostpencode

# Update
brew upgrade ghostpencode
```

---

## 💾 Pre-compiled Binaries

Download from [GitHub Releases](https://github.com/jcbbge/ghostpencode/releases/latest):

### macOS

```bash
# Apple Silicon (M1/M2/M3)
curl -fsSL https://github.com/jcbbge/ghostpencode/releases/latest/download/ghostpencode-macos-arm64 -o ghostpencode
chmod +x ghostpencode
sudo mv ghostpencode /usr/local/bin/

# Intel
curl -fsSL https://github.com/jcbbge/ghostpencode/releases/latest/download/ghostpencode-macos-x64 -o ghostpencode
chmod +x ghostpencode
sudo mv ghostpencode /usr/local/bin/
```

### Linux

```bash
# x64
curl -fsSL https://github.com/jcbbge/ghostpencode/releases/latest/download/ghostpencode-linux-x64 -o ghostpencode
chmod +x ghostpencode
sudo mv ghostpencode /usr/local/bin/

# ARM64
curl -fsSL https://github.com/jcbbge/ghostpencode/releases/latest/download/ghostpencode-linux-arm64 -o ghostpencode
chmod +x ghostpencode
sudo mv ghostpencode /usr/local/bin/
```

### Windows

Download `ghostpencode-windows-x64.exe` from releases and add to PATH.

---

## 🔨 Build from Source

```bash
# Clone repository
git clone https://github.com/jcbbge/ghostpencode.git
cd ghostpencode

# Install dependencies
bun install

# Run tests
bun test

# Link globally
bun link

# Verify
ghostpencode --help
```

---

## ✅ Verify Installation

```bash
ghostpencode --help
```

You should see:
```
ghostpencode - Theme sync for Ghostty & OpenCode

Usage:
  ghostpencode                                      Check sync status
  ghostpencode sync --from <ghostty|opencode>       Manual sync
  ghostpencode detect                               Show current themes
  ghostpencode extract <image> [--name <name>]      Extract from image
```

---

## 🔄 Updating

### npm/Bun
```bash
bun update -g ghostpencode
# or
npm update -g ghostpencode
```

### Homebrew
```bash
brew upgrade ghostpencode
```

### Binary
Re-run the install script or download the latest release.

---

## 🗑️ Uninstalling

### npm/Bun
```bash
bun remove -g ghostpencode
# or
npm uninstall -g ghostpencode
```

### Homebrew
```bash
brew uninstall ghostpencode
```

### Binary
```bash
sudo rm /usr/local/bin/ghostpencode
```

---

## 🆘 Troubleshooting

### "command not found: ghostpencode"

**Solution:** Restart your terminal or reload your shell:
```bash
source ~/.zshrc  # or ~/.bashrc
```

### Permission denied

**Solution:** Use `sudo` when moving to `/usr/local/bin/`:
```bash
sudo mv ghostpencode /usr/local/bin/
```

### Windows: Script execution disabled

**Solution:** Enable script execution in PowerShell:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📚 Next Steps

After installation:

1. **Check sync status:**
   ```bash
   ghostpencode
   ```

2. **Sync themes:**
   ```bash
   ghostpencode sync --from ghostty
   ```

3. **Extract from image:**
   ```bash
   ghostpencode extract ~/Pictures/wallpaper.jpg
   ```

See [README.md](./README.md) for full documentation.

