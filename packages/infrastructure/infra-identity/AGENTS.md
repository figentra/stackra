# AGENTS — @stackra/infra-identity

ZITADEL per environment (ADR 0171, ADR 0206). Member at `packages/infrastructure/infra-identity` (`tier:lib`). Entries
`.` (isomorphic, no Pulumi) and `./node` (the seed reader and the Pulumi slice).

## Where code goes

| You are writing…                            | It goes in…                                 |
| ------------------------------------------- | ------------------------------------------- |
| A zod schema (internal)                     | `src/core/constants/<name>.constant.ts`     |
| An enum                                     | `src/core/enums/<name>.enum.ts` (`Enum.of`) |
| An error                                    | `src/core/errors/<name>.error.ts`           |
| An isomorphic function (no Pulumi, no Node) | `src/core/functions/<name>.function.ts`     |
| A Node or Pulumi function                   | `src/node/functions/<name>.function.ts`     |
| A test                                      | `__tests__/<name>.<kind>.test.ts` beside it |

## Rules

- `.` stays bundle-safe: no `@pulumi/*`, `@pulumiverse/*` or `node:*` import.
- No client secret: every app is code with PKCE (ADR 0206 decision 8). A key or secret value never enters the seed,
  the plan, the stack's outputs or a test.
- Agents never run `pulumi` or call ZITADEL; the slice is tested under `runtime.setMocks`.
- Tenant organisations, their grants and branding, and the claims action are the identity service's, not this stack's.
- The health driver's target is `InfraIdentityConfig` (`src/config/infra-identity.config.ts`, key `infra_identity`), injected by type:
  the runway's `config.infra_identity` sets it. Never a constructor options object (gen's `token_not_a_class`).

## PII

The seed's dev users carry a name and an email address of a developer, for the local container only; no hosted
instance gets them. Otherwise none: organisation, project, role and app names, callbacks, colours and ids.
