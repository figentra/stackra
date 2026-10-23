# Service templates

`service/` renders a workspace member at `services/{{NAME}}` (`@figentra/service-{{NAME}}`, `tier:service`) in the
programming model v3 shape (ADR 0294 rule R12, ADR 0295): plain TypeScript, no Encore file (ADR 0124), no authored
`main.ts`. `stackra gen` finds the root module by name, writes the entry and generates the Encore app into
`.stackra/encore` (ADRs 0091, 0295).

A new service is a skeleton: `stackra.config.ts` (static data), `runway.yaml` (runway v3, ADR 0296), the root module
`src/{{NAME}}.module.ts` with an empty `imports` list, `src/config/{{NAME}}.config.ts`, an empty `src/modules/` whose
README lists the group folders, `src/contracts/` (exported with its first file), and tests that load the root module
and the config. No `stackra.manifest.json` is written: gen writes it on its first run (ADR 0294 rule R10).
