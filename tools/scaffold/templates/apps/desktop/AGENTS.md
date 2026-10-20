# AGENTS — @figentra/{{NAME}}

{{DESCRIPTION}} Electron desktop app at `apps/{{NAME}}` (`tier:app`).

- The renderer never gets Node: `contextIsolation` and `sandbox` stay on, `nodeIntegration` off
  (`src/window-options.ts` and its test).
- Hardware and OS access live in the main process; expose them to the renderer through a narrow preload bridge only
  when a feature needs it.
- Signing identities, notarisation credentials and the update feed come from the release pipeline and Infisical;
  never put them in `electron-builder.yml`.
- Versions only via `catalog:desktop` and the other catalogs, or `workspace:*`.
- Tasks: `dev`, `start`, `build`, `package`, `typecheck`, `test`, `lint`, `format`, `format:check`, `clean`.

## PII

| Data  | Where | Handling |
| ----- | ----- | -------- |
| None. | —     | —        |
