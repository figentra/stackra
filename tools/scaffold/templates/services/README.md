# Service templates

`service/` renders a workspace member at `services/{{NAME}}` (`@figentra/service-{{NAME}}`, `tier:service`): plain
TypeScript, no Encore file (ADR 0124). `stackra gen` reads `package.json` `stackra.module` and generates the Encore
app into `.stackra/encore` (ADRs 0090, 0091).

A new service is a skeleton: the root module with an empty `imports` list, an empty `src/modules/` whose README
lists the kind folders, a types-only `src/contracts/` entry, `config/{{NAME}}.config.ts`, and a test that boots
the root module. Shape decided in ADR 0126.
