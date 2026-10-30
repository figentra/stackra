# @stackra/infra-tools

<!--
Stackra file contract:
Purpose: the package's reader guide: the per-region self-hosted tools stack (owner decision R3-5), its runway block,
         the catalogue and pinned images, the OCR and Photon images, EBS data, the databases and Valkey, the
         Infisical sync, the AWS program and the endpoints OS integrations turns into managed Connections.
Boundary: documentation only; the code and ADR 0444 win on any difference.
Runtime: none
Governing contract: ADR 0444; owner decisions R2-5, R2-6, R2-9, R2-10, R3-5 (2026-10-26); ADR 0171; ADR 0173.
-->

One shared tools stack per region, provisioned from the root runway: the self-hosted defaults Figentra runs as T3
managed services. Every image, size and switch is a catalogue default the runway overrides; nothing is typed twice.

**Tier:** `tier:lib` (`packages/infrastructure/infra-tools`, ADR 0127). Entries `.` (the plan, pure) and `./node` (the
runway file reader and the Pulumi program part). Depends on `@stackra/runway`, `@stackra/contracts`, zod and
`@pulumi/aws`; `@pulumi/pulumi` is a peer.

## What is here

| Entry    | Symbol                                       | Use                                                                       |
| -------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `.`      | `toolsStackPlan(root, environment)`          | each region's tools, extracts, secret parameters and endpoints            |
| `.`      | `TOOLS_CATALOGUE`, `OSM_EXTRACTS`            | the default containers and the GCC, Egypt, EU and US extracts             |
| `.`      | `ToolsStackPlan`, `ToolPlan`, `ToolEndpoint` | the plan: plain data, testable without a cloud                            |
| `./node` | `readToolsStackPlan(directory, env)`         | read the root `runway.yaml`, then plan                                    |
| `./node` | `awsToolsStack(plan, region, options?)`      | declare one AWS region's stack in a Pulumi program; returns its endpoints |

```ts
// figentra/infra, os/production-tools-gcc/index.ts
import { awsToolsStack, readToolsStackPlan } from "@stackra/infra-tools/node";

const tools = awsToolsStack(readToolsStackPlan("../os", "production"), "gcc");
export const endpoints = tools.endpoints;
```

## The tools

| Key                | Default                                       | Provider category      | Keeps data                    |
| ------------------ | --------------------------------------------- | ---------------------- | ----------------------------- |
| `documenso`        | `documenso/documenso` (unmodified, AGPL)      | `e-signature`          | no (shared Postgres)          |
| `ocr`              | `images/ocr` (PaddleOCR; Surya by `provider`) | `ocr`                  | no                            |
| `nominatim`        | `mediagis/nominatim` on the region's extract  | `geocoding`            | yes (EBS)                     |
| `photon`           | `images/photon`, imported from Nominatim      | `address-autocomplete` | yes (EFS)                     |
| `libretranslate`   | `libretranslate/libretranslate`               | `translation`          | yes (models, EFS)             |
| `chatwoot`         | `chatwoot/chatwoot` (headless, our screens)   | `help-desk`            | no (shared Postgres, Valkey)  |
| `chatwoot-worker`  | Chatwoot's image running Sidekiq              | none                   | no                            |
| `retrieval-embed`  | Hugging Face TEI, `BAAI/bge-m3` (GPU)         | `embedder`             | no                            |
| `retrieval-rerank` | Hugging Face TEI, `BAAI/bge-reranker-v2-m3`   | `reranker`             | no                            |
| `forecast`         | `images/forecast` (StatsForecast, CPU)        | `forecaster`           | no                            |
| `recommend`        | `images/recommend` (`implicit` ALS, CPU)      | `recommender`          | yes (EFS), **off by default** |
| `speech`           | `images/speech` (faster-whisper, GPU)         | `speech`               | no, **off by default**        |

Disabling Chatwoot disables its worker, its database and the Valkey. Photon reads Nominatim's database, so disabling
Nominatim alone fails the plan. An environment value may hold `{namespace}` (Photon's `NOMINATIM_HOST`).

## Pinned images

Checked against their registries on 2026-10-27; each tag is at least two weeks old. The stackra-154 tags (Documenso
v1.9.0, Nominatim 4.5, LibreTranslate v1.6.2, Chatwoot v4.1.0) were far behind and were replaced. None has run yet.

| Tool             | Image                                                    | Notes                                                                                                              |
| ---------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `documenso`      | `documenso/documenso:v2.20.0`                            | v2 env names checked against its `.env.example`                                                                    |
| `ocr`            | `ghcr.io/figentra/tools-ocr:1.0.0-paddleocr`             | built from `images/ocr` (`ENGINE=paddleocr`), not yet pushed                                                       |
| `ocr` (surya)    | `ghcr.io/figentra/tools-ocr:1.0.0-surya`                 | `ENGINE=surya`; weights licence limits use above USD 2M                                                            |
| `nominatim`      | `mediagis/nominatim:5.3.2`                               | Postgres 16 data path unchanged                                                                                    |
| `photon`         | `ghcr.io/figentra/tools-photon:1.3.0`                    | built from `images/photon` (Photon 1.3.0 jar), not yet pushed                                                      |
| `libretranslate` | `libretranslate/libretranslate:v1.9.6`                   |                                                                                                                    |
| `retrieval-*`    | `ghcr.io/huggingface/text-embeddings-inference:89-1.9.4` | verified 2026-10-30: built 2026-09-15; the `89-` build is for Ada GPUs (the L4 of g6); models pinned by `REVISION` |
| `forecast`       | `ghcr.io/figentra/tools-forecast:1.0.0`                  | built from `images/forecast` (StatsForecast 2.1.1), not yet pushed                                                 |
| `recommend`      | `ghcr.io/figentra/tools-recommend:1.0.0`                 | built from `images/recommend` (implicit 0.7.3), not yet pushed                                                     |
| `speech`         | `ghcr.io/figentra/tools-speech:1.0.0`                    | built from `images/speech` (faster-whisper 1.2.1, `large-v3` revision `edaa852e`), not yet pushed                  |
| `chatwoot`       | `chatwoot/chatwoot:v4.18.0`                              | needs `pg_trgm`, `pgcrypto`, `pg_stat_statements`, `vector`                                                        |
| database task    | `postgres:17.6-alpine`                                   | psql only                                                                                                          |

## The images Figentra builds

- `images/ocr`: `server.py` (stdlib HTTP, no framework). `POST /ocr?lang=ar` with an image or PDF as the raw body
  returns `{engine, lines: [{text, confidence, box}], text}`; `GET /health`. One engine per image
  (`docker build --build-arg ENGINE=surya`). Tests: `images/ocr/__tests__/test_server.py` with a stub engine.
- `images/photon`: on first start, imports from the region's Nominatim (`nominatim.<namespace>:5432`, the
  `NOMINATIM_PASSWORD` parameter) into its volume, then serves on 2322.

- `images/forecast`: `POST /forecast {series: [{id, timestamps, values}], horizon, frequency: H|D|W|M, models?}` returns
  `[{id, model, timestamps, mean, lo80, hi80}]`. AutoETS and AutoARIMA by default, CrostonOptimized for an intermittent
  series (half its values zero); a model that cannot fit a series leaves no row for it. `HttpForecasterDriver` of
  `@stackra/reports` calls it. Tests: `images/forecast/__tests__/test_server.py` with a stub engine.
- `images/recommend`: `POST /train {tenant, interactions: [{user, item, weight}]}` and
  `POST /recommend {tenant, item, kind: similar|bought_together, limit}` returning `[{id, score}]`. One `implicit` ALS
  model per tenant, in memory and under `/models/<tenant>` on the EFS volume. Off by default. Tests:
  `images/recommend/__tests__/test_server.py`.
- `images/speech`: faster-whisper `large-v3`, recognition only, zero retention. Its contract is
  `.agents/specs/sta-1629-ai-everywhere/contracts/tools-speech.md` (see `images/speech/README.md`); OS integrations
  writes the speech Connection driver, not this package. Off by default.
- `retrieval-embed` and `retrieval-rerank` run Hugging Face's text-embeddings-inference unmodified (Apache-2.0; one
  model per instance), each on its own GPU. They are tools, not images built here.

Image licences: TEI Apache-2.0, StatsForecast Apache-2.0, implicit MIT, faster-whisper MIT; models bge-m3 MIT,
bge-reranker-v2-m3 Apache-2.0, Whisper large-v3 MIT. Python lives only under `images/` (`pnpm validate`, ADR 0492
decision 7).

CI builds and pushes the images to GHCR; that workflow is not in this package.

## GPU tools

A tool with `gpu: true` (`retrieval-embed`, `retrieval-rerank`, `speech`) runs on an ECS capacity provider of GPU
instances in the region's cluster, not on Fargate. Per GPU instance type (`instanceType`, default `g6.xlarge`: one
NVIDIA L4) the stack declares a launch template on the ECS GPU-optimised Amazon Linux 2023 image (read by its public SSM
parameter), an Auto Scaling group that starts at zero and grows to the sum of its tools' `replicas`, and the capacity
provider with managed scaling. Each task asks for one GPU, so **one GPU instance runs per replica**. Per region with the
defaults that is two `g6.xlarge` (embed and rerank), three when `speech` is enabled: an owner cost line per region
(ADR 0492 consequences). Instances have no public address and need IMDSv2. shortcut: managed termination protection is
off, so a scale-in may stop a running task. The plan's `ToolPlan.gpu` carries the instance type; a runway override of
`providers.tools.tools.<key>.instanceType` changes it.

## Data on EBS

A tool with `storage: ebs` (Nominatim by default; `diskGb`, `instanceType` override) runs on its own ECS container
instance: the current ECS-optimised Amazon Linux 2023 image, no public address, IMDSv2 only, in the first subnet's
zone. Its encrypted gp3 disk is retained when the stack is destroyed, mounted at `/data`, and the task binds
`/data/<tool>`. Set `storage: efs` to keep it on Fargate and EFS.

## Databases and Valkey

Documenso and Chatwoot each get a logical database and an owning role of the same name on the environment's shared
Postgres server (ADR 0238). The stack declares a one-shot Fargate task (`databaseTask` in the result) that creates
them idempotently with the admin login from `<secretsPath>/postgres/{PGHOST,PGUSER,PGPASSWORD}` and each password from
`<secretsPath>/<tool>/DATABASE_PASSWORD`, then creates the extensions; the deploy runs it before the tools start. The
tool's own URL secret (`DATABASE_URL`, `NEXT_PRIVATE_DATABASE_URL`) must carry the same password.

Chatwoot and its worker read `REDIS_URL` from one Valkey replication group per region (`cacheNodeType`, default
`cache.t4g.micro`): TLS and encryption at rest, no auth token (no secret value in Pulumi), reachable only through the
tools security groups.

## Infisical to SSM

`plan.secretsSync` lists, per parameter folder, the Infisical folder (`<secretsSync.source>/<tool>`, default
`/tools/<tool>`, in the environment named like the runway's) and the SSM path it fills (`<secretsPath>/<tool>`) with
the names expected there. When the runway names `secretsSync.principal` and `secretsSync.externalId` (both may be
`ref:`), each region declares the role Infisical's AWS connection assumes (`secretsSyncRole`): it may write, read,
tag and delete only those folders. Creating the Infisical secret syncs is the deploy's step (ADR 0173).

## What the root runway holds

```yaml
providers:
  tools:
    environments: [production]
    extracts:
      gcc: gcc
    sources: # optional: replace or add an extract
      gcc:
        url: https://download.geofabrik.de/asia/gcc-states-latest.osm.pbf
    network:
      gcc:
        vpcId: ref:network.gcc.vpc
        subnetIds: [ref:network.gcc.private-a]
        securityGroupIds: [ref:network.gcc.tools]
    secretsPath: /acme/production/tools # default /<project>/<env>/tools
    logRetentionDays: 30
    cacheNodeType: cache.t4g.small # default cache.t4g.micro
    secretsSync:
      source: /tools # the Infisical folder root, default /tools
      principal: ref:infisical.awsPrincipal
      externalId: ref:infisical.externalId
    tools:
      ocr:
        provider: surya # picks ghcr.io/figentra/tools-ocr:1.0.0-surya
      nominatim:
        diskGb: 300
      libretranslate:
        memoryMb: 8192
```

The regions are the environment's `regions`, each defined under the root `regions` (cloud, location, account).

## What `awsToolsStack` declares

An AWS provider pinned to the region and its account, an ECS cluster, the private DNS namespace
`<region>.tools.<project>.internal`, one log group, the task execution role (it reads only the parameters under the
stack's secret path), an encrypted EFS file system with one access point per tool that keeps data on EFS, an EC2
instance and EBS disk per tool that keeps data on EBS, a GPU capacity provider per GPU instance type, the Valkey, the database task, the Infisical sync role, and per
tool a task definition and service with no public address. A tool with an endpoint is registered in the namespace, so
it answers at `http://<tool>.<region>.tools.<project>.internal:<port>` inside the VPC.

Secrets are SSM parameter references (`<secretsPath>/<tool>/<NAME>`); the Infisical sync writes the values (ADR 0173).
Documenso's and Chatwoot's database URLs point at the environment's shared Postgres server (ADR 0238).

## Endpoints become managed Connections

`ToolEndpoint` (`tool`, `category`, `provider`, `region`, `baseUrl`) is plain data, so OS integrations reads it from
the plan without Pulumi and creates each tenant's `managed` Connection (ADR 0376 decision 5) at that base URL. The
tenant may replace it with its own provider (a T4 connector in own mode).

## Not here

- The GCP program (Cloud Run): a region on GCP is refused until it is built.
- The CI workflow that builds and pushes `images/*`, the deploy step that runs the database task, and the Infisical
  secret syncs themselves.
- Photon's continuous updates from Nominatim's replication: delete its index to re-import.
- Which stacks the deploy composes: `stackra infra gen` and the stacks repository.

Agents only preview: tests run the program under Pulumi's mocks; `pulumi up` is the owner's (ADR 0171).

## Licence and distribution

MIT in this repository and `"private": true`, so nothing publishes it yet.
