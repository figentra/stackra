# create-stackra

The npm initializer for Stackra: it starts `stackra create` (in `@stackra/cli`) with the `@stackra` scope mapped to
the Stackra registry for one run, so a clean machine needs no `.npmrc` of its own. You need Node.js 24 or later and
pnpm 12 (the app's workspace uses pnpm catalogs).

**Tier:** `tier:lib` (`packages/developer/create-stackra`). Unscoped on purpose: an npm initializer is reached by its
unscoped npm name, the one registry a clean machine knows being npmjs
([ADR 0199](../../../apps/docs/src/docs/adr/0199-developer-experience-create-stackra-app-upgrades-stackra-dev-and-docs.mdx),
amendment of 2026-11-27).

<!-- prettier-ignore -->
> [!IMPORTANT]
> **Not published.** The package is built and tested here and stays `"private": true` until the owner holds its npmjs
> name and allows its npmjs publish (STA-2897). Until then the one documented command is the run it makes, written
> out:
>
> ```bash
> npx -y --@stackra:registry=https://npm.stackra.figentra.com/ @stackra/cli create my-app
> ```
>
> Do not run the initializer by its npm name before this note is gone: nothing on npmjs is ours under it yet.

## What it does

`@stackra/*` packages live on the Stackra registry (`https://npm.stackra.figentra.com/`,
[ADR 0453](../../../apps/docs/src/docs/adr/0453-the-stackra-registry-one-npm-compatible-store-on-cloudflare-and-our-own-licence-engine.mdx)),
which serves only the Stackra scopes and never proxies npmjs. So `npx @stackra/cli` on a clean machine is a 404, and
pointing npm's whole registry at the Stackra registry breaks every other package. `create-stackra` maps just the
`@stackra` scope, for this one run:

```bash
npx --yes --@stackra:registry=<registry> @stackra/cli@<cli> create <your arguments>
```

with `STACKRA_REGISTRY=<registry>` in the child's environment, so `stackra create` fetches the starter from the same
registry and writes the scope line into the new app's `.npmrc`. It writes no file and changes no npm setting of
yours, and its package has no dependencies.

## Options

| Option             | Default                                                     | Does                                                    |
| ------------------ | ----------------------------------------------------------- | ------------------------------------------------------- |
| `--registry <url>` | `STACKRA_REGISTRY`, else `https://npm.stackra.figentra.com/` | the Stackra registry (a mirror, or a local one in tests) |
| `--cli <version>`  | `latest`                                                    | the `@stackra/cli` version or dist-tag to run           |
| `-h`, `--help`     |                                                             | its own help                                            |

Every other argument goes to `stackra create` (`--yes`, `--name`, `--scope`, `--edition`, `--profile`,
`--no-install`, `--starter`, …); everything after `--` goes on as written. Once it is published, npm keeps the
options before its own `--` for itself, so through npm they go after it (`<initializer> my-app -- --yes --registry
http://localhost:8787`). Here, in the workspace:

```bash
pnpm --filter=create-stackra build && node packages/developer/create-stackra/dist/create-stackra.mjs my-app --yes
```

Exit codes: `stackra create`'s own; 0 for `--help`; 1 when Node.js is older than 24; 2 for a usage error; 127 when
npx cannot start (it then prints the `npx` line to run by hand).

## Structure

```text
src/node/
├── create-stackra.ts     the binary: runCreateStackra(process.argv, PROCESS_HOST)
├── constants/            PROCESS_HOST, the default registry, the CLI package, the Node floor, USAGE
├── functions/            runCreateStackra, parseBootstrapArgs, bootstrapRegistry, npxCommand, npxArguments, …
├── errors/               BootstrapUsageError
└── types/                BootstrapHost, BootstrapArgs, NpxCommand
```

## Tasks

| Task            | Command                                         |
| --------------- | ----------------------------------------------- |
| `build`         | `tsdown`                                        |
| `typecheck`     | `tsc --noEmit`                                  |
| `lint`          | `oxlint .`                                      |
| `test`          | `vitest run`                                    |
| `test:coverage` | `vitest run --coverage` (shared gate: 80/80/70) |
| `format`        | `oxfmt --write .`                               |
| `format:check`  | `oxfmt --check .`                               |
| `clean`         | `rm -rf dist coverage .turbo`                   |

Run one with `pnpm turbo run <task> --filter=create-stackra`.
