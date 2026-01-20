# Test Suite

Comprehensive test coverage for ghostpencode.

## Test Structure

```
tests/
├── unit/               # Unit tests for individual modules
│   ├── extract.test.ts   # Palette extraction logic
│   ├── ghostty.test.ts   # Ghostty theme I/O
│   ├── opencode.test.ts  # OpenCode theme I/O
│   └── sync.test.ts      # Synchronization logic
├── integration/        # Integration tests
│   ├── cli.test.ts       # CLI command testing
│   └── e2e.test.ts       # End-to-end workflows
└── fixtures/           # Test data (auto-generated)
```

## Running Tests

```bash
# All tests
bun test

# Unit tests only
bun run test:unit

# Integration tests only
bun run test:integration

# Watch mode
bun run test:watch

# Coverage report
bun run test:coverage
```

## Test Coverage

**Unit Tests (37 tests):**
- ✅ Palette extraction from images
- ✅ RGB to hex conversion with clamping
- ✅ Hue-based color mapping
- ✅ Ghostty theme file generation
- ✅ OpenCode theme JSON generation
- ✅ Theme name normalization
- ✅ Config file reading/writing
- ✅ Error handling for invalid inputs

**Integration Tests (28 tests):**
- ✅ CLI command parsing
- ✅ Help text display
- ✅ Extract command workflow
- ✅ Sync command validation
- ✅ Detect command output
- ✅ End-to-end: image → both themes
- ✅ Color fidelity across formats
- ✅ ANSI color preservation
- ✅ Performance benchmarks
- ✅ Edge cases (large images, corrupt files, special characters)

**Total: 65 tests, all passing**

## Key Test Scenarios

### Color Accuracy
- Validates 20 color values (background, foreground, 16 ANSI, cursor, selection)
- Ensures hex format (#rrggbb)
- Tests RGB clamping (0-255 range)
- Verifies bright/dark color relationships

### Theme Synchronization
- Tests Ghostty ↔ OpenCode conversions
- Validates theme name normalization ("Zenwritten Dark" ≡ "zenwritten-dark")
- Ensures all ANSI colors preserved
- Checks color consistency across formats

### Error Handling
- Non-existent images
- Corrupt image files
- Invalid theme names
- Missing config files
- Edge cases (tiny/large images, special characters)

### Performance
- Typical wallpaper size (1920×1080): < 2s average
- Large images (4000×3000): < 5s
- Multiple extraction iterations for consistency

## Bugs Fixed During Testing

1. **RGB overflow** - rgbToHex wasn't clamping values, producing invalid hex (#1000000)
2. **Theme name comparison** - Strict equality failed for "Zenwritten Dark" vs "zenwritten-dark"

## CI/CD Ready

Tests can be integrated into GitHub Actions:

```yaml
- name: Run tests
  run: bun test
```

All tests use fixtures and temporary directories - no system pollution.
