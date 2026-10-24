# Plan: `@stackra/vite-plugin` wave 3

**Spec**: `.agents/specs/sta-348-vite-plugin/spec.md`

1. **Preset plugins** (`src/core/functions/`): `corePlugins` wraps gen's `classComponents()` as a Vite plugin
   (skipped when the config already lists it), `generatedModulesPlugin` resolves `#stackra/*` to `.stackra/gen/`, and
   `serverOnlyPlugin` refuses `.server` specifiers in the client environment.
2. **Build plugins**: `pagesPlugin` (dev rewrite by longest prefix; build relocation with relative-depth fix),
   `manifestsPlugin` (serve and emit at the root), `budgetsPlugin` (gzipped chunk sizes), `prerenderPlugin`
   (`runnerImport` of the entry, `render(url, assets)` per route in `writeBundle`).
3. **Framework plugins**, loaded only where used: `renderPlugins` (React and Tailwind, or Workers, Tailwind and React
   Router), `pwaPlugin` (`vite-plugin-pwa` with `injectManifest`, no manifest, no registration), `sentryPlugin`.
4. **`viteConfig`** picks the target, checks pages, orders the plugins, sets server, define, base, output folder and
   input. **`stackra`** is the callable preset carrying `viteConfig`.
5. **Stand-in barrel and authored tool configs** until gen writes them (STA-339), as in earlier waves.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                                         |
| ------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/developer/vite-plugin`; workspace imports: `@stackra/contracts`, `@stackra/gen`, `@stackra/i18n`, `@stackra/runway` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | PASS   | no secret is read or passed                                                                                                                                                                  |
| Security                              | N/A    | no auth, tenant data or outbound call                                                                                                                                                        |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                                                                                 |
| Tenancy                               | N/A    | no tenant data                                                                                                                                                                               |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                                                       |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                                                             |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                                                    |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only; the pins for `vite-plugin-pwa`, `@cloudflare/vite-plugin`, `@react-router/dev` and `@sentry/vite-plugin` are added by the owner (T009)                    |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                                                              |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                                                           |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                                                      |

## Deploy modes

| Mode       | Behaviour                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| SaaS       | a build-time library, bundled into the consumer's app or service                                                                                 |
| On-prem    | identical: the same build, no SaaS-only code path                                                                                                |
| Air-gapped | identical: runs at build time on local files; the Sentry and Cloudflare options are the consumer's, and the package itself makes no network call |

## Correctness properties

- **P-001**: `package.json` `exports` lists only `.`, `turbo.jsonc` carries the `tier:lib` tag, and `stackra.config.ts` calls `definePackage` — Validates: FR-001
- **P-002**: `stackra()` returns `Plugin[]`, `stackra.viteConfig(app, options)` exists, `stackra` is the entry's only value, and `ViteConfigOptions` is exported as a type — Validates: FR-002
- **P-003**: the plugin list holds gen's `classComponents()` exactly once — Validates: FR-003
- **P-004**: an import of `#stackra/<name>` resolves to the file gen wrote, and the plugin adds no export of its own — Validates: FR-004
- **P-005**: every option the template's generated configs pass changes the config that `stackra.viteConfig` returns, and the README table lists each — Validates: FR-005
- **P-006**: the plugin reads and passes no secret value — Validates: FR-006
