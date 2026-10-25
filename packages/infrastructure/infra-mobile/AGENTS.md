# AGENTS — @stackra/infra-mobile

Mobile release infrastructure (ADR 0171 decision 2). Member at `packages/infrastructure/infra-mobile` (`tier:lib`).
Entries `.` (isomorphic: the plan from the runways) and `./node` (the Pulumi slice).

## Where code goes

| You are writing…                         | It goes in…                                 |
| ---------------------------------------- | ------------------------------------------- |
| An enum                                  | `src/core/enums/<name>.enum.ts` (`Enum.of`) |
| An error                                 | `src/core/errors/<name>.error.ts`           |
| A pure function over the runways         | `src/core/functions/<name>.function.ts`     |
| A shared type                            | `src/core/types/<name>.type.ts`             |
| Code that runs inside the Pulumi program | `src/node/functions/<name>.function.ts`     |
| A test                                   | `__tests__/<name>.<kind>.test.ts` beside it |

## Rules

- `.` never imports `@pulumi/pulumi` or `node:*`: `stackra infra gen` builds the plan outside a Pulumi program.
- Read runway documents through `@stackra/runway` (`parseRunway`, `readRunway`); never parse YAML here.
- Never run `pulumi up`, `pulumi destroy` or anything that calls EAS, App Store Connect, Play or Firebase. Tests use
  `runtime.setMocks` and `runtime.setAllConfig` from `@pulumi/pulumi`.
- A fact is an id, never a secret value (ADR 0173). Signing certificates and push keys live in EAS
  (`targets.eas.credentials: eas-managed`); nothing here reads or writes them.
- A step no API takes is a `MobileOwnerStep`, not code that pretends to do it (ADR 0344 decision 11).

## PII

None. The plan holds account, app and store ids, channel names and bundle ids; never a secret value or a person's
data.
