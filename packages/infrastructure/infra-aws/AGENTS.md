# AGENTS — @stackra/infra-aws

The free AWS foundation as Pulumi TypeScript (ADR 0171). Member at `packages/infrastructure/infra-aws` (`tier:lib`).
Entries `.` (isomorphic config readers), `./node` (the Pulumi programs) and `./testing` (Pulumi's mocks).

## Where code goes

| You are writing…                   | It goes in…                                          |
| ---------------------------------- | ---------------------------------------------------- |
| A runway reader (no Pulumi import) | `src/core/functions/<name>.function.ts`              |
| A schema or fixed value            | `src/core/constants/<name>.constant.ts`              |
| A Pulumi program or building block | `src/node/functions/<name>.function.ts`              |
| A test helper for consumers        | `src/testing/functions/<name>.function.ts`           |
| A test                             | `__tests__/<name>.<kind>.test.ts` beside its subject |

## Rules

- Never run `pulumi up`, `pulumi destroy`, `stackra infra up` or any AWS call. Tests use `mockPulumi`; a real check is
  `stackra infra preview`, which the owner reviews.
- `.` stays free of `@pulumi/*`; gen derives the config without loading Pulumi.
- A program is a function that groups its resources under one `pulumi.ComponentResource` and builds its own provider
  pinned to one account. Write policy JSON with `policyOf`; call no AWS data source, so the mocks see every input.
- A role another stack trusts gets a fixed name (`roleName`), and other policies name it in an `aws:PrincipalArn`
  condition, never as a principal, so the policy is valid before the role exists.
- No account id, amount or external id in code: they arrive as runway values or `ref:` paths and are resolved from the
  stack config. No secret value is read anywhere.
- An egress Elastic IP is `retainOnDelete`: a partner allow-lists it, so a stack change never releases it. Allocate
  the addresses here; attaching them to NAT gateways is the network's job.
- The health driver's target is `InfraAwsConfig` (`src/config/infra-aws.config.ts`, key `infra_aws`), injected by type:
  the runway's `config.infra_aws` sets it. Never a constructor options object (gen's `token_not_a_class`).
- Backups are kept 35 days or less, or the runway states `cryptoShredded: true` (ADR 0188 decision 3); the runway
  schema refuses anything else. Never raise the ceiling in code.
- Each backup vault notifies a topic of its own account of failed jobs only (`backupAlerts`); AWS Backup cannot notify
  across accounts. The backup vault is locked in governance mode; never turn on compliance mode (`changeableForDays`)
  in code or a fixture runway: it is the owner's irreversible decision, set only in the root runway.

## PII

None. The programs hold account ids, resource names and policy documents; no person's data, and no address for
alerts (the budget and backup alert topics are subscribed elsewhere).
