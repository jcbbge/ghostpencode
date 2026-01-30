# ghostpencode installer for Windows
# Usage: irm https://raw.githubusercontent.com/jcbbge/ghostpencode/main/install.ps1 | iex

$ErrorActionPreference = "Stop"

Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║   ghostpencode installer v0.1.0       ║" -ForegroundColor Blue
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

# Check if Bun is installed
$hasBun = Get-Command bun -ErrorAction SilentlyContinue
$hasNpm = Get-Command npm -ErrorAction SilentlyContinue

if ($hasBun) {
    Write-Host "✓ Bun is installed" -ForegroundColor Green
} elseif ($hasNpm) {
    Write-Host "✓ npm is installed" -ForegroundColor Green
} else {
    Write-Host "✗ Neither Bun nor npm found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install Bun: https://bun.sh/docs/installation#windows" -ForegroundColor Yellow
    Write-Host "Or install Node.js: https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Choose installation method:" -ForegroundColor Cyan
Write-Host "  1) npm/bun (recommended)"
Write-Host "  2) Download pre-compiled binary"
Write-Host "  3) Build from source"
Write-Host ""
$choice = Read-Host "Enter choice [1-3]"

switch ($choice) {
    "1" {
        Write-Host "Installing via package manager..." -ForegroundColor Blue
        if ($hasBun) {
            bun install -g ghostpencode
        } else {
            npm install -g ghostpencode
        }
        Write-Host "✓ Installed via package manager" -ForegroundColor Green
    }
    
    "2" {
        Write-Host "Downloading pre-compiled binary..." -ForegroundColor Blue
        
        $arch = if ([Environment]::Is64BitOperatingSystem) { "x64" } else { "x86" }
        $binary = "ghostpencode-windows-$arch.exe"
        $url = "https://github.com/jcbbge/ghostpencode/releases/latest/download/$binary"
        
        Write-Host "Downloading from: $url"
        
        $installDir = "$env:LOCALAPPDATA\Programs\ghostpencode"
        New-Item -ItemType Directory -Force -Path $installDir | Out-Null
        
        $exePath = "$installDir\ghostpencode.exe"
        Invoke-WebRequest -Uri $url -OutFile $exePath
        
        # Add to PATH
        $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
        if ($userPath -notlike "*$installDir*") {
            [Environment]::SetEnvironmentVariable("Path", "$userPath;$installDir", "User")
            Write-Host "✓ Added to PATH (restart terminal to use)" -ForegroundColor Green
        }
        
        Write-Host "✓ Installed to $exePath" -ForegroundColor Green
    }
    
    "3" {
        Write-Host "Building from source..." -ForegroundColor Blue
        
        if (-not $hasBun) {
            Write-Host "✗ Bun required for building from source" -ForegroundColor Red
            Write-Host "Install Bun: https://bun.sh/docs/installation#windows" -ForegroundColor Yellow
            exit 1
        }
        
        $tempDir = New-TemporaryFile | ForEach-Object { Remove-Item $_; New-Item -ItemType Directory -Path $_ }
        Write-Host "Cloning to $tempDir..."
        
        git clone https://github.com/jcbbge/ghostpencode.git $tempDir
        Set-Location $tempDir
        
        bun install
        bun link
        
        Set-Location -
        Remove-Item -Recurse -Force $tempDir
        
        Write-Host "✓ Built and linked from source" -ForegroundColor Green
    }
    
    default {
        Write-Host "✗ Invalid choice" -ForegroundColor Red
        exit 1
    }
}

# Verify installation
Write-Host ""
Write-Host "Verifying installation..." -ForegroundColor Blue

$refreshEnv = Get-Command ghostpencode -ErrorAction SilentlyContinue
if ($refreshEnv) {
    Write-Host "✓ ghostpencode is installed!" -ForegroundColor Green
    Write-Host ""
    ghostpencode --help
    Write-Host ""
    Write-Host "✨ Installation complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Try it out:"
    Write-Host "  ghostpencode detect"
    Write-Host "  ghostpencode --help"
} else {
    Write-Host "✗ Installation failed - ghostpencode not found" -ForegroundColor Red
    Write-Host "You may need to restart your terminal" -ForegroundColor Yellow
    exit 1
}

