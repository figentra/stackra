# @stackra/vite-plugin

The Stackra Vite preset. It serves the generated `#stackra/*` modules, wires gen's class-component pass into Vite,
and turns a member's `stackra.config.ts` plus the options gen writes into one Vite config.

**Tier:** `tier:lib` (`packages/developer/vite-plugin`). One entry, `.`, which runs in Node inside a Vite build.
Depends on `@stackra/gen` (the class-component pass), `@stackra/runway` (the dev server type), `@stackra/i18n` (the
locales of the pages), `@stackra/contracts`, and the framework plugins it wires: `@vitejs/plugin-react`,
`@tailwindcss/vite`, `@react-router/dev`, `@cloudflare/vite-plugin`, `vite-plugin-pwa` and `@sentry/vite-plugin`.
`vite` is a peer.

## What is here

| Symbol                             | Use                                                                              |
| ---------------------------------- | -------------------------------------------------------------------------------- |
| `stackra()`                        | the preset's own plugins, for a hand-written config: `plugins: [stackra()]`      |
| `stackra.viteConfig(app, options)` | a member's whole Vite config; what the generated `.stackra/vite.config.ts` calls |
| `ViteConfigOptions`                | the type of `options`                                                            |

You never write a Vite config in a member: gen writes `.stackra/vite.config.ts` (ADR 0295) and the gitignored
`vite.config.ts` at the member root re-exports it.

```ts
import { defineConfig } from "vite";
import { classComponents } from "@stackra/gen/node";
import { definesFor, devServer } from "@stackra/runway/node";
import { stackra } from "@stackra/vite-plugin";
import app from "../stackra.config";

export default defineConfig(({ mode }) =>
  stackra.viteConfig(app, {
    mode, // web | pwa | desktop
    plugins: [classComponents()],
    entry: ".stackra/entry/browser.ts",
    server: devServer("console"),
    define: definesFor("console", process.env.STACKRA_ENVIRONMENT ?? "dev"),
    budgets: { entryKb: 200, routeKb: 100 },
  }),
);
```

## The preset's plugins

`stackra()` returns, in order:

1. **`stackra:class-components`**: gen's pass (`classComponents()` from `@stackra/gen/node`), so React, React Router
   and Fast Refresh see function components. It is added only when the config does not already list it, so it runs
   once. This package wires the pass; gen ships it.
2. **`stackra:generated-modules`**: `#stackra/<name>` resolves to `.stackra/gen/<name>.ts` (or `.tsx`, or
   `<name>/index.ts`), the same real file Metro, Node, tests and agents read (ADR 0261). Vite watches it, so
   `stackra gen --watch` hot-updates the app. A module gen has not written fails with "run `stackra gen`".
3. **`stackra:server-only`**: a `.server` import in the browser bundle fails the build.

## What `viteConfig` adds

| Option             | Effect                                                                                                                                       |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `mode`, `target`   | the target: `target`, else the mode when it is a target code, else the app's first target; a target the app does not declare fails           |
| `render`           | `server`: Cloudflare Workers for `ssr` (over `.stackra/wrangler.jsonc`) and React Router framework mode; otherwise React. Tailwind v4 always |
| `plugins`          | run first                                                                                                                                    |
| `pages`            | one HTML page per locale: served under its prefix in dev, written to `<prefix>index.html` in the build                                       |
| `entry`            | the build input when there are no pages                                                                                                      |
| `server`, `define` | from `devServer` and `definesFor` (`@stackra/runway/node`)                                                                                   |
| `prerender`        | the entry is built for the browser and imported in Node; its `render(url, assets)` writes each route's document                              |
| `pwa`              | PWA target only: gen's `sw.ts` built with `injectManifest`; the per-locale manifests served and emitted at the root                          |
| `desktop`          | desktop target only: the relative base and the renderer output folder                                                                        |
| `budgets`          | a client chunk over its gzipped budget fails the build                                                                                       |
| `build`            | Vite's build block, under the preset's input and output folder                                                                               |
| `sourcemaps`       | hidden maps uploaded to the runway's Sentry project, then deleted; the token is the release job's                                            |
| `buildTime`        | defines `__BUILD_TIME__`                                                                                                                     |

### The prerender entry

The entry named by `prerender.entry` is gen's. It is built into the client bundle (it hydrates the document) and
imported in Node through a Vite module runner, so its browser-only code must not run at import time. It exports:

```ts
export function render(
  url: string,
  assets: { script: string; styles: string[] },
): string | Promise<string>;
```

`assets` names the entry's own chunk and stylesheets from the same build, relative to each document under a relative
base.

## Secrets

None. The Sentry upload token and organisation are read by the Sentry plugin from the release job's environment;
nothing in this package reads or passes a secret.
