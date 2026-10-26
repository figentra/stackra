# AGENTS — @stackra/infra-observability

Telemetry infrastructure (ADR 0171 decision 2, ADR 0184). Member at `packages/infrastructure/infra-observability`
(`tier:lib`). Entries `.` (isomorphic: the plan from the runways) and `./node` (the Pulumi programs).

## Where code goes

| You are writing…                         | It goes in…                                 |
| ---------------------------------------- | ------------------------------------------- |
| The `observability` zod schema           | `src/core/constants/<name>.constant.ts`     |
| An enum                                  | `src/core/enums/<name>.enum.ts` (`Enum.of`) |
| An error                                 | `src/core/errors/<name>.error.ts`           |
| A pure function over the runways         | `src/core/functions/<name>.function.ts`     |
| A shared type                            | `src/core/types/<name>.type.ts`             |
| Code that runs inside the Pulumi program | `src/node/functions/<name>.function.ts`     |
| A test                                   | `__tests__/<name>.<kind>.test.ts` beside it |

## Rules

- `.` never imports `@pulumi/*`, a provider SDK or `node:*`: `stackra infra gen` builds the plan outside a Pulumi
  program.
- Read runway documents through `@stackra/runway` (`parseRunway`, `readRunway`); never parse YAML here.
- Never run `pulumi up`, `pulumi destroy` or anything that calls Sentry, Better Stack or AWS. Tests use
  `runtime.setMocks` from `@pulumi/pulumi` (`src/node/functions/__tests__/fixtures/pulumi-mocks.fixture.ts`).
- A secret is an output wrapped in `pulumi.secret` (the OTLP token, the heartbeat URLs) or one the provider marks
  (the archive key); never a literal, a file or a log line (ADR 0173).
- Telemetry carries no personal data (ADR 0184 decision 5); nothing here adds a field that could hold one.
- Annotate every export whose inferred type would reach an unexported or deep-path type (`ExtensionBase`, `ActionBase`,
  `PassBase`, a provider's `bin/` class, `@types/react`'s `Element`): the declaration build fails with TS2883 (STA-1220).

## PII

None. The plan holds project, member and job names, slugs and retention numbers; the outputs hold endpoints, ids and
secret tokens, never a person's data.
