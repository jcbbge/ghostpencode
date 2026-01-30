#!/bin/bash
# ghostpencode installer - Universal install script for macOS/Linux
# Usage: curl -fsSL https://raw.githubusercontent.com/jcbbge/ghostpencode/main/install.sh | bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ghostpencode installer v0.1.0       ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# Detect OS
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Darwin)
    OS_TYPE="macos"
    ;;
  Linux)
    OS_TYPE="linux"
    ;;
  MINGW* | MSYS* | CYGWIN*)
    OS_TYPE="windows"
    ;;
  *)
    echo -e "${RED}✗ Unsupported OS: $OS${NC}"
    exit 1
    ;;
esac

echo -e "${GREEN}✓${NC} Detected: $OS_TYPE ($ARCH)"

# Check if Bun is installed
if command -v bun &> /dev/null; then
  echo -e "${GREEN}✓${NC} Bun is installed ($(bun --version))"
  HAS_BUN=true
else
  echo -e "${YELLOW}⚠${NC} Bun not found"
  HAS_BUN=false
fi

# Installation method selection
echo ""
echo "Choose installation method:"
echo "  1) npm/bun (recommended - requires Bun or Node.js)"
echo "  2) Download pre-compiled binary (no dependencies)"
echo "  3) Build from source (requires Bun)"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
  1)
    echo -e "${BLUE}Installing via npm...${NC}"
    if [ "$HAS_BUN" = true ]; then
      bun install -g ghostpencode
    elif command -v npm &> /dev/null; then
      npm install -g ghostpencode
    else
      echo -e "${RED}✗ Neither Bun nor npm found. Install Bun: https://bun.sh${NC}"
      exit 1
    fi
    echo -e "${GREEN}✓${NC} Installed via package manager"
    ;;
    
  2)
    echo -e "${BLUE}Downloading pre-compiled binary...${NC}"
    
    # Determine binary name
    case "$OS_TYPE-$ARCH" in
      macos-arm64)
        BINARY="ghostpencode-macos-arm64"
        ;;
      macos-x86_64)
        BINARY="ghostpencode-macos-x64"
        ;;
      linux-x86_64)
        BINARY="ghostpencode-linux-x64"
        ;;
      linux-aarch64)
        BINARY="ghostpencode-linux-arm64"
        ;;
      *)
        echo -e "${RED}✗ No pre-compiled binary for $OS_TYPE-$ARCH${NC}"
        echo "Try option 1 or 3 instead"
        exit 1
        ;;
    esac
    
    # Download binary
    DOWNLOAD_URL="https://github.com/jcbbge/ghostpencode/releases/latest/download/$BINARY"
    echo "Downloading from: $DOWNLOAD_URL"
    
    if command -v curl &> /dev/null; then
      curl -fsSL "$DOWNLOAD_URL" -o /tmp/ghostpencode
    elif command -v wget &> /dev/null; then
      wget -q "$DOWNLOAD_URL" -O /tmp/ghostpencode
    else
      echo -e "${RED}✗ Neither curl nor wget found${NC}"
      exit 1
    fi
    
    # Make executable
    chmod +x /tmp/ghostpencode
    
    # Move to PATH
    if [ -w /usr/local/bin ]; then
      mv /tmp/ghostpencode /usr/local/bin/ghostpencode
      echo -e "${GREEN}✓${NC} Installed to /usr/local/bin/ghostpencode"
    else
      sudo mv /tmp/ghostpencode /usr/local/bin/ghostpencode
      echo -e "${GREEN}✓${NC} Installed to /usr/local/bin/ghostpencode (required sudo)"
    fi
    ;;
    
  3)
    echo -e "${BLUE}Building from source...${NC}"
    
    if [ "$HAS_BUN" = false ]; then
      echo -e "${RED}✗ Bun required for building from source${NC}"
      echo "Install Bun: curl -fsSL https://bun.sh/install | bash"
      exit 1
    fi
    
    # Clone to temp directory
    TEMP_DIR=$(mktemp -d)
    echo "Cloning to $TEMP_DIR..."
    git clone https://github.com/jcbbge/ghostpencode.git "$TEMP_DIR"
    cd "$TEMP_DIR"
    
    # Install and link
    bun install
    bun link
    
    # Cleanup
    cd -
    rm -rf "$TEMP_DIR"
    
    echo -e "${GREEN}✓${NC} Built and linked from source"
    ;;
    
  *)
    echo -e "${RED}✗ Invalid choice${NC}"
    exit 1
    ;;
esac

# Verify installation
echo ""
echo -e "${BLUE}Verifying installation...${NC}"
if command -v ghostpencode &> /dev/null; then
  echo -e "${GREEN}✓${NC} ghostpencode is installed!"
  echo ""
  ghostpencode --help
  echo ""
  echo -e "${GREEN}✨ Installation complete!${NC}"
  echo ""
  echo "Try it out:"
  echo "  ghostpencode detect"
  echo "  ghostpencode --help"
else
  echo -e "${RED}✗ Installation failed - ghostpencode not found in PATH${NC}"
  exit 1
fi

