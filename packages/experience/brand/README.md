# @stackra/brand

Stackra brand tokens, logos, and fonts — the single source of truth for the Stackra visual identity in code.

**Kind:** lib — design tokens, static assets, and font files. **Tier:** `tier:lib` (`packages/experience/brand`).

## What it holds

| Content                            | Where                           | Notes                                                               |
| ---------------------------------- | ------------------------------- | ------------------------------------------------------------------- |
| Color tokens (light + dark)        | `src/tokens/tokens.css`         | CSS custom properties, `:root` and `[data-theme="dark"]`            |
| Color tokens (TS)                  | `src/tokens/tokens.ts`          | Typed constants for programmatic access                             |
| Color tokens (JSON)                | `src/tokens/tokens.json`        | Portable JSON for non-TS consumers                                  |
| Typography scale                   | `src/tokens/tokens.css` / `.ts` | Display, h1–h3, body, small, caption, mono, label + Arabic variants |
| Spacing / radius / shadow / motion | `src/tokens/tokens.css` / `.ts` | Shared layout primitives                                            |
| SVG logos                          | `src/logos/`                    | Wordmark, small wordmark, endorsed lockup, ST tile (light + dark)   |
| Font files                         | `src/fonts/`                    | Geist, Geist Mono, IBM Plex Sans Arabic (woff2)                     |
| Font licenses                      | `src/fonts/OFL-*.txt`           | SIL Open Font License texts                                         |

## Design source of truth

The external `brand-kits/` directory (at `../.old/brand-kits/stackra/`) is the **design source of truth**.
This package is a curated, vendored copy of the approved assets. When the brand kit updates, re-copy the changed files here.
Do **not** reference the external directory by absolute path — always consume through this package.

## Consumption

### CSS custom properties

```css
/* In your app's global CSS */
@import "@stackra/brand/tokens.css";

/* Now every token is available */
.my-button {
  background: var(--accent);
  color: var(--accent-foreground);
  border-radius: var(--radius);
  font: var(--body);
}
```

### TypeScript tokens

```ts
import { colors, typography, spacing } from "@stackra/brand";
// or: import { colors } from "@stackra/brand/tokens";

const accentLight = colors.accent.light; // "oklch(0.158 0.005 248)"
const bodyFont = typography.body.font; // "400 16px/1.6 ..."
```

### Logos (SVG files)

```ts
// Import the file directly (bundler-dependent)
import wordmarkLight from "@stackra/brand/logos/stackra-wordmark-light.svg";
import tileDark from "@stackra/brand/logos/st-tile-64-dark.svg";
```

### Fonts

```css
/* Reference the woff2 files in your @font-face declarations */
@font-face {
  font-family: "Geist";
  font-weight: 400;
  font-display: swap;
  src: url("@stackra/brand/fonts/Geist-Regular.woff2") format("woff2");
}
```

## Entry points

| Import                       | Holds                                                                       |
| ---------------------------- | --------------------------------------------------------------------------- |
| `@stackra/brand`             | All TS token exports (colors, typography, spacing, radius, shadows, motion) |
| `@stackra/brand/tokens`      | Direct import of the TS token module                                        |
| `@stackra/brand/tokens.css`  | CSS custom properties (light + dark)                                        |
| `@stackra/brand/tokens.json` | JSON token dump                                                             |
| `@stackra/brand/logos`       | SVG logo files                                                              |
| `@stackra/brand/fonts`       | woff2 font files + OFL licenses                                             |

`exports` point at source; `tsdown` builds `dist/` only for publishing.

## Tasks

| Task            | Command                                         |
| --------------- | ----------------------------------------------- |
| `build`         | `tsdown`                                        |
| `typecheck`     | `tsc --noEmit`                                  |
| `lint`          | `oxlint .`                                      |
| `test`          | `vitest run`                                    |
| `test:coverage` | `vitest run --coverage` (shared gate: 80/80/70) |
| `format`        | `oxfmt --write .`                               |
| `format:check`  | `oxfmt --check .`                               |
| `clean`         | `rm -rf dist coverage .turbo`                   |

Run one with `pnpm turbo run <task> --filter=@stackra/brand`.

## Structure

```text
src/
├── index.ts                     "." — re-exports only
├── tokens/
│   ├── tokens.css               CSS custom properties (light + dark)
│   ├── tokens.ts                TypeScript token constants
│   └── tokens.json              JSON token dump
├── logos/                       SVG logo files (wordmark, tile, endorsed)
├── fonts/                       woff2 font files + OFL licenses
└── __tests__/
    └── index.test.ts            tests through the public entry
```

Logic lives in sibling files, not in `index.ts`: the shared coverage gate ignores `src/**/index.ts`.
