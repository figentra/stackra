# @stackra/infra-tools

## 0.32.0

### Patch Changes

- @stackra/runway@0.32.0
  - @stackra/contracts@0.32.0

## 0.31.0

### Patch Changes

- Updated dependencies [5585893]
- Updated dependencies [ebfd942]
- Updated dependencies [670f75c]
  - @stackra/runway@0.31.0
  - @stackra/contracts@0.31.0

## 0.30.0

### Patch Changes

- Updated dependencies [17fafdd]
- Updated dependencies [4ce80a2]
- Updated dependencies [8c17109]
- Updated dependencies [ef49e63]
- Updated dependencies [a3a3190]
- Updated dependencies [0765ecc]
- Updated dependencies [f4df473]
  - @stackra/contracts@0.30.0
  - @stackra/runway@0.30.0

## 0.29.0

### Patch Changes

- @stackra/runway@0.29.0
  - @stackra/contracts@0.29.0

## 0.28.0

### Patch Changes

- @stackra/runway@0.28.0
  - @stackra/contracts@0.28.0

## 0.27.0

### Patch Changes

- @stackra/runway@0.27.0
  - @stackra/contracts@0.27.0

## 0.26.0

### Patch Changes

- @stackra/runway@0.26.0
  - @stackra/contracts@0.26.0

## 0.25.0

### Patch Changes

- @stackra/runway@0.25.0
  - @stackra/contracts@0.25.0

## 0.24.0

### Patch Changes

- @stackra/runway@0.24.0
  - @stackra/contracts@0.24.0

## 0.23.0

### Patch Changes

- @stackra/runway@0.23.0
  - @stackra/contracts@0.23.0

## 0.22.0

### Patch Changes

- @stackra/runway@0.22.0
  - @stackra/contracts@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [2974e54]
- Updated dependencies [a785356]
- Updated dependencies [f184d12]
  - @stackra/runway@0.21.0
  - @stackra/contracts@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies [671c9fd]
- Updated dependencies [3b48b0f]
  - @stackra/runway@0.20.0
  - @stackra/contracts@0.20.0

## 0.19.0

### Patch Changes

- e105174: The infrastructure and developer packages describe sops and figentra/secrets instead of Infisical (ADR 0525).
  
  - `@stackra/infra-aws-runtime`: the RDS Proxy login secret's description names the vault, not Infisical, so the next
    apply updates that description in place. The docs name the vault and runway's secrets sync.
  - `@stackra/infra-tools`: the tools-stack secrets sync is the vault's (`secretsSync` keeps its shape: `source`,
    `principal`, `externalId`); the missing external id error names the secrets sync.
  - `@stackra/infra-github`, `@stackra/infra-cloudflare`, `@stackra/infra-identity`, `@stackra/infra-observability`,
    `@stackra/runway`, `@stackra/mcp`, `@stackra/cli`, `@stackra/fiscal`, `@stackra/licensing`: docs and comments only.
    `githubPlan` still turns `providers.infisical` into the `INFISICAL_*` CI variables until plan phase P6.
- Updated dependencies [58e3066]
- Updated dependencies [2933e48]
- Updated dependencies [bac874e]
- Updated dependencies [e105174]
- Updated dependencies [c239773]
- Updated dependencies [414586e]
- Updated dependencies [7a83de3]
- Updated dependencies [1f33c82]
  - @stackra/contracts@0.19.0
  - @stackra/runway@0.19.0

## 0.18.1

### Patch Changes

- Updated dependencies [baee3a3]
  - @stackra/runway@0.18.1
  - @stackra/contracts@0.18.1

## 0.18.0

### Patch Changes

- Updated dependencies [15cd10c]
- Updated dependencies [dbf1c33]
  - @stackra/runway@0.18.0
  - @stackra/contracts@0.18.0

## 0.17.2

### Patch Changes

- Updated dependencies [2da4d9d]
  - @stackra/runway@0.17.2
  - @stackra/contracts@0.17.2

## 0.17.1

### Patch Changes

- @stackra/runway@0.17.1
  - @stackra/contracts@0.17.1

## 0.17.0

### Patch Changes

- Updated dependencies [4c6bf13]
  - @stackra/runway@0.17.0
  - @stackra/contracts@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [89d4633]
- Updated dependencies [08be546]
  - @stackra/runway@0.16.0
  - @stackra/contracts@0.16.0

## 0.15.0

### Patch Changes

- @stackra/runway@0.15.0
  - @stackra/contracts@0.15.0

## 0.14.4

### Patch Changes

- Updated dependencies [fda1d53]
  - @stackra/runway@0.14.4
  - @stackra/contracts@0.14.4

## 0.14.3

### Patch Changes

- Updated dependencies [3ccf74a]
- Updated dependencies [64e4840]
  - @stackra/runway@0.14.3
  - @stackra/contracts@0.14.3

## 0.14.2

### Patch Changes

- @stackra/runway@0.14.2
  - @stackra/contracts@0.14.2

## 0.14.1

### Patch Changes

- Updated dependencies [857a7fb]
  - @stackra/runway@0.14.1
  - @stackra/contracts@0.14.1

## 0.14.0

### Patch Changes

- Updated dependencies [54e05c6]
  - @stackra/runway@0.14.0
  - @stackra/contracts@0.14.0

## 0.13.0

### Patch Changes

- Updated dependencies [dc4b3f0]
- Updated dependencies [5d10209]
- Updated dependencies [6e61084]
  - @stackra/runway@0.13.0
  - @stackra/contracts@0.13.0

## 0.12.0

### Patch Changes

- Updated dependencies [e36505c]
  - @stackra/runway@0.12.0
  - @stackra/contracts@0.12.0

## 0.11.1

### Patch Changes

- @stackra/runway@0.11.1
  - @stackra/contracts@0.11.1

## 0.11.0

### Patch Changes

- Updated dependencies [46951df]
  - @stackra/runway@0.11.0
  - @stackra/contracts@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [a15cacf]
- Updated dependencies [4c0eead]
- Updated dependencies [4749967]
- Updated dependencies [f511762]
- Updated dependencies [e57b9a1]
- Updated dependencies [ea40871]
- Updated dependencies [0d65e3f]
- Updated dependencies [242ebe4]
- Updated dependencies [242ebe4]
- Updated dependencies [0d65e3f]
- Updated dependencies [c4348cd]
- Updated dependencies [0d65e3f]
- Updated dependencies [0d65e3f]
- Updated dependencies [0d65e3f]
- Updated dependencies [0d65e3f]
  - @stackra/runway@0.10.0
  - @stackra/contracts@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [2aeaec8]
- Updated dependencies [5030040]
- Updated dependencies [93bb1e7]
- Updated dependencies [b0d6fcc]
- Updated dependencies [2e43c48]
- Updated dependencies [2e43c48]
- Updated dependencies [ca1614e]
- Updated dependencies [bd3f314]
  - @stackra/runway@0.9.0
  - @stackra/contracts@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [02c47c3]
- Updated dependencies [67e7e8f]
  - @stackra/runway@0.8.0
  - @stackra/contracts@0.8.0

## 0.7.1

### Patch Changes

- @stackra/runway@0.7.1
  - @stackra/contracts@0.7.1

## 0.7.0

### Patch Changes

- @stackra/runway@0.7.0
  - @stackra/contracts@0.7.0

## 0.6.1

### Patch Changes

- @stackra/runway@0.6.1
  - @stackra/contracts@0.6.1

## 0.6.0

### Patch Changes

- Updated dependencies [67dac91]
- Updated dependencies [0183006]
- Updated dependencies [a736fb5]
- Updated dependencies [b74c373]
- Updated dependencies [2ed03e2]
  - @stackra/runway@0.6.0
  - @stackra/contracts@0.6.0

## 0.5.1

### Patch Changes

- @stackra/runway@0.5.1
  - @stackra/contracts@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [f7321ea]
  - @stackra/runway@0.5.0
  - @stackra/contracts@0.5.0

## 0.4.0

### Patch Changes

- eaf4c2b: Postgres 18 is the production major (STA-1691, ADR 0238 amendment of 2026-10-31): a `resources.postgres` without a
  `version` plans 18, the GCP examples and messages name `POSTGRES_18`, and the tools stack's database task runs the pinned
  `postgres:18.6-alpine` client.
- Updated dependencies [9c8d108]
- Updated dependencies [f8fe5a5]
- Updated dependencies [1856ee0]
- Updated dependencies [1a09488]
- Updated dependencies [d065062]
- Updated dependencies [d63eb09]
- Updated dependencies [2e94f1e]
  - @stackra/contracts@0.4.0
  - @stackra/runway@0.4.0

## 0.3.0

### Minor Changes

- 2d51c0d: Add the ML workers of ADR 0492 decision 8 (STA-1637). Catalogue entries `retrieval-embed` and `retrieval-rerank` (the
  unmodified Hugging Face text-embeddings-inference image `89-1.9.4`, `BAAI/bge-m3` and `BAAI/bge-reranker-v2-m3` pinned by
  revision, GPU), `forecast` (`images/forecast`, StatsForecast), `recommend` (`images/recommend`, `implicit` ALS, off by
  default) and `speech` (`images/speech`, faster-whisper `large-v3`, GPU, off by default). `ToolDefinition` gains `gpu` and
  `enabled`, `ToolPlan` gains `gpu`, and a catalogue `enabled: false` holds until the runway enables the tool. `awsToolsStack`
  declares a GPU capacity provider per GPU instance type (launch template on the ECS GPU-optimised AMI, an Auto Scaling
  group from zero, managed scaling) and places `gpu` tools on it, one GPU per task; the others stay on Fargate. A GPU tool starts asleep (`desiredCount` 0) in every environment and
  scales itself back to zero after 30 idle minutes (CPUUtilization under 5%); waking is a manual
  `aws ecs update-service --desired-count 1` (wake-on-request is STA-1661). Only a runway `replicas` above 0 keeps one up.
  `ToolPlan.gpu` gains `hourlyUsd` and `maxReplicas` and each region plan returns `gpuHourlyUsdAtMax` (estimates, for the
  cost cap STA-1640). Owner cost: zero by default, about $0.98 an hour per awake `g6.xlarge` (estimate).

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
- Updated dependencies [ae08e09]
- Updated dependencies [4ed7315]
- Updated dependencies [d53babc]
  - @stackra/contracts@0.3.0
  - @stackra/runway@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [9085c41]
- Updated dependencies [3e4c408]
- Updated dependencies [a4b8844]
- Updated dependencies [d37c08f]
  - @stackra/contracts@0.2.0
  - @stackra/runway@0.2.0

## 0.1.0

### Minor Changes

- 76d30d5: Add `@stackra/infra-tools`: the per-region self-hosted tools stack (Documenso, OCR, Nominatim and Photon on a regional
  OpenStreetMap extract, LibreTranslate, Chatwoot) planned from the root runway's `providers.tools` block
  (`toolsStackPlan`, `readToolsStackPlan`), the AWS Pulumi program `awsToolsStack` (ECS Fargate, private DNS, EFS), and
  the `ToolEndpoint` records OS integrations turns into managed Connections.
- 37e1aa8: Round D. search: synonym sets per index and language as settings data (`search.synonyms`), applied by both Postgres
  lanes; `find`/`page`/`facets` take `locale`. events: `IntegrationEvent({ crossRegion: true })`, the `RegionBus` port,
  `crossRegionRecords` and `RegionBusFake`. infra-gcp: static egress addresses (`shared.network.egress.staticIps`).
  versioning: deprecated dated versions are served until their support window ends (`VERSION_SUPPORT_MONTHS`), then
  refused; `applyVersionHeaders`. infra-tools:
  OCR and Photon images, tool databases and Valkey, Infisical secret sync, EBS-backed tools.

### Patch Changes

- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [62c7ae1]
- Updated dependencies [37e1aa8]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [65f5ac1]
- Updated dependencies [914465a]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [a1eb70f]
- Updated dependencies [150fa18]
- Updated dependencies [3ccd0ab]
- Updated dependencies [769adee]
- Updated dependencies [4135a5a]
- Updated dependencies [c927e35]
- Updated dependencies [29c2d3e]
- Updated dependencies [2787c1e]
- Updated dependencies [8d304d6]
- Updated dependencies [e344058]
- Updated dependencies [a183131]
- Updated dependencies [fbf8fa4]
- Updated dependencies [4ea8dd0]
- Updated dependencies [3a5d71d]
- Updated dependencies [e756399]
- Updated dependencies [d19a3d5]
- Updated dependencies [d19a3d5]
  - @stackra/contracts@0.1.0
  - @stackra/runway@0.1.0

Written by Changesets on release; never edited by hand.
