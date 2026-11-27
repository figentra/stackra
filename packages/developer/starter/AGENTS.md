# AGENTS — @stackra/starter

The starter `stackra create` fetches: the stackra-template at the commit `package.json` `stackra.template.commit`
pins, packed as `dist/template.tgz`, released in the `@stackra/*` fixed group (STA-2874, ADR 0515 decision 3).

- Owner: release-operations.
- The pin is a full 40-character commit id. Move it with `pnpm --filter @stackra/starter template:bump`, in a pull
  request with a changeset; never hand-edit it to a branch or tag.
- `dist/template.tgz` is built, never committed. The build fetches only the pinned commit and refuses symlinks,
  submodules, a commit without `stackra.starter.yaml` and an archive missing a tracked file.
- The CLI reads the archive through `starterTarball` (`packages/developer/cli/src/node/create/functions/`); a change
  to the archive's path or layout changes both, in one pull request.
- Before `latest` moves, the release runs `tools/scripts/consumer-smoke.mjs` (`stackra create` from the registry as
  a clean consumer). A red smoke means the starter or the packages break a new app: fix the cause and release again.
- Secrets: forbidden. The template is public; the build needs no token.

## Tasks

`pnpm turbo run <task> --filter=@stackra/starter`: `build`, `test`, `lint`, `format:check`.

## PII

| Data | Where | Handling                                                               |
| ---- | ----- | ---------------------------------------------------------------------- |
| None | —     | Template source files; no personal data is read, packed or published. |
