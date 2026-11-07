---
"@stackra/infra-aws-runtime": patch
"@stackra/infra-tools": patch
"@stackra/infra-github": patch
"@stackra/infra-cloudflare": patch
"@stackra/infra-identity": patch
"@stackra/infra-observability": patch
"@stackra/runway": patch
"@stackra/mcp": patch
"@stackra/cli": patch
"@stackra/fiscal": patch
"@stackra/licensing": patch
---

The infrastructure and developer packages describe sops and figentra/secrets instead of Infisical (ADR 0525).

- `@stackra/infra-aws-runtime`: the RDS Proxy login secret's description names the vault, not Infisical, so the next
  apply updates that description in place. The docs name the vault and runway's secrets sync.
- `@stackra/infra-tools`: the tools-stack secrets sync is the vault's (`secretsSync` keeps its shape: `source`,
  `principal`, `externalId`); the missing external id error names the secrets sync.
- `@stackra/infra-github`, `@stackra/infra-cloudflare`, `@stackra/infra-identity`, `@stackra/infra-observability`,
  `@stackra/runway`, `@stackra/mcp`, `@stackra/cli`, `@stackra/fiscal`, `@stackra/licensing`: docs and comments only.
  `githubPlan` still turns `providers.infisical` into the `INFISICAL_*` CI variables until plan phase P6.
