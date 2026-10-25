# AGENTS — @stackra/infra-aws-runtime

The AWS runtime resources members declare in runway (ADR 0296, 0171), as a Pulumi program part. Member at
`packages/infrastructure/infra-aws-runtime` (`tier:lib`). Entries `.` (the pure plan) and `./node` (the runway reader
and `awsRuntime`).

## Where code goes

| You are writing…                       | It goes in…                                 |
| -------------------------------------- | ------------------------------------------- |
| A plan rule (pure, no Pulumi, no Node) | `src/core/functions/<name>.function.ts`     |
| A plan type                            | `src/core/types/<name>.type.ts`             |
| Data (node sizes)                      | `src/core/constants/<name>.constant.ts`     |
| Pulumi resources or a file reader      | `src/node/functions/<name>.function.ts`     |
| A test                                 | `__tests__/<name>.<kind>.test.ts` beside it |

## Rules

- Every size and name comes from a runway; a new knob is a runway field first (the canonical
  `tools/schemas/runway-*.schema.json` and `@stackra/runway`), then a plan field here.
- `.` never imports `@pulumi/*` or `node:*`; the plan is plain data a test compares.
- Test Pulumi code under `pulumi.runtime.setMocks` only. Never run `pulumi up`, `pulumi destroy` or a preview
  against a real account, and never call a cloud API.
- No secret is created or read here (ADR 0173). Encryption at rest and in transit stays on for every resource.

## PII

None. The plan holds resource names, sizes and tags; no person's data and no secret value.
