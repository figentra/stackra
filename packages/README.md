# `packages/`

The `@stackra/*` libraries, the product of this repository
([ADR 0075](../apps/docs/src/adr/0075-stackra-ships-packages-figentra-os-ships-services.mdx)). A package lives at
`packages/<category>/<name>`, flat inside one category, and is tagged `tier:lib`; the tooling presets live in
[`tooling/`](tooling) and are tagged `tier:config`.

| Category                         | For                                                                  |
| -------------------------------- | -------------------------------------------------------------------- |
| [`foundation`](foundation)       | the kernel: contracts, validation, errors, container, config, logger |
| [`application`](application)     | actions, codegen (IR, registry) and AI                               |
| [`communication`](communication) | webhooks, notifications, versioning, integrations                    |
| [`cross-cutting`](cross-cutting) | concerns every layer shares                                          |
| [`data`](data)                   | model, database, content, media, search                              |
| [`developer`](developer)         | CLI, generator, coding standard, Vite plugin                         |
| [`experience`](experience)       | UI building blocks; holds `@stackra/brand` today                     |
| [`runtime`](runtime)             | outbox, queue, scheduler, workflow, realtime, cache                  |
| [`security`](security)           | connections, entitlements, licensing                                 |
| [`state`](state)                 | settings, feature flags, theming                                     |
| [`tooling`](tooling)             | `@stackra/{typescript,oxlint,vitest,tsdown}-config`                  |

The category list is [ADR 0127](../apps/docs/src/adr/0127-package-categories-including-infrastructure.mdx); it also
names `commerce` and `infrastructure`, which have no folder yet. A package that fits no category needs a new ADR.

## Rules

- Named `@stackra/<name>`; code in `src/`, entry `src/index.ts`; built with `@stackra/tsdown-config`.
- Versions only from `pnpm-workspace.yaml` catalogs or `workspace:*`.
- A package never imports an app, a service, `encore.dev` or another package's `src/`
  ([ADR 0003](../apps/docs/src/adr/0003-tier-dependency-direction.mdx), `packages/tooling/oxlint/src/boundaries.jsonc`).
- Tests in `src/**/__tests__/<name>.test.ts` ([ADR 0022](../apps/docs/src/adr/0022-tests-live-in-tests-folders.mdx)).
- Kebab-case files, one exported declaration per file, `#` subpath imports instead of `../`, and barrels that name
  every symbol ([ADR 0006](../apps/docs/src/adr/0006-naming-exports-and-imports.mdx)).
- Each package carries `README.md`, `AGENTS.md` (with `## PII`), `CHANGELOG.md` and the root `LICENSE`; its
  `package.json` is MIT, `sideEffects: false`, with compiled exports
  ([ADR 0025](../apps/docs/src/adr/0025-packages-publish-to-private-registry.mdx)). `pnpm validate` checks all of it.
- A consumer-visible change carries a changeset (`pnpm changeset`).
- Never a product name or literal in a package ([ADR 0023](../apps/docs/src/adr/0023-stackra-is-a-framework.mdx)).
- Create one with `pnpm new package <name> --category <category>`.

Guides: [package categories](../apps/docs/src/guides/packages.mdx), [packages standard](../apps/docs/src/standards/packages.mdx).
