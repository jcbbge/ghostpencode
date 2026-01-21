
Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";
import { createRoot } from "react-dom/client";

// import .css files directly and it works
import './index.css';

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.mdx`.

## Theme Locations Reference

### OpenCode Themes

**Default/Built-in Themes (30 themes):**
Built into the OpenCode binary at `/opt/homebrew/lib/node_modules/opencode-ai/node_modules/opencode-darwin-arm64/bin/opencode`

List of built-in themes:
- aura, ayu, catppuccin, catppuccin-frappe, catppuccin-macchiato, cobalt2, cursor, dracula, everforest, flexoki, github, gruvbox, kanagawa, lucent-orng, material, matrix, mercury, monokai, nightowl, nord, one-dark, opencode, orng, osaka-jade, palenight, rosepine, solarized, synthwave84, tokyonight, vercel

**User Custom Themes:**
- Location: `~/.config/opencode/themes/`
- Format: JSON files following schema at `https://opencode.ai/theme.json`
- Active theme set in: `~/.config/opencode/opencode.json`

**Accessing themes:**
- In OpenCode CLI: Use keybind `<leader>t` (default: `ctrl+x` then `t`)
- Lists all available themes with preview

### Ghostty Themes

**Default/Built-in Themes (442 themes):**
Built into Ghostty application. View full list with:
```bash
ghostty +list-themes
```

Notable themes include: Nord, Dracula, Gruvbox, Catppuccin variants, TokyoNight, Solarized, Monokai, and 435+ others.

**User Custom Themes:**
- Location: `~/.config/ghostty/themes/`
- Format: Ghostty theme files
- Active theme set in: `~/.config/ghostty/config`

### Theme Syncing

The `ghostpencode` tool provides theme synchronization between OpenCode and Ghostty:

```bash
# Show current themes
ghostpencode detect

# Sync from Ghostty to OpenCode
ghostpencode sync --from ghostty

# Sync from OpenCode to Ghostty
ghostpencode sync --from opencode

# Extract theme from image
ghostpencode extract <image-path>
```
