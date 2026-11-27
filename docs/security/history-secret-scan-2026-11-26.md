<!-- Stackra file contract. Purpose: the full-history secret scan of every public ref of the core and template repositories on 2026-11-26, for a security reviewer: what was scanned, every finding by file, commit and ref (never by value), the review of each, and the owner steps. Boundary: a dated record; rerun with tools/scripts/secrets-history-scan.mjs and add a new dated file rather than editing this one. Runtime: docs. Governing contract: ADR 0009; ADR 0019; ADR 0267; STA-2878. -->

# Full-history secret scan: 26 November 2026

A public repository publishes every commit on every branch, tag and pull request, not only `main`. This report covers
all of them for [stackra-inc/stackra](https://github.com/stackra-inc/stackra) and
[stackra-inc/stackra-template](https://github.com/stackra-inc/stackra-template). Findings are named by file, line,
commit and the refs that carry them. No value appears here.

## Result

- **No live credential was found in either repository's history.**
- **Core:** no findings under the repository's policy, across 5,992 commits on 289 branches, 4,048 tags and 1,282 pull
  request refs. With gitleaks' default rules, no allowlist and inline `gitleaks:allow` comments ignored there are 25
  findings. All 25 are in test files or fixtures that hold deliberately fake or published test values, and each one is
  reviewed below. Ten of them are lines marked `gitleaks:allow` in the source, which a first run of this scan skipped;
  see [Lines marked gitleaks:allow](#lines-marked-gitleaksallow).
- **Template:** one finding under its policy. It is a false positive: a line of the console README's folder tree, on two
  `archive/preview-history*` tags only. Template pull request #57 adds its fingerprint to `.gitleaksignore`.
- **The `TURBO_TOKEN`-shaped string reported by the 26 November audit** (commits `6a316d655` and `4f1123d9c`) is a test
  canary, not a token. See [The audit's TURBO_TOKEN finding](#the-audits-turbo_token-finding).
- **No rotation is needed because of this scan.** The separate rotation of the tokens exposed outside git (STA-331) is
  still open, and this report does not change it.

## Method

| Item     | Value                                                                                                                                                                                                                                                                                                             |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | a fresh anonymous `git clone --mirror` of each public repository on 2026-11-26. A mirror holds every branch, every tag and GitHub's `refs/pull/*/head` and `refs/pull/*/merge`, which stay public after a branch is deleted.                                                                                      |
| Scanner  | gitleaks 8.30.1, the version `mise.toml` pins (ADR 0019, ADR 0027)                                                                                                                                                                                                                                                |
| Coverage | `--log-opts=--all`: every commit reachable from any ref, with full patches                                                                                                                                                                                                                                        |
| Passes   | 1. the repository's own policy (`.gitleaks.toml`, in core `.gitleaksignore`, and inline `gitleaks:allow` comments). 2. gitleaks' default rules with no allowlist, no ignore file and `--ignore-gitleaks-allow`, so allowlisted fixtures and lines marked `gitleaks:allow` on any ref are listed and reviewed too. |
| Values   | `--redact=100`, and the tool prints only file, line, commit, rule, entropy and refs. Before printing, it checks its output against every matched text and refuses if one is present.                                                                                                                              |
| Tool     | `tools/scripts/secrets-history-scan.mjs scan` (tests in `tools/scripts/__tests__/secrets-history-scan.test.mjs`)                                                                                                                                                                                                  |

To run it again:

```bash
git clone --mirror https://github.com/stackra-inc/stackra.git stackra.git
git clone --mirror https://github.com/stackra-inc/stackra-template.git stackra-template.git
git -C stackra-template.git show main:.gitleaks.toml > template-gitleaks.toml

node tools/scripts/secrets-history-scan.mjs scan --repo stackra.git --name stackra-inc/stackra \
  --config .gitleaks.toml --ignore .gitleaksignore --json scan-stackra.json
node tools/scripts/secrets-history-scan.mjs scan --repo stackra-template.git --name stackra-inc/stackra-template \
  --config template-gitleaks.toml --json scan-stackra-template.json
```

Add `--fail-on-findings` to exit 2 when the policy pass reports anything. "Looks like" is the tool's first sort:
`placeholder` means the matched value carries a placeholder word or too few distinct characters to be a key, and
`review` means a person must look. The review below settles every `review` row.

## Findings

### stackra-inc/stackra

Scanned 5992 commits reachable from 289 branches, 4048 tags and 1282 pull request refs with gitleaks 8.30.1.

- Findings under the repository's policy (`.gitleaks.toml`, `.gitleaksignore`): **0**
- Findings with gitleaks' default rules, no allowlist and no inline `gitleaks:allow`: **25**
- Findings that look like a credential and need a person to look: **23**

| File                                                                                            | Line | Commit         | Rule                | Policy      | Looks like  | On `main` | Branches                                                                                                                                                                                 | Tags                                                                                                    | Pull requests                                   |
| ----------------------------------------------------------------------------------------------- | ---- | -------------- | ------------------- | ----------- | ----------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `.agents/skills/playwright-best-practices/advanced/authentication-flows.md`                     | 54   | `36c34d337fce` | generic-api-key     | allowlisted | placeholder | no        | —                                                                                                                                                                                        | `archive/chore/generate-mcp-json`                                                                       | #3                                              |
| `.agents/skills/playwright-best-practices/advanced/authentication-flows.md`                     | 54   | `a8fb5ea8bbbd` | generic-api-key     | allowlisted | placeholder | yes       | `adr/0535-enterprise-sso-and-scim-per-tenant`, `bench/runner-dry-run`, `box/sta-2783-box-deploy`, `changeset-release/main`, `ci/design-system-tests`, `ci/flow-rendered-ci` and 283 more | `@figentra/console@0.0.1`, `@figentra/docs@0.0.1`, `@figentra/mobile@0.0.1` and 4024 more               | #7, #8, #9, #11, #13, #14 and 1156 more         |
| `packages/application/ai/src/core/functions/__tests__/resolve-page-context.function.test.ts`    | 19   | `ccc0b0ffbca4` | generic-api-key     | allowlisted | review      | yes       | `adr/0535-enterprise-sso-and-scim-per-tenant`, `bench/runner-dry-run`, `box/sta-2783-box-deploy`, `changeset-release/main`, `ci/design-system-tests`, `ci/flow-rendered-ci` and 279 more | `@stackra/access-log@0.11.1`, `@stackra/access-log@0.12.0`, `@stackra/access-log@0.14.0` and 3905 more  | #182, #183, #184, #185, #186, #187 and 983 more |
| `packages/commerce/fiscal/src/core/drivers/__tests__/__fixtures__/cades-test-units.json`        | 4    | `c6c1d21bc10a` | private-key         | allowlisted | review      | yes       | `adr/0535-enterprise-sso-and-scim-per-tenant`, `bench/runner-dry-run`, `box/sta-2783-box-deploy`, `changeset-release/main`, `ci/design-system-tests`, `ci/flow-rendered-ci` and 246 more | `@stackra/access-log@0.30.0`, `@stackra/access-log@0.32.0`, `@stackra/access-log@0.33.0` and 454 more   | #454, #842, #879, #880, #881, #882 and 260 more |
| `packages/commerce/fiscal/src/core/drivers/__tests__/__fixtures__/cades-test-units.json`        | 8    | `c6c1d21bc10a` | private-key         | allowlisted | review      | yes       | `adr/0535-enterprise-sso-and-scim-per-tenant`, `bench/runner-dry-run`, `box/sta-2783-box-deploy`, `changeset-release/main`, `ci/design-system-tests`, `ci/flow-rendered-ci` and 246 more | `@stackra/access-log@0.30.0`, `@stackra/access-log@0.32.0`, `@stackra/access-log@0.33.0` and 454 more   | #454, #842, #879, #880, #881, #882 and 260 more |
| `packages/commerce/fiscal/src/core/drivers/__tests__/__fixtures__/cades-test-units.json`        | 4    | `e06796d8edc7` | private-key         | allowlisted | review      | no        | —                                                                                                                                                                                        | —                                                                                                       | #905                                            |
| `packages/commerce/fiscal/src/core/drivers/__tests__/__fixtures__/cades-test-units.json`        | 8    | `e06796d8edc7` | private-key         | allowlisted | review      | no        | —                                                                                                                                                                                        | —                                                                                                       | #905                                            |
| `packages/commerce/fiscal/src/core/drivers/__tests__/__fixtures__/cades-test-units.ts`          | 14   | `681ca2efc11a` | private-key         | allowlisted | review      | no        | —                                                                                                                                                                                        | —                                                                                                       | #966                                            |
| `packages/commerce/fiscal/src/core/drivers/__tests__/__fixtures__/cades-test-units.ts`          | 20   | `681ca2efc11a` | private-key         | allowlisted | review      | no        | —                                                                                                                                                                                        | —                                                                                                       | #966                                            |
| `packages/commerce/fiscal/src/core/drivers/__tests__/__fixtures__/cades-test-units.ts`          | 14   | `89253a8c922a` | private-key         | allowlisted | review      | yes       | `adr/0535-enterprise-sso-and-scim-per-tenant`, `bench/runner-dry-run`, `box/sta-2783-box-deploy`, `changeset-release/main`, `ci/design-system-tests`, `ci/flow-rendered-ci` and 236 more | `@stackra/access-log@0.33.0`, `@stackra/access-log@0.33.1`, `@stackra/achievements@0.33.0` and 215 more | #454, #879, #880, #946, #956, #957 and 189 more |
| `packages/commerce/fiscal/src/core/drivers/__tests__/__fixtures__/cades-test-units.ts`          | 20   | `89253a8c922a` | private-key         | allowlisted | review      | yes       | `adr/0535-enterprise-sso-and-scim-per-tenant`, `bench/runner-dry-run`, `box/sta-2783-box-deploy`, `changeset-release/main`, `ci/design-system-tests`, `ci/flow-rendered-ci` and 236 more | `@stackra/access-log@0.33.0`, `@stackra/access-log@0.33.1`, `@stackra/achievements@0.33.0` and 215 more | #454, #879, #880, #946, #956, #957 and 189 more |
| `packages/communication/webhooks/src/core/functions/__tests__/sign-webhook.function.test.ts`    | 16   | `2787c1e6e84e` | generic-api-key     | allowlisted | review      | yes       | `adr/0535-enterprise-sso-and-scim-per-tenant`, `bench/runner-dry-run`, `box/sta-2783-box-deploy`, `changeset-release/main`, `ci/design-system-tests`, `ci/flow-rendered-ci` and 283 more | `@stackra/access-log@0.11.1`, `@stackra/access-log@0.12.0`, `@stackra/access-log@0.14.0` and 3911 more  | #179, #180, #181, #182, #183, #184 and 986 more |
| `packages/communication/webhooks/src/core/functions/__tests__/sign-webhook.function.test.ts`    | 16   | `c13553826e9d` | generic-api-key     | allowlisted | review      | no        | —                                                                                                                                                                                        | `archive/figentra/sta-348-framework`                                                                    | —                                               |
| `packages/communication/webhooks/src/core/functions/__tests__/verify-webhook.function.test.ts`  | 16   | `2787c1e6e84e` | generic-api-key     | allowlisted | review      | yes       | `adr/0535-enterprise-sso-and-scim-per-tenant`, `bench/runner-dry-run`, `box/sta-2783-box-deploy`, `changeset-release/main`, `ci/design-system-tests`, `ci/flow-rendered-ci` and 283 more | `@stackra/access-log@0.11.1`, `@stackra/access-log@0.12.0`, `@stackra/access-log@0.14.0` and 3911 more  | #179, #180, #181, #182, #183, #184 and 986 more |
| `packages/communication/webhooks/src/core/functions/__tests__/verify-webhook.function.test.ts`  | 16   | `c13553826e9d` | generic-api-key     | allowlisted | review      | no        | —                                                                                                                                                                                        | `archive/figentra/sta-348-framework`                                                                    | —                                               |
| `packages/communication/webhooks/src/core/services/__tests__/webhook-receiver.service.test.ts`  | 125  | `09823c1475f0` | generic-api-key     | allowlisted | review      | yes       | `adr/0535-enterprise-sso-and-scim-per-tenant`, `bench/runner-dry-run`, `box/sta-2783-box-deploy`, `changeset-release/main`, `ci/design-system-tests`, `ci/flow-rendered-ci` and 283 more | `@stackra/access-log@0.11.1`, `@stackra/access-log@0.12.0`, `@stackra/access-log@0.14.0` and 3910 more  | #179, #180, #181, #182, #183, #184 and 986 more |
| `packages/communication/webhooks/src/node/actions/__tests__/deliver-webhook.action.test.ts`     | 38   | `1a74064b0f8c` | generic-api-key     | allowlisted | review      | yes       | `adr/0535-enterprise-sso-and-scim-per-tenant`, `bench/runner-dry-run`, `box/sta-2783-box-deploy`, `changeset-release/main`, `ci/design-system-tests`, `ci/flow-rendered-ci` and 283 more | `@stackra/access-log@0.11.1`, `@stackra/access-log@0.12.0`, `@stackra/access-log@0.14.0` and 3910 more  | #179, #180, #181, #182, #183, #184 and 986 more |
| `packages/communication/webhooks/src/node/actions/__tests__/deliver-webhook.action.test.ts`     | 34   | `2787c1e6e84e` | generic-api-key     | allowlisted | review      | yes       | `adr/0535-enterprise-sso-and-scim-per-tenant`, `bench/runner-dry-run`, `box/sta-2783-box-deploy`, `changeset-release/main`, `ci/design-system-tests`, `ci/flow-rendered-ci` and 283 more | `@stackra/access-log@0.11.1`, `@stackra/access-log@0.12.0`, `@stackra/access-log@0.14.0` and 3911 more  | #179, #180, #181, #182, #183, #184 and 986 more |
| `packages/communication/webhooks/src/node/actions/__tests__/deliver-webhook.action.test.ts`     | 34   | `c13553826e9d` | generic-api-key     | allowlisted | review      | no        | —                                                                                                                                                                                        | `archive/figentra/sta-348-framework`                                                                    | —                                               |
| `packages/foundation/errors/src/core/functions/__tests__/sentry-envelope.function.test.ts`      | 87   | `2d5a8881da2e` | jwt                 | allowlisted | review      | yes       | `adr/0535-enterprise-sso-and-scim-per-tenant`, `bench/runner-dry-run`, `box/sta-2783-box-deploy`, `changeset-release/main`, `ci/design-system-tests`, `ci/flow-rendered-ci` and 282 more | `@stackra/access-log@0.11.1`, `@stackra/access-log@0.12.0`, `@stackra/access-log@0.14.0` and 3908 more  | #181, #182, #183, #184, #185, #186 and 984 more |
| `packages/foundation/errors/src/core/functions/__tests__/sentry-envelope.function.test.ts`      | 89   | `2d5a8881da2e` | stripe-access-token | allowlisted | review      | yes       | `adr/0535-enterprise-sso-and-scim-per-tenant`, `bench/runner-dry-run`, `box/sta-2783-box-deploy`, `changeset-release/main`, `ci/design-system-tests`, `ci/flow-rendered-ci` and 282 more | `@stackra/access-log@0.11.1`, `@stackra/access-log@0.12.0`, `@stackra/access-log@0.14.0` and 3908 more  | #181, #182, #183, #184, #185, #186 and 984 more |
| `packages/foundation/errors/src/core/functions/__tests__/sentry-envelope.function.test.ts`      | 93   | `2d5a8881da2e` | stripe-access-token | allowlisted | review      | yes       | `adr/0535-enterprise-sso-and-scim-per-tenant`, `bench/runner-dry-run`, `box/sta-2783-box-deploy`, `changeset-release/main`, `ci/design-system-tests`, `ci/flow-rendered-ci` and 282 more | `@stackra/access-log@0.11.1`, `@stackra/access-log@0.12.0`, `@stackra/access-log@0.14.0` and 3908 more  | #181, #182, #183, #184, #185, #186 and 984 more |
| `packages/security/licensing/src/core/functions/__tests__/verify-licence-file.function.test.ts` | 42   | `011dd4a0a5ac` | generic-api-key     | allowlisted | review      | no        | —                                                                                                                                                                                        | `archive/figentra/sta-348-framework`                                                                    | —                                               |
| `packages/security/licensing/src/core/functions/__tests__/verify-licence-file.function.test.ts` | 42   | `2787c1e6e84e` | generic-api-key     | allowlisted | review      | yes       | `adr/0535-enterprise-sso-and-scim-per-tenant`, `bench/runner-dry-run`, `box/sta-2783-box-deploy`, `changeset-release/main`, `ci/design-system-tests`, `ci/flow-rendered-ci` and 283 more | `@stackra/access-log@0.11.1`, `@stackra/access-log@0.12.0`, `@stackra/access-log@0.14.0` and 3911 more  | #179, #180, #181, #182, #183, #184 and 986 more |
| `tools/scripts/__tests__/create-smoke.test.mjs`                                                 | 34   | `e9dedc6d34b3` | jwt                 | allowlisted | review      | no        | `figentra/sta-2829-create-smoke`                                                                                                                                                         | —                                                                                                       | #1163                                           |

### stackra-inc/stackra-template

Scanned 305 commits reachable from 18 branches, 18 tags and 78 pull request refs with gitleaks 8.30.1.

- Findings under the repository's policy (`.gitleaks.toml`, `.gitleaksignore`): **1**
- Findings with gitleaks' default rules, no allowlist and no inline `gitleaks:allow`: **3**
- Findings that look like a credential and need a person to look: **3**

| File                                    | Line | Commit         | Rule            | Policy      | Looks like | On `main` | Branches                                                                                                                                                                                                                                  | Tags                                                                                                                                   | Pull requests                      |
| --------------------------------------- | ---- | -------------- | --------------- | ----------- | ---------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `apps/console/README.md`                | 23   | `aea7e2064ce2` | generic-api-key | reported    | review     | no        | —                                                                                                                                                                                                                                         | `archive/preview-history`, `archive/preview-history-snapshot`                                                                          | —                                  |
| `apps/web/src/config/consent.config.ts` | 25   | `aea7e2064ce2` | generic-api-key | allowlisted | review     | no        | —                                                                                                                                                                                                                                         | `archive/preview-history`, `archive/preview-history-snapshot`                                                                          | —                                  |
| `apps/web/src/config/consent.config.ts` | 25   | `d2ac7412cfee` | generic-api-key | allowlisted | review     | yes       | `docs/order-stats-example`, `figentra/sta-1570-template-ci-tests`, `figentra/sta-1583-template-privacy-retention`, `figentra/sta-1620-template-tenant-notes`, `figentra/sta-2112-turbo-host`, `figentra/sta-2202-template-ci` and 12 more | `archive/backup/2026-10-30/stackra-177`, `archive/backup/2026-10-30/tpl-analytics`, `archive/backup/main-before-pr12-sync` and 13 more | #1, #2, #3, #4, #5, #6 and 60 more |

## Review of each finding

### Core

| File                                                                                                                                                                     | Rule                     | Review                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.agents/skills/playwright-best-practices/advanced/authentication-flows.md`                                                                                              | generic-api-key          | A vendored skill's example code with a made-up token. The policy allowlists `.agents/skills/`.                                                                                                                                                                                                         |
| `packages/application/ai/.../resolve-page-context.function.test.ts` line 19                                                                                              | generic-api-key          | The id of a test record the caller cannot read. It was named `SECRET` until it was renamed on 2026-11-10 (STA-2665), so only this one commit matches. Owner-approved in `.gitleaksignore`.                                                                                                             |
| `packages/commerce/fiscal/.../__fixtures__/cades-test-units.{json,ts}`                                                                                                   | private-key              | Throwaway RSA 2048 and EC P-256 keys made for the CAdES signer tests. Both certificates are self-signed by `CN=TEST-ONLY-CA …, O=Stackra tests`, checked on 2026-11-26. They sign nothing outside the tests. The policy allowlists `__fixtures__`.                                                     |
| `packages/communication/webhooks/.../webhook-receiver.service.test.ts` line 125                                                                                          | generic-api-key          | The sealed gateway's AES-256 test key, the counting sequence `00112233…eeff`. Owner-approved in `.gitleaksignore`.                                                                                                                                                                                     |
| `packages/foundation/errors/.../sentry-envelope.function.test.ts` lines 87–93                                                                                            | jwt, stripe-access-token | A sample JWT and a Stripe-shaped string that the redaction test must mask. They are made up. Owner-approved in `.gitleaksignore`.                                                                                                                                                                      |
| `packages/communication/webhooks/.../sign-webhook.function.test.ts` line 16, `verify-webhook.function.test.ts` line 16, `deliver-webhook.action.test.ts` lines 34 and 38 | generic-api-key          | The `whsec_` secret of the Standard Webhooks specification's published test vector. Checked on 2026-11-26: with it, the message id, timestamp `1614265330` and body in the test produce the published `v1` signature, so it is the public vector and protects nothing. Marked `gitleaks:allow` inline. |
| `packages/security/licensing/.../verify-licence-file.function.test.ts` line 42                                                                                           | generic-api-key          | A made-up licence key of letters and digits. The test signs and verifies licence files with keys it makes at run time, so the string unlocks nothing. Marked `gitleaks:allow` inline.                                                                                                                  |
| `tools/scripts/__tests__/create-smoke.test.mjs` line 34                                                                                                                  | jwt                      | A JWS-shaped test string. Decoded on 2026-11-26: header `{"alg":"ES256"}`, payload `{"sub":"usr_01"}` and a signature segment that is plain text, not a signature. It is only on `figentra/sta-2829-create-smoke` (open pull request #1163). Marked `gitleaks:allow` inline.                           |

The webhook and licence rows also appear in commits `c13553826e9d` and `011dd4a0a5ac`, which only the
`archive/figentra/sta-348-framework` tag carries; they hold the same values.

Some fixture commits are carried only by pull request refs (#905 and #966). Those refs stay public after their branches
are deleted. Since none of these values is a credential, no action is needed.

### Template

| File                                            | Rule            | Review                                                                                                                                                                                                                |
| ----------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/console/README.md` line 23                | generic-api-key | A line of the folder tree that describes `runway.yaml`. Only the `archive/preview-history` and `archive/preview-history-snapshot` tags carry it. Template pull request #57 adds its fingerprint to `.gitleaksignore`. |
| `apps/web/src/config/consent.config.ts` line 25 | generic-api-key | A consent category's description key that points at a generated i18n message (`I18n.web.consent.*`). The template policy allowlists `I18n.*` references.                                                              |

### Lines marked gitleaks:allow

gitleaks skips any line that carries a `gitleaks:allow` comment, under every config. A token marked that way on an
unreviewed branch, tag or pull request ref would otherwise never be seen, so the raw pass runs with
`--ignore-gitleaks-allow` and the policy pass does not. The first run of this report on 26 November left the flag out
and listed 15 raw findings in core; the rerun with it lists 25. The ten added rows are the webhook, licence and
create-smoke rows above. The template has no line marked `gitleaks:allow` in its history, so its counts did not change.
The test `scan with the real gitleaks lists a credential marked gitleaks:allow on a pull request ref as allowlisted`
keeps the flag in place.

### The audit's TURBO_TOKEN finding

On 26 November the readiness audit reported "TURBO_TOKEN-shaped strings" in commits `6a316d655` and `4f1123d9c`. Both
commits change `tools/scripts/__tests__/__fixtures__/fake-deploy-host.mjs`, the fake box for the deploy service tests
(STA-2783). There, `TURBO_TOKEN` is a constant whose text calls itself a token value that must never leak, followed by a
number. The tests use it as a canary: they assert that it never reaches an argv, a log or the ledger. It is not a Turbo
token and opens nothing. gitleaks' default rules do not report it, and the fixture path is allowlisted, so the review
above was done by reading the file.

The commits are on `figentra/sta-2783-box-deploy` (open pull request #1081), `box/sta-2783-box-deploy` and
`save/wt-sta2783-2026-11-25`, and in `refs/pull/1081/*`. The same fixture also holds a Cloudflare account id and a KV
namespace id that match the ones in the Workers config on `main`. Those are identifiers, not credentials: they grant
nothing without a token. Removing internal identifiers from public files is part of the batch-23 clean-up, not of
this scan.

## Owner steps

These steps need the owner. No agent runs them.

1. **Turn on GitHub secret scanning and push protection** for `stackra-inc/stackra` and `stackra-inc/stackra-template`
   (Settings, then Code security). Push protection refuses a push that carries a known token shape before it becomes
   public. Today the only guards are the gitleaks pre-commit hook and `pnpm secrets:scan` in CI.
2. **Archive, then delete, the stale branches** listed in [the branch archive plan](branch-archive-plan-2026-11-26.md).
   Each branch is written to a verified git bundle before any deletion.
3. **Merge template pull request #57**, so that the template's own full-history scan is clean under its policy.
4. **Rerun this scan before each release**, and file the report as a new dated file next to this one.
