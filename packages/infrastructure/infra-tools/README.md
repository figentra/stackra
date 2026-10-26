# @stackra/infra-tools

<!--
Stackra file contract:
Purpose: the package's reader guide: the per-region self-hosted tools stack (owner decision R3-5), its runway block,
         the catalogue, the AWS program and the endpoints OS integrations turns into managed Connections.
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

| Key               | Default                                        | Provider category      | Keeps data            |
| ----------------- | ---------------------------------------------- | ---------------------- | --------------------- |
| `documenso`       | `documenso/documenso` (unmodified, AGPL)       | `e-signature`          | no (Postgres)         |
| `ocr`             | Figentra's image (PaddleOCR; Surya by setting) | `ocr`                  | no                    |
| `nominatim`       | `mediagis/nominatim` on the region's extract   | `geocoding`            | yes                   |
| `photon`          | Figentra's image on the region's extract       | `address-autocomplete` | yes                   |
| `libretranslate`  | `libretranslate/libretranslate`                | `translation`          | yes (models)          |
| `chatwoot`        | `chatwoot/chatwoot` (headless, our screens)    | `help-desk`            | no (Postgres, Valkey) |
| `chatwoot-worker` | Chatwoot's image running Sidekiq               | none                   | no                    |

OCR and Photon have no upstream server image: the runway names Figentra's (`providers.tools.tools.<key>.image`) or
sets `enabled: false`. Disabling Chatwoot disables its worker.

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
    tools:
      ocr:
        image: ghcr.io/figentra/tools-ocr:1.0.0
        provider: paddleocr
      photon:
        image: ghcr.io/figentra/tools-photon:0.6.0
      libretranslate:
        memoryMb: 8192
```

The regions are the environment's `regions`, each defined under the root `regions` (cloud, location, account).

## What `awsToolsStack` declares

An AWS provider pinned to the region and its account, an ECS cluster, the private DNS namespace
`<region>.tools.<project>.internal`, one log group, the task execution role (it reads only the parameters under the
stack's secret path), an encrypted EFS file system with one access point per tool that keeps data, and per tool a
Fargate task definition and service with no public address. A tool with an endpoint is registered in the namespace, so
it answers at `http://<tool>.<region>.tools.<project>.internal:<port>` inside the VPC.

Secrets are SSM parameter references (`<secretsPath>/<tool>/<NAME>`); the Infisical sync writes the values (ADR 0173).
Documenso's and Chatwoot's database URLs point at the environment's shared Postgres server (ADR 0238).

## Endpoints become managed Connections

`ToolEndpoint` (`tool`, `category`, `provider`, `region`, `baseUrl`) is plain data, so OS integrations reads it from
the plan without Pulumi and creates each tenant's `managed` Connection (ADR 0376 decision 5) at that base URL. The
tenant may replace it with its own provider (a T4 connector in own mode).

## Not here

- The GCP program (Cloud Run): a region on GCP is refused until it is built.
- The OCR and Photon server images, and the databases and Valkey Documenso and Chatwoot use.
- Which stacks the deploy composes: `stackra infra gen` and the stacks repository.

Agents only preview: tests run the program under Pulumi's mocks; `pulumi up` is the owner's (ADR 0171).

## Licence and distribution

MIT in this repository and `"private": true`, so nothing publishes it yet.
