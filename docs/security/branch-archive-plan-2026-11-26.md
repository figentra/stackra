<!-- Stackra file contract. Purpose: the stale-branch archive plan for the core and template repositories on 2026-11-26: which branches are merged or snapshots, and the bundle-per-branch commands the owner runs to archive and then delete them. Boundary: a dated plan; no agent deletes a branch or turns on push protection (owner steps). Regenerate the list with tools/scripts/secrets-history-scan.mjs before running it. Runtime: docs. Governing contract: STA-2878; ADR 0009. -->

# Branch archive plan: 26 November 2026

Core has 289 public branches and the template has 18. Most are finished, merged or snapshot branches. Every branch
publishes its whole history, so a smaller set of branches is easier to review and keep clean. This plan names the
branches that can go and how to keep a verified copy of each one first. **No agent deletes a branch.** The owner runs
the steps below.

## What goes on the list

`tools/scripts/secrets-history-scan.mjs branches` sorts each branch into the first class that fits:

| Class           | Evidence                                                                                                    | On the list           |
| --------------- | ----------------------------------------------------------------------------------------------------------- | --------------------- |
| merged          | the branch tip is in `main`                                                                                 | yes                   |
| content in base | merging the branch into `main` changes nothing (a squash merge)                                             | yes                   |
| PR merged       | the branch tip is exactly the head that GitHub merged (a squash merge whose files `main` has changed since) | yes                   |
| snapshot        | a `save/*` or `wt-*` name: a saved worktree                                                                 | yes                   |
| PR closed       | the tip is the head of a pull request that was closed without a merge                                       | no, the owner decides |
| PR open         | the tip is the head of an open pull request                                                                 | no                    |
| open            | anything else: work that is not merged                                                                      | no                    |

`main`, `development`, `staging`, `production`, `encore` and the verify lanes' `stackra/l<n>/verify` branches are
never listed.

## How to run it

On any machine with git and Node 24 and enough disk space (the 37 core bundles take about 2.2 GB, because each bundle
holds the full history and restores without `main`):

```bash
git clone --mirror https://github.com/stackra-inc/stackra.git stackra.git
gh pr list -R stackra-inc/stackra --state all --limit 3000 --json number,state,headRefName,headRefOid > prs.json

# 1. regenerate the list: branches move, so never reuse the list below as is
node tools/scripts/secrets-history-scan.mjs branches --repo stackra.git --prs prs.json \
  --keep '^stackra/l[0-9]+/verify$' --archive-list archive.txt > branches.md

# 2. one verified bundle per branch, plus manifest.tsv (branch, tip, bundle, sha256) and delete-after-review.sh
node tools/scripts/secrets-history-scan.mjs archive --repo stackra.git --branches archive.txt --dir stackra-branches

# 3. copy the bundles to a second place and check them against manifest.tsv, then delete the branches:
cd stackra.git && bash ../stackra-branches/delete-after-review.sh
```

Do the same for the template with `stackra-template.git`. Each delete line is
`git push origin --force-with-lease=refs/heads/<branch>:<tip> --delete refs/heads/<branch>`. A branch that moved after
it was bundled is refused, and the script stops there. To restore a branch, run
`git clone <bundle>` or `git fetch <bundle> refs/heads/<branch>:refs/heads/<branch>`.

Deleting a branch does not remove the `refs/pull/*` refs of its pull requests. GitHub keeps those, and only GitHub
Support can remove one. The full-history scan found nothing in them that needs removal.

The run on 2026-11-26 bundled all 37 core branches and both template branches. Every bundle verified and the mirrors'
refs were unchanged.

## The lists on 2026-11-26

### stackra-inc/stackra

288 branches besides `main` (merged: 7, content in base: 12, PR merged: 6, snapshot: 19, PR closed: 51, PR open: 117, open: 76). **37** go on the archive list.

| Branch                                                                    | Tip            | Last commit | Class           | Pull request |
| ------------------------------------------------------------------------- | -------------- | ----------- | --------------- | ------------ |
| `figentra/ci-typecheck-concurrency`                                       | `4929faba3367` | 2026-11-09  | content in base | #1008 closed |
| `figentra/sta-2676-stackra-docs-2`                                        | `c1310318ef22` | 2026-11-10  | content in base | —            |
| `fix/skill-licence-tenancy-test`                                          | `93ef9b8611e8` | 2026-11-09  | content in base | #965 closed  |
| `save/stackra/l6/vite-plugin-pwa-optional-diverged-2026-11-25`            | `e3be86788f9b` | 2026-11-24  | content in base | —            |
| `save/stackra/l7/actions-testing-plugin-defaults-diverged-2026-11-25`     | `5217840b55a3` | 2026-11-24  | content in base | —            |
| `save/stackra/l7/edge-test-scope-public-id-diverged-2026-11-25`           | `3ad1af797afc` | 2026-11-24  | content in base | —            |
| `save/stackra/l7/playground-palette-test-catalogue-diverged-2026-11-25`   | `221b1dd22ae0` | 2026-11-24  | content in base | —            |
| `stackra/l5/ui-virtual-row-measure`                                       | `e6e8e47776ff` | 2026-11-24  | content in base | #1046 closed |
| `stackra/l6/vite-plugin-pwa-optional`                                     | `2f63ed5f8fb6` | 2026-11-24  | content in base | #1055 closed |
| `stackra/l7/actions-testing-plugin-defaults`                              | `361d7589784c` | 2026-11-24  | content in base | #1047 closed |
| `stackra/l7/edge-test-scope-public-id`                                    | `88ab03944d7b` | 2026-11-24  | content in base | #1048 closed |
| `stackra/l7/playground-palette-test-catalogue`                            | `6cdeb212d327` | 2026-11-24  | content in base | #1049 closed |
| `figentra/main-green-docs-runway-registry`                                | `164b5ede0ec6` | 2026-11-07  | PR merged       | #652 merged  |
| `figentra/removals-stackra-reviewer`                                      | `950ff6e3a251` | 2026-11-04  | PR merged       | #450 merged  |
| `figentra/sta-2104-env-check`                                             | `a1eaab432461` | 2026-11-05  | PR merged       | #445 merged  |
| `figentra/sta-2104-env-manifest`                                          | `74e6ed9618a5` | 2026-11-05  | PR merged       | #444 merged  |
| `figentra/sta-2104-env-sync`                                              | `6e0c44dd567d` | 2026-11-05  | PR merged       | #447 merged  |
| `figentra/sta-2104-env-values`                                            | `f78d66cfdc3b` | 2026-11-05  | PR merged       | #446 merged  |
| `save/stackra/l3/container-wiring-platform-type-diverged-2026-11-25`      | `4b35731bdadb` | 2026-11-24  | snapshot        | —            |
| `save/stackra/l3/realtime-test-ephemeral-port-diverged-2026-11-25`        | `1246a9740e62` | 2026-11-24  | snapshot        | —            |
| `save/stackra/l3/runway-encore-app-diverged-2026-11-25`                   | `b9d0f166a2f8` | 2026-11-24  | snapshot        | —            |
| `save/stackra/l3/service-example-diverged-2026-11-25`                     | `235096ebc0ae` | 2026-11-25  | snapshot        | —            |
| `save/stackra/l3/service-health-diverged-2026-11-25`                      | `5d0d87e59d72` | 2026-11-24  | snapshot        | —            |
| `save/stackra/l5/ui-virtual-row-measure-diverged-2026-11-25`              | `6d44de1588b4` | 2026-11-25  | snapshot        | —            |
| `save/stackra/l6/cli-testbed-rsync-excludes-diverged-2026-11-25`          | `0cdf4d563134` | 2026-11-24  | snapshot        | —            |
| `save/stackra/l6/flow-preset-lefthook-oxlint-exclude-diverged-2026-11-25` | `1b97637d19ff` | 2026-11-24  | snapshot        | —            |
| `save/stackra/l6/mcp-stops-on-signal-diverged-2026-11-25`                 | `5a467ab9f5f6` | 2026-11-24  | snapshot        | —            |
| `save/stackra/l6/vitest-coverage-pin-diverged-2026-11-25`                 | `3e9e19090058` | 2026-11-24  | snapshot        | —            |
| `save/stackra/l7/edge-fetch-this-diverged-2026-11-25`                     | `be1eb80a02db` | 2026-11-24  | snapshot        | —            |
| `save/stackra/l7/guard-port-test-tmpdir-diverged-2026-11-25`              | `833edc4583db` | 2026-11-24  | snapshot        | —            |
| `save/stackra/l7/playground-manifest-regen-diverged-2026-11-25`           | `90975a6473c2` | 2026-11-24  | snapshot        | —            |
| `save/stackra/l7/registry-worker-missing-signing-key-diverged-2026-11-25` | `e2b1340b6e8c` | 2026-11-24  | snapshot        | —            |
| `save/wt-q2b-2026-11-25`                                                  | `8a02e2833bfd` | 2026-11-25  | snapshot        | —            |
| `save/wt-q2h-2026-11-25`                                                  | `6d89d2fead68` | 2026-11-25  | snapshot        | —            |
| `save/wt-q2m1-2026-11-25`                                                 | `7a3b1edf236c` | 2026-11-25  | snapshot        | —            |
| `save/wt-rw-2026-11-25`                                                   | `95d410eeec0c` | 2026-11-25  | snapshot        | —            |
| `save/wt-sta2783-2026-11-25`                                              | `6926952e0bdd` | 2026-11-25  | snapshot        | —            |

Kept, unmerged work (244); a branch whose pull request was closed unmerged is the owner's call:

| Branch                                                         | Tip            | Last commit | Class     | Pull request               |
| -------------------------------------------------------------- | -------------- | ----------- | --------- | -------------------------- |
| `ci/regen-proof`                                               | `0ac6067bdc1a` | 2026-11-09  | PR closed | #982 closed                |
| `figentra/config-driver-selectors`                             | `67f47b7f72c7` | 2026-11-09  | PR closed | #984 closed                |
| `figentra/config-signer-driver-field`                          | `17141660beaf` | 2026-11-09  | PR closed | #967 closed                |
| `figentra/config-store-driver-defaults`                        | `1d34a82bd918` | 2026-11-09  | PR closed | #1009 closed               |
| `figentra/encore-paths-no-baseurl`                             | `a743bc55e813` | 2026-11-09  | PR closed | #976 closed                |
| `figentra/encore-paths-without-baseurl`                        | `a0b37e1335b0` | 2026-11-09  | PR closed | #972 closed                |
| `figentra/encore-service-paths`                                | `b4abd6fde3c8` | 2026-11-09  | PR closed | #990 closed                |
| `figentra/gen-api-client-endpoint`                             | `5d0b649588ea` | 2026-11-09  | PR closed | #973 closed                |
| `figentra/gen-api-client-route`                                | `ccbad5fd92d3` | 2026-11-10  | PR closed | #988 closed                |
| `figentra/gen-encore-topic-ref`                                | `890c8c7480bd` | 2026-11-09  | PR closed | #1010 closed               |
| `figentra/gen-i18n-contract-namespace`                         | `de3b132a3287` | 2026-11-09  | PR closed | #975 closed                |
| `figentra/gen-i18n-contract-once`                              | `e8c3cd87a056` | 2026-11-09  | PR closed | #989 closed                |
| `figentra/gen-well-known-area-exempt`                          | `1b66454b6997` | 2026-11-09  | PR closed | #970 closed                |
| `figentra/gen-well-known-public-path`                          | `7c9907e02204` | 2026-11-09  | PR closed | #987 closed                |
| `figentra/iam-test-scope-default`                              | `9669483b7917` | 2026-11-10  | PR closed | #986 closed                |
| `figentra/iam-testing-default-tenant`                          | `91b082b2ced7` | 2026-11-09  | PR closed | #968 closed                |
| `figentra/main-validate-tsdoc`                                 | `b47c38ca3592` | 2026-11-10  | PR closed | #1011 closed               |
| `figentra/repo-checks-eval-json`                               | `06a7861068b0` | 2026-11-10  | PR closed | #1012 closed               |
| `figentra/sta-1971-gen-standard-reads`                         | `32a6f10f1ac5` | 2026-11-02  | PR closed | #280 closed                |
| `figentra/sta-2058-routes-typed-refs-pr`                       | `f1bcebcbf294` | 2026-11-03  | PR closed | #404 closed                |
| `figentra/sta-2060-openapi-fixes-pr`                           | `cac3f0f8168a` | 2026-11-03  | PR closed | #392 closed                |
| `figentra/sta-2065-i18n-locale-prefixes-pr`                    | `467d1a364415` | 2026-11-03  | PR closed | #400 closed                |
| `figentra/sta-2072-imports-map-drift-pr`                       | `563b02effee8` | 2026-11-03  | PR closed | #401 closed                |
| `figentra/sta-2096-risk-floor-v2`                              | `ab9d2a793ce5` | 2026-11-05  | PR closed | #1006 closed               |
| `figentra/sta-2666-encore-topic-files`                         | `aef4b93d7811` | 2026-11-10  | PR closed | #1014 closed               |
| `figentra/sta-2667-encore-folder`                              | `efbe5ba7549f` | 2026-11-10  | PR closed | #1015 closed               |
| `figentra/sta-2669-config-driver-defaults`                     | `c5db7cdbd228` | 2026-11-10  | PR closed | #1016 closed               |
| `figentra/sta-2671-app-i18n-json`                              | `fa6e2a881ac7` | 2026-11-10  | PR closed | #1017 closed               |
| `figentra/sta-2672-dev-past-gen-refusal`                       | `4d804e366f83` | 2026-11-10  | PR closed | #1018 closed               |
| `figentra/sta-2673-tenant-key-provider`                        | `f4c2af4a53ce` | 2026-11-10  | PR closed | #1019 closed               |
| `figentra/sta-2674-wiring-binds-boot`                          | `b3c0f95fbe04` | 2026-11-10  | PR closed | #1020 closed               |
| `figentra/sta-2675-port-selectors`                             | `665553fcfd9d` | 2026-11-10  | PR closed | #1021 closed               |
| `figentra/sta-2677-field-cipher`                               | `7ec6df556292` | 2026-11-10  | PR closed | #1022 closed               |
| `figentra/sta-2678-encore-online-index`                        | `81436c265f18` | 2026-11-10  | PR closed | #1023 closed               |
| `figentra/sta-2679-dev-secrets`                                | `347974b419aa` | 2026-11-10  | PR closed | #1024 closed               |
| `figentra/sta-2681-encore-paths`                               | `24730f9a4e16` | 2026-11-11  | PR closed | #1027 closed               |
| `figentra/sta-2682-pr-merge-adr-0523`                          | `b05321758248` | 2026-11-10  | PR closed | #1026 closed               |
| `figentra/sta-2761-stackra-verify`                             | `19171843d4f0` | 2026-11-26  | PR closed | #1043 closed               |
| `figentra/tenant-key-provider`                                 | `6cd978d49556` | 2026-11-09  | PR closed | #955 closed                |
| `figentra/testing-memory-drivers`                              | `66e2b07c1802` | 2026-11-09  | PR closed | #991 closed                |
| `figentra/testing-memory-gates`                                | `5e73a04650ab` | 2026-11-09  | PR closed | #977 closed                |
| `figentra/testing-plugins-memory-gates`                        | `2eb5cf217a0c` | 2026-11-09  | PR closed | #969 closed                |
| `fix/anonymous-record-policy`                                  | `aec024421e89` | 2026-11-09  | PR closed | #994 closed                |
| `fix/ci-commitlint-pr-title`                                   | `c88c3dc7098d` | 2026-11-09  | PR closed | #983 closed                |
| `fix/flow-preset-docs-member-paths`                            | `48dc7e5eba1d` | 2026-11-09  | PR closed | #985 closed                |
| `parked/core-q-verify`                                         | `cca7a8772d8a` | 2026-11-05  | PR closed | #1001 closed               |
| `runway/p4-ci-turbo-sops`                                      | `d7c14421047a` | 2026-11-06  | PR closed | #1000 closed               |
| `shipping-incoterm`                                            | `83ed5c04714c` | 2026-11-09  | PR closed | #960 closed                |
| `stackra/l3/realtime-test-ephemeral-port`                      | `db62a5150314` | 2026-11-24  | PR closed | #1062 closed               |
| `stackra/l7/edge-fetch-this`                                   | `c609fc23fe87` | 2026-11-24  | PR closed | #1052 closed               |
| `stackra/l7/registry-worker-missing-signing-key`               | `03bff21917a3` | 2026-11-24  | PR closed | #1051 closed               |
| `adr/0535-enterprise-sso-and-scim-per-tenant`                  | `3d7db70288be` | 2026-11-26  | PR open   | #1114 open                 |
| `changeset-release/main`                                       | `a48c2c15499a` | 2026-11-26  | PR open   | #1105 open                 |
| `ci/design-system-tests`                                       | `9a393f6d60dd` | 2026-11-26  | PR open   | #1042 open                 |
| `ci/flow-rendered-ci`                                          | `d63642b4b5d6` | 2026-11-26  | PR open   | #1036 open                 |
| `ci/sbom-internal-scope-checksums`                             | `8cd9eab2e825` | 2026-11-26  | PR open   | #956 open                  |
| `feat/stackra-ds-1.0`                                          | `da623913ec4c` | 2026-11-26  | PR open   | #1041 open                 |
| `figentra/gen-hatch-json-column`                               | `34041571dbdf` | 2026-11-26  | PR open   | #1007 open                 |
| `figentra/gen-strict-unsubscribed`                             | `e4905e38b290` | 2026-11-26  | PR open   | #979 open                  |
| `figentra/media-temporary-url-of`                              | `9a57dac5adfd` | 2026-11-26  | PR open   | #981 open                  |
| `figentra/removals-deprecate-infra-testbed`                    | `da75114f7f32` | 2026-11-26  | PR open   | #454 open                  |
| `figentra/removals-infra-testbed`                              | `27621905f571` | 2026-11-04  | PR open   | #451 open                  |
| `figentra/sta-1408-db-diff-trait-columns`                      | `e9ac1448782d` | 2026-11-26  | PR open   | #1130 open                 |
| `figentra/sta-1421-one-classification-source`                  | `c3069b04a7cc` | 2026-11-26  | PR open   | #1154 open                 |
| `figentra/sta-145-stackra-upgrade`                             | `db123f67be07` | 2026-11-26  | PR open   | #1126 open                 |
| `figentra/sta-1464-replica-lag-guard`                          | `4c09a3ba91b9` | 2026-11-26  | PR open   | #1138 open                 |
| `figentra/sta-1571-audit-fail-closed`                          | `2b0be03168da` | 2026-11-26  | PR open   | #1095 open                 |
| `figentra/sta-1617-mcp-secrets-off-argv`                       | `c7a566d1030d` | 2026-11-26  | PR open   | #1158 open                 |
| `figentra/sta-1717-bg-isolation-rls`                           | `16e9b5250e7c` | 2026-11-26  | PR open   | #1113 open                 |
| `figentra/sta-1733-adr-0453-figentra-registry`                 | `963d99ccb447` | 2026-11-04  | PR open   | #1002 open                 |
| `figentra/sta-1733-registry-switch`                            | `483bdb6847f0` | 2026-11-04  | PR open   | #1003 open                 |
| `figentra/sta-1733-registry-token`                             | `3e16ab33fd7a` | 2026-11-04  | PR open   | #1004 open                 |
| `figentra/sta-1735-supply-chain-hygiene`                       | `7aff6d42498b` | 2026-11-26  | PR open   | #1116 open                 |
| `figentra/sta-1792-outbox-verified-producer`                   | `00c27e0df5eb` | 2026-11-26  | PR open   | #1165 open                 |
| `figentra/sta-1955-webhook-encore-adapter`                     | `3b4149aee136` | 2026-11-26  | PR open   | #1146 open                 |
| `figentra/sta-1960-attachment-parent-visibility`               | `249da63e7b3f` | 2026-11-26  | PR open   | #1122 open                 |
| `figentra/sta-2048-typed-error-envelope`                       | `2ce963459713` | 2026-11-26  | PR open   | #1108 open                 |
| `figentra/sta-2092-planned-extensions`                         | `5b8d9e566cf8` | 2026-11-26  | PR open   | #1143 open                 |
| `figentra/sta-2111-core-hosts-switch`                          | `68682579399c` | 2026-11-05  | PR open   | #468 open                  |
| `figentra/sta-2160-frozen-migrations`                          | `d574f4d82e9c` | 2026-11-26  | PR open   | #1123 open                 |
| `figentra/sta-2241-search-encrypted-guard`                     | `3acfdd1c1383` | 2026-11-26  | PR open   | #1169 open                 |
| `figentra/sta-229-coverage-floors`                             | `d1ddfe6e019b` | 2026-11-26  | PR open   | #1155 open                 |
| `figentra/sta-2582-sanitize-email-html`                        | `9f3f34833caf` | 2026-11-26  | PR open   | #1119 open                 |
| `figentra/sta-2604-changeset-check`                            | `6324fc914dc3` | 2026-11-26  | PR open   | #1128 open                 |
| `figentra/sta-2662-one-tag-per-release`                        | `b1562d900409` | 2026-11-26  | PR open   | #978 open                  |
| `figentra/sta-2664-dev-infra-compose`                          | `d11be170bf8f` | 2026-11-26  | PR open   | #1141 open                 |
| `figentra/sta-27-incident-dr-runbooks`                         | `9a904caedf9b` | 2026-11-26  | PR open   | #1137 open                 |
| `figentra/sta-2705-consumer-gate-caller`                       | `986ae261cd48` | 2026-11-26  | PR open   | #1125 open                 |
| `figentra/sta-2705-quality-gate-tests`                         | `44713b0a92f9` | 2026-11-26  | PR open   | #1111 open                 |
| `figentra/sta-2705-release-consumer-gate`                      | `0b40ba3fbd83` | 2026-11-26  | PR open   | #1120 open                 |
| `figentra/sta-2709-benchmarks-express-baseline`                | `ce824512a9e8` | 2026-11-24  | PR open   | #1078 open                 |
| `figentra/sta-2761-bot-gh-no-status-writes`                    | `cfc2c5981292` | 2026-11-26  | PR open   | #1045 open                 |
| `figentra/sta-2761-stackra-verify-squashed`                    | `35ab9c76b26a` | 2026-11-26  | PR open   | #1118 open                 |
| `figentra/sta-2777-realtime-the-lan-relay-test-takes-free`     | `bfcb8fff919e` | 2026-11-26  | PR open   | #1074 open                 |
| `figentra/sta-2778-release-publish-in-dependency-order-verify` | `7a0adfd2be91` | 2026-11-26  | PR open   | #1075 open                 |
| `figentra/sta-2779-linear-check-pr-accept-stackralnslug-lane`  | `72cfe57309d9` | 2026-11-26  | PR open   | #1076 open                 |
| `figentra/sta-278-enterprise-sso-scim-adr`                     | `ccc5640b4c80` | 2026-11-26  | PR open   | #1117 open                 |
| `figentra/sta-2780-cli-promote-and-deploy-tests-take-a-stand`  | `7cbca43759af` | 2026-11-26  | PR open   | #1077 open                 |
| `figentra/sta-2781-replace-buffers`                            | `d46273b27e42` | 2026-11-26  | PR open   | #1083 open                 |
| `figentra/sta-2782-sentry-optional-peer`                       | `b38b2827dca6` | 2026-11-26  | PR open   | #1164 open                 |
| `figentra/sta-2783-box-deploy`                                 | `6b025b53d0af` | 2026-11-26  | PR open   | #1081 open                 |
| `figentra/sta-2785-ephemeral-runners`                          | `d0b5a943c74b` | 2026-11-26  | PR open   | #1084 open                 |
| `figentra/sta-2787-agents-install`                             | `2974780ae919` | 2026-11-26  | PR open   | #1080 open                 |
| `figentra/sta-2788-commit-compiled-migrations`                 | `6289473a2523` | 2026-11-26  | PR open   | #1079 open                 |
| `figentra/sta-2791-c2pa-trusted-only`                          | `f8ba573711dd` | 2026-11-26  | PR open   | #1150 open                 |
| `figentra/sta-2793-edge-dispatcher-adr`                        | `913109930fbe` | 2026-11-26  | PR open   | #1085 open                 |
| `figentra/sta-2794-customer-getting-started`                   | `3e8e5ca1e46f` | 2026-11-26  | PR open   | #1129 open                 |
| `figentra/sta-2794-dev-hosts`                                  | `74e98e500807` | 2026-11-26  | PR open   | #1091 open                 |
| `figentra/sta-2794-doctor-ports`                               | `fae16dcbce79` | 2026-11-26  | PR open   | #1087 open                 |
| `figentra/sta-2794-encore-aliases`                             | `da809aaed664` | 2026-11-26  | PR open   | #1086 open                 |
| `figentra/sta-2794-encore-local`                               | `e2cd49a42dfd` | 2026-11-26  | PR open   | #1089 open                 |
| `figentra/sta-2794-service-scaffold`                           | `813317afc4cf` | 2026-11-26  | PR open   | #1090 open                 |
| `figentra/sta-2795-dev-sign-in`                                | `5a819eedd192` | 2026-11-26  | PR open   | #1104 open                 |
| `figentra/sta-2798-refuse-memory-stores`                       | `46c03d751aad` | 2026-11-26  | PR open   | #1093 open                 |
| `figentra/sta-2802-drivers-real-backends`                      | `60faaa9290eb` | 2026-11-26  | PR open   | #1097 open                 |
| `figentra/sta-2803-edge-shared-nonce-store`                    | `0ef900cfccf7` | 2026-11-26  | PR open   | #1098 open                 |
| `figentra/sta-2806-owner-stackra-usr`                          | `253a2122192a` | 2026-11-26  | PR open   | #1107 open                 |
| `figentra/sta-2808-staged-refusals-block`                      | `b6e2a7e80e8a` | 2026-11-26  | PR open   | #1103 open                 |
| `figentra/sta-2817-login-policy-action`                        | `bc0cc9cbb920` | 2026-11-26  | PR open   | #1124 open                 |
| `figentra/sta-2818-consent-ledger`                             | `705668bfbe5f` | 2026-11-26  | PR open   | #1144 open                 |
| `figentra/sta-2821-sast-dast-baseline`                         | `eeba874f3097` | 2026-11-26  | PR open   | #1112 open                 |
| `figentra/sta-2824-registry-figentra-host`                     | `54317268cbb6` | 2026-11-26  | PR open   | #1115 open                 |
| `figentra/sta-2829-create-smoke`                               | `8bd94ecadac5` | 2026-11-26  | PR open   | #1163 open                 |
| `figentra/sta-2830-app-wiring-loadable-drivers`                | `f4c97dc7ad2d` | 2026-11-26  | PR open   | #1121 open                 |
| `figentra/sta-2832-identity-react-session`                     | `eb6a604df06c` | 2026-11-26  | PR open   | #1127 open                 |
| `figentra/sta-2834-heartbeats`                                 | `acd562727eea` | 2026-11-26  | PR open   | #1132 open                 |
| `figentra/sta-2835-upgrade-notes`                              | `c5218a0a12e3` | 2026-11-26  | PR open   | #1140 open                 |
| `figentra/sta-2836-deprecated-decorator`                       | `feb8a1ed2a32` | 2026-11-26  | PR open   | #1151 open                 |
| `figentra/sta-2837-contract-tier-oasdiff`                      | `7453790a803b` | 2026-11-26  | PR open   | #1134 open                 |
| `figentra/sta-2840-dev-end-to-end`                             | `c386ace147e4` | 2026-11-26  | PR open   | #1142 open                 |
| `figentra/sta-2842-test-quarantine`                            | `1cbecb87fe2a` | 2026-11-26  | PR open   | #1131 open                 |
| `figentra/sta-2843-task-guides-i`                              | `b9b46c2cb229` | 2026-11-26  | PR open   | #1135 open                 |
| `figentra/sta-2844-one-environment-reader`                     | `47f61c911fa1` | 2026-11-26  | PR open   | #1166 open                 |
| `figentra/sta-2847-release-facts`                              | `4c2a682ed57b` | 2026-11-26  | PR open   | #1136 open                 |
| `figentra/sta-2848-security-page-enforcement`                  | `3631eb0f1b5c` | 2026-11-26  | PR open   | #1133 open                 |
| `figentra/sta-2851-adr-index-health`                           | `3c4c07fb653a` | 2026-11-26  | PR open   | #1145 open                 |
| `figentra/sta-2852-task-guides-ii`                             | `a15844b4b596` | 2026-11-26  | PR open   | #1147 open                 |
| `figentra/sta-2853-troubleshooting-error-codes`                | `15844a7a4810` | 2026-11-26  | PR open   | #1148 open                 |
| `figentra/sta-2854-otlp-collector-proof-slo-burn-rate`         | `0b38827efa66` | 2026-11-26  | PR open   | #1153 open                 |
| `figentra/sta-2855-new-feature-generators`                     | `462646e58d37` | 2026-11-26  | PR open   | #1149 open                 |
| `figentra/sta-2856-example-service`                            | `f14ca6ee47fb` | 2026-11-26  | PR open   | #1159 open                 |
| `figentra/sta-2857-api-reference`                              | `ee4c019b237e` | 2026-11-26  | PR open   | #1167 open                 |
| `figentra/sta-2859-cli-residue`                                | `89e8656df3d6` | 2026-11-26  | PR open   | #1157 open                 |
| `figentra/sta-2860-runway-stream-deploy-output`                | `88fc6e97246e` | 2026-11-26  | PR open   | #1156 open                 |
| `figentra/sta-2861-bot-installation-from-repo`                 | `7d99c778a588` | 2026-11-26  | PR open   | #1160 open                 |
| `figentra/sta-2863-registry-deprecations`                      | `13f492203558` | 2026-11-26  | PR open   | #1162 open                 |
| `figentra/sta-2865-release-cadence-and-pro-line`               | `5ef81e479a09` | 2026-11-26  | PR open   | #1161 open                 |
| `figentra/sta-2872-cli-command-groups`                         | `a6a7a89b882c` | 2026-11-26  | PR open   | #1170 open                 |
| `figentra/sta-314-community-files`                             | `1175a7a32ede` | 2026-11-26  | PR open   | #1168 open                 |
| `figentra/sta-316-threat-models`                               | `2885076ef815` | 2026-11-26  | PR open   | #1109 open                 |
| `figentra/sta-609-image-supply-chain`                          | `34acda2c0c7c` | 2026-11-26  | PR open   | #1139 open                 |
| `figentra/sta-669-media-scan-gate`                             | `ed72a46d7826` | 2026-11-26  | PR open   | #1094 open                 |
| `figentra/sta-669-tus-uploads`                                 | `715342d08dab` | 2026-11-26  | PR open   | #1152 open                 |
| `fix/ai-forget-runs`                                           | `b107d7a23783` | 2026-11-26  | PR open   | #957 open                  |
| `geo/lead-form`                                                | `0594da872ff3` | 2026-11-26  | PR open   | #880 open                  |
| `geo/timeline-hero`                                            | `6c16abcf8948` | 2026-11-26  | PR open   | #879 open                  |
| `shipping-incoterm-terms`                                      | `befe800f2b34` | 2026-11-26  | PR open   | #980 open                  |
| `stackra/l3/container-wiring-platform-type`                    | `c83401a4a67c` | 2026-11-26  | PR open   | #1060 open                 |
| `stackra/l3/runway-encore-app`                                 | `e4f5ad6971f0` | 2026-11-26  | PR open   | #1061 open                 |
| `stackra/l3/service-example`                                   | `bfc62d6b3e98` | 2026-11-24  | PR open   | #1064 open                 |
| `stackra/l3/service-health`                                    | `bf71fa53ec02` | 2026-11-24  | PR open   | #1063 open                 |
| `stackra/l6/cli-testbed-rsync-excludes`                        | `d67083cedfef` | 2026-11-26  | PR open   | #1058 open                 |
| `stackra/l6/flow-preset-lefthook-oxlint-exclude`               | `c511e407c42c` | 2026-11-26  | PR open   | #1057 open                 |
| `stackra/l6/mcp-stops-on-signal`                               | `ab3b989b9a2d` | 2026-11-26  | PR open   | #1066 open                 |
| `stackra/l6/vitest-coverage-pin`                               | `531b41a64f74` | 2026-11-26  | PR open   | #1054 open                 |
| `stackra/l7/bench-dry-run-verify`                              | `550ce2fd5153` | 2026-11-26  | PR open   | #1056 open                 |
| `stackra/l7/guard-port-test-tmpdir`                            | `100232d99a38` | 2026-11-26  | PR open   | #1059 open                 |
| `stackra/l7/playground-manifest-regen`                         | `0ff816b6a19c` | 2026-11-26  | PR open   | #1050 open                 |
| `bench/runner-dry-run`                                         | `fbed39ea94b3` | 2026-11-24  | open      | —                          |
| `box/sta-2783-box-deploy`                                      | `47dc9e86d271` | 2026-11-25  | open      | —                          |
| `ci/runner-proof`                                              | `f76261e09fd9` | 2026-11-25  | open      | —                          |
| `feat/c6-gate-fix`                                             | `9fdd26c13c18` | 2026-10-31  | open      | —                          |
| `feat/c6-waves-land-2`                                         | `af564205b6cd` | 2026-10-30  | open      | —                          |
| `feat/c6-waves-land-3`                                         | `65c4bff1cdaf` | 2026-10-30  | open      | —                          |
| `feat/c6-waves-land-4`                                         | `2e224e2cd386` | 2026-10-30  | open      | —                          |
| `figentra/audit-api-key-calls`                                 | `b56a69fa787a` | 2026-11-09  | open      | —                          |
| `figentra/blueprint-unique-names`                              | `262eb5a7909b` | 2026-11-09  | open      | —                          |
| `figentra/clients-per-call-scope`                              | `d5cdca3f3bf1` | 2026-11-09  | open      | —                          |
| `figentra/config-driver-defaults`                              | `2d1b9ac1ad95` | 2026-11-09  | open      | —                          |
| `figentra/docs-lint-own-build`                                 | `9219bb3da444` | 2026-11-09  | open      | —                          |
| `figentra/encore-staging-copy`                                 | `154d415da858` | 2026-11-09  | open      | —                          |
| `figentra/hooks-oxlint-empty-file-list`                        | `42ca3e18906c` | 2026-11-09  | open      | —                          |
| `figentra/realtime-signed-tokens`                              | `d2e5e187d1a7` | 2026-11-09  | open      | —                          |
| `figentra/repo-checks-optional-peer-imports`                   | `d47b919b8628` | 2026-11-09  | open      | —                          |
| `figentra/sta-2059-entitlement-gates`                          | `fd99118d702d` | 2026-11-03  | open      | —                          |
| `figentra/sta-2738-showcase-coverage`                          | `b365d745c044` | 2026-11-24  | open      | —                          |
| `figentra/sta-2761-chainsaw-after-2781`                        | `12b28cf2cc1e` | 2026-11-25  | open      | —                          |
| `figentra/sta-2781-media-c2pa-unzipper-without-buffers`        | `72df7e77e1d6` | 2026-11-24  | open      | —                          |
| `figentra/sta-2785-ci-self-hosted`                             | `8e3e84194156` | 2026-11-25  | open      | —                          |
| `figentra/tidy-design-system-readme`                           | `dd94258db258` | 2026-11-24  | open      | —                          |
| `figentra/versioning-per-call`                                 | `5d6e4062584f` | 2026-11-09  | open      | —                          |
| `figentra/worktree-sync-stackra-core`                          | `03106bb37812` | 2026-11-03  | open      | —                          |
| `keep/2026-11-03/stackra-core-sta-2055`                        | `340032cd5162` | 2026-11-03  | open      | —                          |
| `keep/2026-11-03/stackra-core-sta-2058`                        | `f1ea38f99add` | 2026-11-03  | open      | —                          |
| `keep/2026-11-03/stackra-core-sta-2059`                        | `66e8156d6c69` | 2026-11-03  | open      | —                          |
| `keep/2026-11-03/stackra-core-sta-2063`                        | `e0fd7ddba9fb` | 2026-11-03  | open      | —                          |
| `keep/2026-11-03/stackra-core-sta-2065`                        | `eea44691096b` | 2026-11-03  | open      | —                          |
| `keep/2026-11-03/stackra-core-sta-340-call-shape`              | `4993ec49fbd3` | 2026-11-03  | open      | —                          |
| `lead/train-2026-11-24`                                        | `04bf6815d32c` | 2026-11-24  | open      | —                          |
| `lead/train-2026-11-24b`                                       | `53c479fbd714` | 2026-11-24  | open      | —                          |
| `stackra/l1/test-analytics-page-hide-and-relay`                | `e7d908f77e25` | 2026-11-24  | open      | —                          |
| `stackra/l1/test-calendar-day-count-mode`                      | `e80922aca3f2` | 2026-11-24  | open      | —                          |
| `stackra/l1/test-logger-otlp-gaps`                             | `5e4c40295d37` | 2026-11-24  | open      | —                          |
| `stackra/l1/test-market-packs-bundled-source`                  | `9bcc75b8354d` | 2026-11-24  | open      | —                          |
| `stackra/l1/test-query-offline-error-paths`                    | `bbbf7a7c5e1d` | 2026-11-24  | open      | —                          |
| `stackra/l1/test-settings-uncovered-apis`                      | `a77361880423` | 2026-11-24  | open      | —                          |
| `stackra/l1/test-validation-identifier-schema`                 | `cbe866340d48` | 2026-11-24  | open      | —                          |
| `stackra/l2/app-coverage-tests`                                | `24ac354f74a9` | 2026-11-24  | open      | —                          |
| `stackra/l2/cache-coverage-tests`                              | `dbe131820036` | 2026-11-24  | open      | —                          |
| `stackra/l2/infra-aws-runtime-coverage-tests`                  | `be15231c853b` | 2026-11-24  | open      | —                          |
| `stackra/l2/infra-gcp-coverage-tests`                          | `b5b9c256a3bc` | 2026-11-24  | open      | —                          |
| `stackra/l2/infra-identity-coverage-tests`                     | `ab888cfca727` | 2026-11-24  | open      | —                          |
| `stackra/l2/infra-observability-coverage-tests`                | `4b146f08d0f7` | 2026-11-24  | open      | —                          |
| `stackra/l2/infra-testbed-coverage-tests`                      | `548ce1abd375` | 2026-11-24  | open      | —                          |
| `stackra/l2/infra-testbed-package-root-tests`                  | `b9fa0f4c8a26` | 2026-11-24  | open      | —                          |
| `stackra/l2/infra-testbed-require-pins`                        | `68cad58f92e1` | 2026-11-24  | open      | —                          |
| `stackra/l2/infra-tools-coverage-tests`                        | `adb26c913197` | 2026-11-24  | open      | —                          |
| `stackra/l2/realtime-coverage-tests`                           | `b2c6ec1afecb` | 2026-11-24  | open      | —                          |
| `stackra/l2/realtime-rooms-coverage-tests`                     | `0e1a2fb864c3` | 2026-11-24  | open      | —                          |
| `stackra/l2/sandbox-coverage-tests`                            | `def3fbe3d3a9` | 2026-11-24  | open      | —                          |
| `stackra/l2/sandbox-proxy-coverage-tests`                      | `788268edb327` | 2026-11-24  | open      | —                          |
| `stackra/l2/sandbox-service-coverage-tests`                    | `78fa9734dbe1` | 2026-11-24  | open      | —                          |
| `stackra/l2/workflow-automation-service-tests`                 | `0f2e1376ac58` | 2026-11-24  | open      | —                          |
| `stackra/l2/workflow-checks-coverage-tests`                    | `c7f3ade6d9f9` | 2026-11-24  | open      | —                          |
| `stackra/l2/workflow-coverage-tests`                           | `601fa10f77b0` | 2026-11-24  | open      | —                          |
| `stackra/l2/workflow-runner-deadline-tests`                    | `34ac715529cb` | 2026-11-24  | open      | —                          |
| `stackra/l3/database-handle-on-connected`                      | `e8dc690c5fce` | 2026-11-24  | open      | —                          |
| `stackra/l3/gen-service-pipeline-ports`                        | `5d4d4a4a31fa` | 2026-11-24  | open      | —                          |
| `stackra/l3/integration`                                       | `c349f181ac5a` | 2026-11-24  | open      | —                          |
| `stackra/l4/ledger-exact-sums`                                 | `32303e3a6c37` | 2026-11-24  | open      | —                          |
| `stackra/l4/loyalty-earn-exact-rate`                           | `c9e4c9707079` | 2026-11-24  | open      | —                          |
| `stackra/l4/payments-refund-idempotency`                       | `b931121edcfe` | 2026-11-24  | open      | —                          |
| `stackra/l4/payments-serialise-record-writes`                  | `d1ffccc0e3c7` | 2026-11-24  | open      | —                          |
| `stackra/l6/cli-duplication-checks-in-product-repos`           | `16ac9d6bb525` | 2026-11-24  | open      | —                          |
| `stackra/l6/cli-tests-isolate-deploy-lock`                     | `bb74ab62025a` | 2026-11-24  | open      | #1065 closed, earlier head |
| `stackra/l6/coverage-tooling`                                  | `a3ba3583cab8` | 2026-11-25  | open      | —                          |
| `stackra/l6/create-formats-what-it-writes`                     | `bc1211cdb9d1` | 2026-11-24  | open      | —                          |
| `stackra/l6/linear-check-pr-lane-branches`                     | `5060c70b4bd8` | 2026-11-24  | open      | —                          |
| `stackra/l6/new-service-encore-ready`                          | `1867aa76fdc4` | 2026-11-24  | open      | —                          |
| `stackra/l6/new-service-template-gen-clean`                    | `acf41b4f256b` | 2026-11-24  | open      | —                          |
| `stackra/l6/release-publish-order`                             | `c84863bfde1b` | 2026-11-24  | open      | #1053 closed, earlier head |
| `stackra/l7/new-dry-run-all-kinds`                             | `c5ba8489fed5` | 2026-11-24  | open      | —                          |
| `stackra/l7/scaffold-console-template`                         | `1e8a355372fc` | 2026-11-24  | open      | —                          |
| `tpl-core-fixes`                                               | `13c1452c9ad1` | 2026-10-29  | open      | —                          |

Never listed (protected or kept on purpose): `stackra/l1/verify`, `stackra/l2/verify`, `stackra/l3/verify`, `stackra/l4/verify`, `stackra/l5/verify`, `stackra/l6/verify`, `stackra/l7/verify`.

### stackra-inc/stackra-template

17 branches besides `main` (merged: 1, content in base: 1, PR merged: 1, PR closed: 1, PR open: 11, open: 2). **2** go on the archive list.

| Branch                          | Tip            | Last commit | Class           | Pull request |
| ------------------------------- | -------------- | ----------- | --------------- | ------------ |
| `figentra/template-flow-064`    | `aafd1eb1d959` | 2026-11-06  | content in base | #48 merged   |
| `figentra/sta-2202-template-ci` | `9b126e7b06bc` | 2026-11-06  | PR merged       | #47 merged   |

Kept, unmerged work (14); a branch whose pull request was closed unmerged is the owner's call:

| Branch                                         | Tip            | Last commit | Class     | Pull request |
| ---------------------------------------------- | -------------- | ----------- | --------- | ------------ |
| `figentra/sta-2112-turbo-host`                 | `b2ed1d77c32b` | 2026-11-05  | PR closed | #43 closed   |
| `docs/order-stats-example`                     | `1fd35f02c87d` | 2026-11-09  | PR open   | #51 open     |
| `figentra/sta-1570-template-ci-tests`          | `d1aebbe8aed2` | 2026-11-26  | PR open   | #63 open     |
| `figentra/sta-1583-template-privacy-retention` | `9a38711fc3e9` | 2026-11-26  | PR open   | #65 open     |
| `figentra/sta-1620-template-tenant-notes`      | `1d3d2a4a1984` | 2026-11-26  | PR open   | #62 open     |
| `figentra/sta-2794-template-dev`               | `54cfbedffac1` | 2026-11-26  | PR open   | #60 open     |
| `figentra/sta-2794-template-gen`               | `d3d0db50eb65` | 2026-11-26  | PR open   | #59 open     |
| `figentra/sta-2794-template-hosts`             | `089278e794c0` | 2026-11-26  | PR open   | #61 open     |
| `figentra/sta-2829-create-smoke`               | `596fae6cb1ac` | 2026-11-26  | PR open   | #66 open     |
| `figentra/sta-2847-release-facts`              | `9e4bbbc517b5` | 2026-11-26  | PR open   | #64 open     |
| `stackra/l8/core-0.33.0`                       | `8351cd361cf2` | 2026-11-24  | PR open   | #58 open     |
| `stackra/l8/gitleaks-readme-fp`                | `00b56e0041c0` | 2026-11-24  | PR open   | #57 open     |
| `stackra/l8/template-pin-pulumi`               | `555b1e0e6dda` | 2026-11-24  | open      | —            |
| `stackra/l8/template-stackra-encore-ignores`   | `e8000e35f3a0` | 2026-11-24  | open      | —            |

Never listed (protected or kept on purpose): `stackra/l8/verify`.
