# AGENTS — @stackra/brand-kit

The brand generator Runway runs in CI (ADR 0441 decision 5): reads `<repo>/assets/brand/kit.json` and the kit's theme,
checks the kit, and writes tokens, HeroUI CSS, app and adaptive icons, splash screens, favicons with the web manifest
and store-screenshot frames into `.stackra/brand`. Member at `packages/design-system/brand-kit` (`tier:lib`).

## Where code goes

| You are writing…                                      | It goes in…                                                                                |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| A public type or enum (the kit, an output)            | `src/contracts/{types,enums}/`                                                             |
| Pure code: parsing, checks, planning, SVG composition | `src/core/functions/`, constants in `src/core/constants/`                                  |
| Anything that reads or writes files, fonts or rasters | `src/node/functions/`                                                                      |
| The command line                                      | `src/node/functions/run-brand-kit.function.ts`; `src/node/brand-kit.ts` is the binary only |
| A test                                                | `__tests__/<name>.<kind>.test.ts` beside its subject                                       |

## Rules

- **No brand here.** No colour value, family name, mark or endorsement rule in code: a kit names theme roles, and
  `@stackra/tokens` renders colours. A kit owner's own rules (a required endorsement mark) are `kit.json` data
  (`check.requiredMarks`). Never import `@figentra/*` (ADR 0441 enforcement).
- **Configuration, not code.** A new knob is a `kit.json` field with its default in `KIT_DEFAULTS` and its shape in
  `BRAND_KIT_SCHEMA`, both changed together, and a row in the README table.
- **Deterministic output.** No browser, no system font, no time or random value in an output: outline text with
  `outlineText`, rasterise with `rasterizeSvg`.
- **Generated files are never committed.** `generate` refuses an output folder inside the kit and never empties a
  folder without its `outputs.json`.
- Use `pathData` for opentype.js commands; never `Path#toPathData()` (opentype.js 2 flips Y).
- Entry barrels are stand-ins (`src/{core,contracts,node}/index.ts`) until gen writes them (STA-339); a new public file
  is added to its barrel and to `src/core/__tests__/index.test.ts` for `.`.

## Tasks

`pnpm turbo run <task> --filter=@stackra/brand-kit` — `build`, `typecheck`, `lint`, `test`, `test:coverage`,
`format`, `format:check`, `clean`.

## PII

| Data | Where | Handling                                                                                           |
| ---- | ----- | -------------------------------------------------------------------------------------------------- |
| None | —     | Kits hold brand sources only; store screenshots are captured with demo data (ADR 0441 decision 7). |
