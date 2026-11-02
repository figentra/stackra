# Implementation Plan: Core docs move from Mintlify to Fumadocs

**Spec**: `.agents/specs/sta-2026-core-docs-fumadocs/spec.md` · **Linear**: STA-2026 · **Date**: 2026-11-02

**Input**: Feature specification from `.agents/specs/sta-2026-core-docs-fumadocs/spec.md`. Approved by the owner
2026-11-02. Research in `research.md`, the emitted files in `data-model.md`, the outside contract in
`contracts/docs-site.md`, the checks to run in `quickstart.md`.

## Summary

`stackra gen` stops assembling a Mintlify root in `apps/docs/.stackra/site/` and assembles a Fumadocs site there
instead: the same pages, the same `DocsConfig` navigation and the same refusals, rendered by Fumadocs on Vite and React
Router 7 and prerendered to static files. A Cloudflare Worker, `stackra-docs`, serves those files and is deployed by
Runway's `cloudflare-workers` provider. Page URLs and `llms.txt` stay where they are. The `mint` checks are replaced by
a link check in `stackra lint` and an axe pass in the docs app's e2e tier. Once the owner moves
docs.stackra.figentra.com to the Worker, a clean-up change removes every Mintlify reference.

## Technical Context

- **Language**: TypeScript (ESM), Node 24 (`mise.toml`); MDX pages
- **Members**: `apps/docs` (`tier:app`); `packages/developer/gen`, `packages/developer/cli`,
  `packages/developer/runway`, `packages/developer/repo-checks` (`tier:lib`, category `developer`);
  `tools/scaffold/templates/apps/docs`
- **New dependencies**: `fumadocs-core`, `fumadocs-ui`, `fumadocs-mdx` (owner-approved), exact pins in a catalog; the
  rest is already catalogued (research R2). Leaving: `mint` and its three overrides
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); Playwright with axe in `apps/docs/e2e/__tests__/*.e2e.test.ts`
  as `apps/playground` does it; all on the testbed or in CI
- **Storage**: none
- **Runtime target**: static files on a Cloudflare Worker (assets only, ADR 0284 and 0514); gen and the CLI are Node
  libraries

## Constitution Check

| Law                                   | Result | Note                                                                                                                       |
| ------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | gen, cli and runway stay `tier:lib`; `apps/docs` imports packages only, never another app                                  |
| Secrets (ADR 0009)                    | PASS   | no new secret; the deploy uses `CLOUDFLARE_API_TOKEN` over OIDC as `workers/static` does; Mintlify's key is no longer read |
| Security                              | PASS   | a public static site with no runtime code, no form and no personal data                                                    |
| HTTP and events                       | N/A    | no action, query, endpoint or event; the site is static files                                                              |
| Tenancy                               | N/A    | no tenant data                                                                                                             |
| Delegation                            | PASS   | the delegation plan below names each lane and route                                                                        |
| Not built yet (ADR 0011)              | PASS   | no rejected technology: not Next.js (Vite and React Router, 0165), no Storybook, no separate search service                |
| Test placement (ADR 0022)             | PASS   | unit tests in `__tests__/` beside each subject; the app's e2e in `apps/docs/e2e/__tests__/`                                |
| Versions and catalogs                 | PASS   | Fumadocs pinned exactly in a catalog (owner-approved); `mint` leaves the catalog                                           |
| Deploy modes (ADR 0076)               | PASS   | the same public site in every mode (table below)                                                                           |
| Licence tier (ADR 0077)               | PASS   | free, MIT, this repository                                                                                                 |
| Docs and ADRs                         | PASS   | ADR 0514 decides it; this plan opens no ADR; the pages naming Mintlify are rewritten (Docs below)                          |

## Deploy modes

| Mode       | Behaviour                                                                             |
| ---------- | ------------------------------------------------------------------------------------- |
| SaaS       | Stackra's public docs site on its Worker; nothing runs in a customer deployment       |
| On-prem    | the same public site; an on-prem customer reads it online or builds it from the repo  |
| Air-gapped | the same site, prerendered: `stackra build` writes static files any web server serves |

## Correctness properties

- **P-001**: The built site is static files only and the Worker runs no script — Validates: FR-001
- **P-002**: For the same `src/` and `DocsConfig`, gen emits the same file set byte for byte, and each refusal it gave for Mintlify it gives for Fumadocs with the same code — Validates: FR-002
- **P-003**: Every path in the Mintlify sitemap fixture has a prerendered page or a redirect — Validates: FR-003
- **P-004**: Every build holds `llms.txt` and `llms-full.txt` listing every page, and no build of `apps/docs` writes a `docs.json` — Validates: FR-004
- **P-005**: A broken internal link, image or anchor fails `stackra lint`, and an axe violation fails the e2e tier, each naming the page — Validates: FR-005
- **P-006**: A merge touching the docs runs the `cloudflare-workers` provider for `apps/docs`, and a failed smoke step leaves the previous version serving — Validates: FR-006
- **P-007**: After the clean-up change, the repository check finds no `mint` dependency, `mintlify` target or provider, `MINTLIFY_` name or Mintlify workflow outside the ADR texts — Validates: FR-007
- **P-008**: `stackra dev` on a fresh checkout starts the site or exits naming the one command to run, and calls no binary that is not a listed dependency — Validates: FR-008
- **P-009**: Every Mintlify component name the pages use renders through the map, and an unknown capitalised tag fails the build naming the page — Validates: FR-009

## Architecture overview

```text
apps/docs/src/{docs,assets,snippets,config/docs.config.ts}
        │  stackra gen (generateDocsSite → emitDocsSite)
        ▼
apps/docs/.stackra/site/   content/ + meta.json · public/ (assets, llms.txt, llms-full.txt, _redirects)
                           app/ (routes, layout, mdx-components) · vite.config.ts · react-router.config.ts
        │  stackra build → react-router build (prerender every page)
        ▼
apps/docs/.stackra/site/build/client/   static HTML, JS, CSS, search index
        │  stackra lint (link check)  ·  e2e (Playwright + axe)
        ▼
deploy-docs.yml → runway-cloudflare-workers.yml (member apps/docs) → Worker `stackra-docs` → smoke
        │  owner moves docs.stackra.figentra.com from Mintlify to the Worker
        ▼
clean-up change: Mintlify removed from core
```

## Components and responsibilities

- **`emitDocsSite` (gen, core)**: keeps its checks and refusals; its output changes from `docs.json` plus pages to the
  Fumadocs content tree, `meta.json` files, `llms.txt`, `llms-full.txt`, `_redirects` and the site shell from
  templates. Pure and deterministic as today.
- **Site templates (gen)**: the React Router root, the docs layout, the page route, the search route, `vite.config.ts`,
  `react-router.config.ts`, `source.config.ts`, and `mdx-components.tsx` with the Mintlify-name map (research R7).
  Kept as template files in `packages/developer/gen/src/core/templates/docs-site/`, rendered with the config's values.
- **`DocsConfig` (gen)**: `theme` removed, `redirects` added, `raw` now for Fumadocs options (data-model.md).
- **`generateDocsSite` and `watchDocsSite` (gen, node)**: unchanged roles; they write the new file set and copy assets.
- **`resolveTool` and `toolCommand` (cli)**: for the `docs` layout, `dev` runs `react-router dev`, `build` runs
  `react-router build`, `lint` runs the new link check; Mintlify branches go.
- **Link check (cli)**: a function over `build/client/` that lists every internal `href`, `src` and `#anchor` with no
  target, by page.
- **Runway (runway)**: the `docs` destination accepts `cloudflare-workers`; the dev destination `vite-dev` covers a docs
  member; `runDeploy` routes `apps/docs` to `deploy-docs.yml`. The `mintlify` provider follows the approver's answer.
- **Repo check (repo-checks)**: `mint` joins `FORBIDDEN_DEPENDENCIES`; a check refuses a `mintlify` target or a
  `MINTLIFY_` name outside `apps/docs/src/docs/adr/`.

## Files and folders

- `packages/developer/gen/src/core/functions/emit-docs-site.function.ts` and its test; new
  `src/core/templates/docs-site/**`; `src/core/bases/docs-config.base.ts`; `src/core/types/docs-site.type.ts`;
  `src/node/functions/{generate,generate-docs-site,watch-docs-site}.function.ts` and tests; a changeset.
- `packages/developer/cli/src/node/functions/{resolve-tool,tool-command}.function.ts`, a new
  `src/node/functions/check-docs-links.function.ts`, `src/node/types/member.type.ts`,
  `src/node/runway-deploy/functions/run-runway-deploy.function.ts`, their tests; a changeset.
- `packages/developer/runway/src/**` (destination, options schema, workflow dispatches; the provider per the approver);
  the manifest; a changeset.
- `packages/developer/repo-checks/src/node/constants/{forbidden-dependencies,member-root,must-stay-json}.constant.ts` and
  a new check with its test; a changeset.
- `apps/docs/`: `package.json` (Fumadocs, React Router, Vite, Tailwind; `mint` out; `test:e2e`), new `wrangler.jsonc`,
  `runway.yaml`, `stackra.config.ts`, `src/config/docs.config.ts`, `README.md`, `AGENTS.md`, new
  `playwright.config.ts`, `e2e/__tests__/{a11y,sitemap}.e2e.test.ts`, `e2e/fixtures/mintlify-sitemap.txt`.
- `tools/scaffold/templates/apps/docs/**` to the same shape.
- `.github/workflows/deploy-docs.yml` rewritten as a `runway-cloudflare-workers.yml` caller; `runway-mintlify.yml`
  removed per the approver; `linear-sync.yml`.
- Root: `runway.yaml`, `pnpm-workspace.yaml`, `knip.jsonc`, `cspell.config.yaml`, `osv-scanner.toml`,
  `.markdownlint.yaml`, `.vscode/settings.json`, `.claude/settings.json`, `.agents/hooks/_rules.mjs` and its test,
  `.agents/hooks/session-context.mjs`, `tools/scripts/{linear,bot-token,agents-sync}.mjs` and tests.

## Data models and migrations

None (no database). The build inputs and outputs are in `data-model.md`.

## Contracts

`contracts/docs-site.md`: the public URLs, `DocsConfig`'s change and the new refusal codes, the `stackra` commands for a
docs member, and the runway entries. No action, query or event.

## Error handling

- Gen refuses with codes and fixes (ADR 0294 decision 22), the existing eight plus `docs_redirect_shadows_page`,
  `docs_redirect_target_missing` and `docs_component_unknown`. A refusal writes nothing.
- `stackra lint` exits 1 with each broken link by page; the e2e tier fails with each axe violation by page.
- A missing `@stackra/cli` build or site dependency exits with the one command to run (FR-008).
- A failed smoke test leaves the previous Worker version serving (EC-03); the owner can promote a recorded SHA.

## Security and tenancy

No permission, tenant data or personal data. The Worker is assets only, with no `workers.dev` URL and no preview URLs
(the `public-site` preset). Secrets by name: `CLOUDFLARE_API_TOKEN` (existing, `/ci`, over OIDC); `MINTLIFY_ADMIN_KEY`
stops being read, and the owner may retire it after the clean-up change.

## Testing strategy

| Proves                       | Tier                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| P-002, P-004, P-009 (AC-002) | unit: `emit-docs-site` over fixtures (file set, refusals, map, llms files)                   |
| P-003 (AC-001)               | unit: fixture paths against the emitted route list and `_redirects`                          |
| P-005 (AC-003)               | unit: the link check over a small built fixture; e2e: axe over the built site                |
| P-008                        | unit: `resolveTool` and `toolCommand` for the docs layout                                    |
| P-006 (AC-004)               | the provider's smoke step on the first deploys (manual record, SC-003)                       |
| P-001                        | unit: the emitted `wrangler.jsonc` and build carry no `main` script                          |
| P-007 (AC-005)               | unit: the new repo check over fixture trees                                                  |
| SC-001, SC-002               | e2e: the crawl of the sitemap fixture and the `llms.txt` fetch, before and after the cutover |

Fixtures: a small docs tree under `packages/developer/gen/src/core/functions/__tests__/fixtures/`, and the Mintlify
sitemap captured once before the switch.

## Rollout

1. **Packages**: gen, cli, runway and repo-checks changes, released by changesets (the repo-check lands with its rule
   off for core until step 4).
2. **Switch**: `apps/docs` moves to the Fumadocs output in one pull request, which also retires gen's Mintlify output
   (FR-004). `deploy-docs.yml` now deploys the Worker; Mintlify stops receiving deploys and keeps serving its last one.
3. **Cutover**: the owner points docs.stackra.figentra.com at the Worker (the owner's DNS and custom-domain step) and
   switches off the Mintlify project. The crawl and the `llms.txt` check run right after.
4. **Clean-up**: every Mintlify reference goes from core, the repo check turns on, and the catalog drops `mint`.

Release notes: the changesets for gen (breaking for docs members) and cli.

## Delegation and risk plan

- **Claude-only**: the gen emitter and templates (compiler-engineer), the CLI tool routing, the runway and workflow
  changes (infra-engineer, release-operations review), the repo check.
- **Delegable**: rewriting the pages and runbooks that describe Mintlify (docs steward), the scaffold template, the e2e
  tests (test-engineer).
- **Waves**: rollout steps 1 to 4, one pull request each, with the page rewrites alongside step 4.
- **Risk**: R2. The main risks are a URL that changes shape (mitigated by P-003), a gap in `llms.txt` (mitigated by
  the freeze and the before/after check), and products still on the Mintlify provider (below).
- **Budget**: about 4 pull requests and 12 to 16 tasks.

## Open for the approver

1. **The Mintlify provider in `@stackra/runway`.** figentra/pay deploys its docs through it today (pay#27), and the
   per-repo docs wave is frozen. Recommended: core stops using Mintlify in this spec, while the provider and
   `runway-mintlify.yml` stay, marked deprecated, until the last product moves. That narrows FR-007 for the provider
   and its workflow, by an amendment. The other choice is to remove them now, which breaks pay's docs deploy at its
   next bump.
2. **The verification hostname.** Before the cutover the Worker needs a hostname to be checked on. Recommended:
   `docs-next.stackra.figentra.com`, a Custom Domain on the Worker, which is a DNS change and so the owner's to make.
   The other choice is no hostname, with the checks running only after the cutover.

## ADRs

Relies on: 0514 (accepted), 0284, 0289, 0295, 0002 (2026-10-27 amendment), 0165, 0468, and 0519 (accepted; its
renderer may land after this, research R9). It opens no new ADR. If the approver keeps the Mintlify provider for the
products, that is recorded in this spec's Amendments, not in an ADR.

## Docs

`apps/docs/README.md` and `AGENTS.md`; the docs, release and runway runbooks; the agents pages and repository rules
that say Mintlify (the workspace-layout rule and its projections in `AGENTS.md`, the session hook's invariant 5); the
scaffold's docs README.

## Complexity tracking

None.
