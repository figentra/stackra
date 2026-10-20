# @figentra/{{NAME}}

{{DESCRIPTION}}

An Electron desktop app (MR7): the main process in TypeScript, built by tsdown, packaged by electron-builder
(`electron-builder.yml`). Hardware access lives in the main process; the renderer is sandboxed.

Before the first `pnpm install`, add `electron: true` to `allowBuilds` in `pnpm-workspace.yaml` (its postinstall
downloads the Electron binary) and have the dependency steward review it.

| Command          | Does                                                 |
| ---------------- | ---------------------------------------------------- |
| `pnpm dev`       | Build the main process and start Electron            |
| `pnpm build`     | `tsdown` → `dist/main.mjs`                           |
| `pnpm package`   | Build, then package installers into `release/`       |
| `pnpm typecheck` | `tsc --noEmit`                                       |
| `pnpm test`      | Vitest                                               |

## Structure

```text
electron-builder.yml     packaging (signing and the update feed come from the release pipeline)
src/
├── main.ts              main process: window lifecycle
├── window-options.ts    the locked-down window options
├── renderer/index.html  the renderer page
└── __tests__/
```
