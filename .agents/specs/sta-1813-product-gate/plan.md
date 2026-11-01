# Implementation Plan: a product gate on every core train

**Spec**: `spec.md` · **Linear**: STA-1813 · **Branch**: `figentra/sta-1813-product-gate`

This Mac runs only oxfmt and oxlint. The runner and its test run on a testbed box through the testing session
(stackra-8a); nothing here pushes, deploys or touches a cloud resource.

## Constitution Check

| Law                       | Result | Note                                                                                   |
| ------------------------- | ------ | -------------------------------------------------------------------------------------- |
| Boundaries (ADR 0003)     | PASS   | a script under `tools/scripts`; it imports no package and no product source            |
| Tenancy                   | N/A    | no tenant data; product tests use their own Postgres                                   |
| Secrets (ADR 0173)        | PASS   | none in files or argv; names only (`STACKRA_BOT_APP_ID`, `INFISICAL_GATE_IDENTITY_ID`) |
| Security                  | PASS   | no network in the script; a workflow (step 4) is SHA-pinned, least permissions (0166)  |
| Not built yet (ADR 0227)  | PASS   | no new technology; `yaml` is already a catalog dependency                              |
| Test placement (ADR 0022) | PASS   | `tools/scripts/__tests__/product-gate.test.mjs`                                        |
| Versions and catalogs     | PASS   | no catalog change; the script reads the product's catalog but never edits one in core  |

## Deploy modes

| Mode       | Result | Note                             |
| ---------- | ------ | -------------------------------- |
| saas       | N/A    | internal CI tooling, not shipped |
| on-prem    | N/A    | internal CI tooling, not shipped |
| air-gapped | N/A    | internal CI tooling, not shipped |

## Build order

| Step | What                                                                                                           | Gate                               |
| ---- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 1    | Spec, plan, `product-gate.mjs`, matrix, empty allow-list, test (this change)                                   | `pnpm validate` on a box           |
| 2    | Dry run on a box: `--dry-run` for each product, then one real run (billing) against `land/031-stack`           | summary reviewed by the leader     |
| 3    | Testbed wrapper: `stackra testbed run "<session> product-gate <product>" <dir> "<command>"` per product, below | one matrix run, all three products |
| 4    | `.github/workflows/product-gate.yml` (manual dispatch, sketch below), posting the `product-gate` commit status | **leader review** (R2, CI policy)  |
| 5    | Runbook section in `release.mdx`; the status becomes a required check on the version PR and the train PR       | **owner**: branch protection       |
| 6    | A prerelease run after the version PR merges, against the published `next` version (open question 3)           | later; separate issue              |

## Design notes

- **The overlay is what gate.sh did**, no more. Copy the product (without `node_modules`, `.git`, `.stackra`, `.turbo`);
  delete `pnpm-lock.yaml`; rewrite every `@stackra/*` catalog entry in `pnpm-workspace.yaml` to `link:<core>/packages/...`
  and add the same rows under `overrides:` (an override also covers a transitive `@stackra/*` dependency); copy overlay
  manifests for services the product lacks; `git init` and commit, because turbo hashes through git.
- **Lockfile strategy.** The scratch copy installs with `--no-frozen-lockfile` from the registry, core linked. The
  product's own committed lockfile (and its `--frozen-lockfile` and supply-chain check) is the product's gate, not ours,
  and is never rewritten. `--config.trust-policy=off` and `--config.strict-dep-builds=false` are the flags the hand-run
  gates used because a linked core has no registry provenance; the products carry their own `allowBuilds`.
- **Pins.** `product-gate.matrix.yaml` pins a SHA per product. The seed SHAs are the tips the 2026-11-01 hand-run gates
  ended on (billing `c605e78`, pay `ae59928`, invoicing `3c00e82`), since billing and invoicing hold nothing on their
  `main` yet. A pin moves by a reviewed pull request, normally the testing session's, when the product merges. The
  runner refuses a checkout that is not at the pin.
- **Allow-list.** `product-gate.allow.yaml` starts empty. One entry per known product-side or tracked failure:
  `product`, `step` (`typecheck`, or `test:int/billing`), `match` (a substring of the failure line, such as
  `TS2589` or `recorded []`), `issue` (STA-n), `added`, `expires` (at most 30 days later), `reason`. A step is excused
  only if every failure line it printed is covered, so a new failure in an excused step still turns it RED. An expired
  entry stops excusing at midnight and the summary names its issue. Core-side findings are not allow-listed: they fix
  the train.
- **Pass criteria.** Per product GREEN: install, gen for every service, typecheck, test and test:int pass or are
  excused; validate likewise. The train passes when every product is GREEN. A product that cannot install or gen
  is RED, never skipped.
- **Budget.** Install of a linked product is the long step (cold store, about 8 minutes), then gen, typecheck and test
  per service. The matrix runs one box per product in parallel; 90 minutes is the per-product timeout, passed as
  `timeout 90m` in the wrapper, well inside the testbed's 3 hours.
- **Where results go.** `--out` holds `summary-<product>.json` and `.md` and the step logs; the wrapper uploads them as
  the workflow artifact and posts the commit status from the exit codes. Logs may contain test output but no secret:
  tokens reach a step only through Infisical in the box job and are never printed (ADR 0484).

## Testbed invocation (step 3)

The caller clones; the script does not. Product read access is the `stackra-bot` token minted from
`STACKRA_BOT_APP_ID` and `STACKRA_BOT_PRIVATE_KEY` (as `runway-npm.yml`), used only for the clone, never written to a
file or argv of the script.

```sh
stackra testbed run "stackra-8a product-gate billing" "$PWD" \
  "timeout 90m node tools/scripts/product-gate.mjs --core . --checkout ../billing --product billing \
   --overlays ../overlays --out ../gate-out"
```

## Workflow sketch (step 4, for review, not committed)

Manual only, never a pull_request trigger, the fallback for when no testbed box is healthy and the place the status
is posted. Action SHAs are the ones already in `release.yml` and `runway-npm.yml`.

```yaml
name: Product gate
on:
  workflow_dispatch:
    inputs:
      ref:
        description: The train ref to gate (for example land/031-stack)
        type: string
        required: true
concurrency:
  group: product-gate-${{ inputs.ref }}
  cancel-in-progress: false
permissions: {}
jobs:
  gate:
    name: Product gate (${{ matrix.product }})
    runs-on: ubuntu-latest
    timeout-minutes: 90
    permissions:
      contents: read
      id-token: write # Infisical OIDC for the licence tokens only
      statuses: write # the product-gate commit status
    strategy:
      fail-fast: false
      matrix:
        product: [billing, pay, invoicing]
    steps:
      - name: Checkout core at the train ref
        uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4.4.0
        with:
          ref: ${{ inputs.ref }}
          persist-credentials: false
          submodules: false
      - name: Toolchain (mise)
        uses: jdx/mise-action@9b200bcecbfd6303e69a4a261b2e09e3757440a7 # v5.2.0
        with:
          install_args: node pnpm
      - name: Product read token (stackra-bot app)
        id: bot
        uses: actions/create-github-app-token@64ab729a6294000f5aa4a4bc0b73d1f32bc45510 # v3.3.0
        with:
          app-id: ${{ secrets.STACKRA_BOT_APP_ID }}
          private-key: ${{ secrets.STACKRA_BOT_PRIVATE_KEY }}
          owner: figentra
          repositories: ${{ matrix.product }}
          permission-contents: read
      - name: Checkout the pinned product
        uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4.4.0
        with:
          repository: figentra/${{ matrix.product }}
          ref: ${{ steps.pin.outputs.sha }} # read from the matrix by a small earlier step
          token: ${{ steps.bot.outputs.token }}
          path: product
          persist-credentials: false
      - name: Licence tokens (Infisical OIDC)
        uses: Infisical/secrets-action@d2e351f16c6ca20d17c85e6c992e04bdeb64e87d # v1.0.18
        with:
          method: oidc
          identity-id: ${{ vars.INFISICAL_GATE_IDENTITY_ID }}
          domain: https://eu.infisical.com
          project-id: ${{ vars.INFISICAL_GATE_PROJECT_ID }}
          env-slug: prod
          secret-path: /ci
          export-type: env
      - name: Gate
        env:
          PRODUCT: ${{ matrix.product }}
        run: node tools/scripts/product-gate.mjs --core . --checkout product --product "$PRODUCT" --out gate-out
      - name: Upload summaries
        if: always()
        uses: actions/upload-artifact@<pin at review>
        with:
          name: product-gate-${{ matrix.product }}
          path: gate-out/summary-*
```

Open for review: the `pin` step, the exact Infisical project variable, the `<pin>` of `upload-artifact`, and the final job
that aggregates the three results into one `product-gate` status.

## Properties

- **P-001**: The matrix parses, every product has a repo, a SHA ref and services, and a bad shape is refused with the product's name — Validates: FR-001
- **P-002**: `linkWorkspace` rewrites every core-named catalog entry and adds each core package to `overrides:`, leaving other rows byte for byte; the run leaves the checkout and core trees unchanged — Validates: FR-002
- **P-003**: The step plan has the fixed order, skips `test:int` and `validate` when the product lacks the script, and a failed install skips the rest — Validates: FR-003
- **P-004**: A run's verdict and exit code follow the step statuses: all pass or excused is 0, any failure is 1, a setup error is 2 — Validates: FR-004, FR-007
- **P-005**: An entry excuses a step only when every failure line matches a live entry of that product and step; an expired entry excuses nothing and is named; an entry over 30 days or without an STA key is refused — Validates: FR-005
- **P-006**: A run writes `summary-<product>.json` and `.md` with both SHAs and one log per step — Validates: FR-006
- **P-007**: The workflow runs only by dispatch, posts one status, and holds no secret value — Validates: FR-008
- **P-008**: Branch protection names `product-gate` for the version PR and the train PR — Validates: FR-009
