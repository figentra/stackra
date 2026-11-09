# @stackra/mcp

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

### Minor Changes

- bac874e: The last Infisical uses in the developer packages move to sops and figentra/secrets (ADR 0525).
  
  - `stackra mcp exec -- <argv>` decrypts each `$NAME` the command names with `sops exec-env` from the `agents` scope of
    the local figentra/secrets clone (`$STACKRA_SECRETS_DIR`, default `~/.stackra/secrets`), one nested call per secret,
    instead of `infisical run`. Its `--env` and `--path` flags are gone; `McpExecOptions` is now `{ secretsDir? }`.
  - Mobile onboarding no longer writes the FCM key to a vault: it goes only to EAS, its one reader, and running the
    `push` step again replaces a lost key. `InfisicalVaultWriterDriver` is removed, and `MobileOnboardRequest` has no
    `vault` port. A missing root-kit name prints `pnpm secrets:put <NAME> --scope ci/production/store` as its owner step.
  - gen's `env` manifest rows no longer carry `home` (the Infisical folder `/runtime/<member>`), and the field is gone
    from the `StackraManifest` type; runway already ignored it. Products regenerate their manifests after the release.
  - `stackra dev --tunnel` names the sops way to start with `CLOUDFLARE_TUNNEL_TOKEN`, and the service template's
    `runway.yaml` header names figentra/secrets.

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

### Minor Changes

- 1677615: One command definition serves the CLI, `--json` and the local developer MCP (STA-1966, ADR 0282 decision 5 as
  amended).
  
  - **Marking a tool:** `Command({ tool: true | { readOnly } })` marks a command for the local MCP.
  - **`toolsOf(config, ports)`** gives each such command:
    - an MCP-safe name (`spec:status` becomes `spec_status`);
    - a JSON Schema derived from its fields (kinds, bounds, patterns, choices, required arguments);
    - an `invoke` that runs it through the same kernel with `--json` and no prompts. Values never read as flags.
  - **`serveLocalMcp({ tools })`** serves these with the command's own document as `structuredContent`. One that is named
    like a built-in tool replaces it.
  
  Tenant tools stay on the action's own path through the `ai` service (ADR 0155).

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

- 2787c1e: Add `@stackra/mcp`, the local developer MCP of ADR 0282: `parseMcpConfig` and `renderMcpJson` check a `.mcp.yaml`
  (kebab-case server names; a `$NAME` secret only after `stackra mcp exec --`, never in env or a remote server; npx
  packages pinned to an exact version) and render the `.mcp.json` Claude Code reads, with `syncMcpConfig` and
  `checkMcpConfig` behind `stackra mcp sync` and `stackra agents check`; `mcpExecCommand` and `execWithSecrets` start a
  server under `infisical run` so its shell expands each secret without the value passing through Stackra; and
  `serveLocalMcp`, the stdio server behind `stackra mcp`, offers the `manifest`, `new`, `gen`, `validate` and `verify`
  tools (every command through the CLI's runner) and proxies the local Encore tools under `encore_`.
- 835e1d2: `filterTools(tools, access, scope)` filters by role and record scope, drops a tool the AI permission matrix sets to off,
  and marks an unentitled tool `locked: true` instead of returning a separate `locked` list.
- 1c6c2e2: Serve `ui://` resources (MCP Apps): `toolTable` carries a tool's resource into its descriptor `_meta`, and
  `uiResourceTable`, `uiResourcesFor` and `uiResourceContents` read the manifests' `uiResources`, list the ones a caller's
  tools name, and answer a read with the bundle and its frame policy (STA-784, ADR 0348).
- 088998e: Add the hosted MCP server core: `toolTable` builds the tool table from committed manifests with inlined input schemas
  and derived annotations, `filterTools` applies one caller's permissions and the tenant's entitlements, and
  `protectedResourceMetadata` and `wwwAuthenticate` publish the endpoint as an RFC 9728 protected resource.

### Patch Changes

- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- 0a7eaf1: Lint: the rule-gap B-3 autofix sweep (stackra-231, owner D11). `@stackra/oxlint-config` turns on
  `unicorn/numeric-separators-style`, `unicorn/switch-case-braces`, `unicorn/prefer-string-replace-all` and
  `unicorn/catch-error-name` at `error`. `unicorn/number-literal-case` stays off: it wants uppercase hex digits and oxfmt
  prints them lowercase, so the two would fight.
  
  The packages listed change no API and no behaviour. Long numeric literals carry `_` separators, every `case` body is a
  block, `.replace(/x/g, ...)` is `.replaceAll(...)` (a plain string where the pattern was a plain string), and a caught
  error is named `error`, or `<name>Error` where an outer `error` is in scope. Log and error `cause` fields keep their key.
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
