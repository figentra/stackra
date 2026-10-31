---
"@stackra/repo-checks": minor
---

Add `checkAdrNumbers` and the `adr-numbers` rule in the config phase (STA-1732): when a repository keeps
`apps/docs/src/docs/adr/numbers.yaml`, every `NNNN-<slug>.mdx` ADR page must have its number registered there with the
same slug, and no number may be used twice.
