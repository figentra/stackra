<!-- Purpose: rules for agents in the turbo-cache folder of @stackra/infra-cloudflare. Boundary: folder guidance only. Runtime: docs. Governing contract: ADR 0026, ADR 0171. -->

# AGENTS — `src/node/turbo-cache/`

- Declare resources only; never run `pulumi` or call the Cloudflare API (package AGENTS.md).
- Reuse `r2Bucket` for the bucket and lifecycle; do not declare a second lifecycle shape here.
- Names, ids, the bucket, the expiry and the host are arguments from the stack config, never literals in the function.
- The cache token and the signature key are never inputs or outputs (Infisical `/ci`, Worker secret).
- Tests sit in `functions/__tests__/`, under `mockPulumi` from `#node/functions/__tests__/fixtures/pulumi-mocks.fixture`.
