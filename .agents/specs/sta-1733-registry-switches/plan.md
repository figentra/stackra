# Implementation Plan: registry switches for the Figentra Registry move

**Spec**: `spec.md` · **Linear**: STA-1733 · **Branch**: `figentra/sta-1733-registry-switches` · **Full plan**:
figentra/figentra `.agents/specs/sta-1733-figentra-registry/plan.md`

| Step | What                                                                                        | Gate                    |
| ---- | ------------------------------------------------------------------------------------------- | ----------------------- |
| 1    | `readSettings`: `oidcAudiences` and `readOnly`; `exchangeToken` checks the list             | registry tests via f4   |
| 2    | The router answers 503 `registry_read_only` to every non-read while `readOnly`              | registry tests via f4   |
| 3    | The browse footer reads the host; `wrangler.jsonc` vars and the signing key comment; README | format, validate via f4 |
| 4    | Deploy to `stackra-registry` with both switches off (the owner's "Deploy registry" run)     | **owner**               |
