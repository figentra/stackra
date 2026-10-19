---
title: Not built yet
description: Technologies rejected or deferred. Do not introduce them helpfully; route to architecture-guardian.
always: true
applies_to: []
manual: false
---

# Not built yet

If a task seems to need one of these, stop and route to the `architecture-guardian` agent. Rejected means no; deferred
means not yet. A row changes only by a new ADR. Full table with revival triggers: `/adr/0011-rejected-and-deferred-technologies`.

| Do not introduce | Status | Use instead |
| --- | --- | --- |
| Encore (`encore.dev`, `~encore/*`) as the service runtime; the backend runtime is undecided | Deferred | independent service members (`/adr/0010-services-are-independent-workspace-members`) |
| `@nestjs/*`; an API gateway in front of services | Rejected | `@stackra/container` (Nest-shaped, no `@nestjs/*`) |
| `reflect-metadata`, type-based auto-wiring | Rejected | explicit tokens (`/adr/0005-di-container-and-legacy-decorators`) |
| Prisma, Drizzle, TypeORM, Knex | Rejected | MikroORM (`/adr/0014-data-ownership-and-orm`) |
| ESLint, Prettier, Jest | Rejected | oxlint, oxfmt, vitest |
| Express, Fastify as a server framework | Rejected | the runtime chosen by ADR |
| Vite+ (`vp`) as task runner | Rejected | Turborepo, oxlint, oxfmt, lefthook |
| A second vault, Doppler, secret values in files, `.env` | Rejected | Infisical + runtime secret store |
| A second code host in this repo (code host is GitHub) | Rejected | one host (`/adr/0012-code-host-and-ci`) |
| expo-router in the mobile app | Rejected | code-based React Navigation (`@react-navigation/*`, `react-native-bottom-tabs`) |
| An AI gateway; a separate-language agent runtime | Rejected | AI SDK core + MCP SDK inside the service |
| A runtime schema engine, server-driven UI, JSONB-for-everything | Rejected | coded resources, build-time generation |
| A shared React component library across web and native | Deferred | share types, client, validation, state, i18n, tokens |
| A sync engine (RxDB, ElectricSQL, PowerSync, WatermelonDB) | Deferred | mutation queue with idempotency keys |
| Typesense, Meilisearch, OpenSearch | Deferred | Postgres `pg_trgm` + full-text behind a search interface |
| OpenFGA, SpiceDB, Cedar | Deferred | in-house `check(subject, relation, object)` |
| A separate observability service; Prometheus for business metrics | Deferred | platform tracing, metrics, logs |

Enforcement: `FORBIDDEN_DEPENDENCIES` in `tools/scripts/validate-repository.mjs` (eslint, prettier, jest, nest,
reflect-metadata, prisma, drizzle, express, fastify, typeorm, knex); `boundaries.jsonc` bans `encore.dev` in packages.
Rows naming no package are planned (guardian review). Docs: `/adr/0011-rejected-and-deferred-technologies`.
