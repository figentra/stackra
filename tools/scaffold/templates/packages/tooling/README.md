# @stackra/{{NAME}}-config

{{DESCRIPTION}}

**Kind:** tooling — a config preset. **Tier:** `tier:config` (`packages/tooling/{{NAME}}`); it depends on
nothing workspace-local except `@stackra/typescript-config` for its own test file.

## Presets

| Export         | File        | Use for                             |
| -------------- | ----------- | ----------------------------------- |
| `.` / `./base` | `base.json` | the baseline every consumer extends |

A new preset is a new file at the package root plus an `exports` entry; the test proves every target exists.
Consumers extend a preset and add no settings of their own — change the preset and ship a changeset.

## Tasks

| Task           | Command           |
| -------------- | ----------------- |
| `format`       | `oxfmt --write .` |
| `format:check` | `oxfmt --check .` |
| `lint`         | `oxlint .`        |
| `test`         | `vitest run`      |

Add `typecheck` (`tsc --noEmit`, plus `typescript` from `catalog:build`) only if the package ships `.ts` presets.

## Structure

```text
base.json                    the preset (a .jsonc preset carries a "Stackra file contract" header)
src/__tests__/presets.test.ts every exports target exists and parses
vitest.config.ts
```
