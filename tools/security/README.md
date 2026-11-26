<!-- Purpose: what tools/security holds and how it is run. Boundary: tools/security only. Runtime: docs. Governing contract: ADR 0187 decision 3; STA-2821; apps/docs/src/docs/runbooks/security-testing.mdx. -->

# `tools/security/`

The data behind `pnpm security:sast` and `pnpm security:dast` (`tools/scripts/security-scan.mjs`). How to run them,
read a failure and accept a finding is the [Security testing](../../apps/docs/src/docs/runbooks/security-testing.mdx)
runbook.

| Path                                  | Holds                                                                                   |
| ------------------------------------- | --------------------------------------------------------------------------------------- |
| `semgrep/rules/<rule>.yml`            | one Stackra Semgrep rule per file (`stackra.<name>`)                                     |
| `semgrep/__tests__/__fixtures__/`     | one fixture per rule, same base name: `// ruleid:` lines must match, `// ok:` must not   |
| `semgrep/baseline.yaml`               | findings accepted when a rule landed, each with its reason and reviewing issue; written by `--update-baseline` |
| `zap/policy.tsv`                      | ZAP's rules file: which alert ids fail, warn, inform or are ignored                      |
| `zap/targets.yaml`                    | the deployed hosts a scan may reach; production ones are passive only                    |

## Rules

- A new rule comes with its fixture, and `pnpm security:sast --test` passes before it lands.
- A rule that finds existing code lands with those findings in the baseline, tied to the issue that fixes them; it
  never lands at a lower severity to stay quiet.
- A host joins `targets.yaml` only when it is Stackra's own; `active: true` only for a non-production host.
