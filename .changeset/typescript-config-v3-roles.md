---
"@stackra/typescript-config": minor
---

The `library` preset sets the DOM library and `jsx: react-jsx`, so a package's `src/react/` and `src/native/` entries
typecheck. New role presets for programming model v3: `mobile` (expo plus decorators and `.stackra/`), `service`
(decorators plus the gen files), `tooling` (the `vite-node` program), and the gen-written `desktop` (Electron main and
preload) and `service-worker` (WebWorker lib) programs.
