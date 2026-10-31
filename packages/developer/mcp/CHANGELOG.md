# @stackra/mcp

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
