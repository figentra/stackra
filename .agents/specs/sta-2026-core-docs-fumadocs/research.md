# Research: Core docs move from Mintlify to Fumadocs

**Spec**: `.agents/specs/sta-2026-core-docs-fumadocs/spec.md` · **Linear**: STA-2026 · **Date**: 2026-11-02

Facts read from main at the merge of 2026-11-02 (after ADR 0519). Each item: decision, rationale, alternatives.

## R1. Where the site code lives

- **Decision**: gen writes the whole Fumadocs site into `apps/docs/.stackra/site/`: the content tree, the React Router
  config, the Vite config, the routes, the layout and the MDX component map. `apps/docs` keeps only what it has today:
  pages in `src/docs/`, `src/assets/`, `src/snippets/`, `src/config/docs.config.ts`, plus an optional
  `src/components/` for MDX components a page imports (STA-2024 uses it for live previews).
- **Rationale**: ADR 0295 says nobody writes `main.ts` or a tool config; gen already assembles the Mintlify root there
  (ADR 0002, 2026-10-27 amendment), so authors see no new layout (User Story 2). Flow's site and the hub can get the
  same shell from the same emitter later.
- **Alternatives**: a hand-written React Router app in `apps/docs/src/` (rejected: it is the tool config ADR 0295 says
  gen writes, and each docs site would copy it); a shared runtime package for the shell (deferred: one consumer today;
  the hub can ask for it in its own wave).

## R2. Framework wiring

- **Decision**: `fumadocs-mdx` as the Vite plugin over the emitted `content/` folder, `fumadocs-core` for the source
  loader, the page tree, search and the llms helpers, `fumadocs-ui` for the layout; React Router 7 framework mode with
  `prerender` listing every page path, so `react-router build` writes static HTML to `build/client/`. No server
  function ships: the Worker is assets only, like `workers/static`.
- **Rationale**: ADR 0514 decision 1 (Vite and React Router 7, prerendered; Next.js rejected by 0165). React Router,
  React, Vite, Tailwind and their plugins are already in the catalog (`react-router` and `@react-router/dev` 7.18.4,
  `vite` 8.3.3, `@vitejs/plugin-react` 6.1.1, `tailwindcss` and `@tailwindcss/vite` 4.3.3, `react` 19.3.0).
- **Versions**: the three Fumadocs packages are the only catalog additions; the owner approved them. They are pinned
  exactly at the newest release that supports the catalog's React Router, React and Vite on the day of the install
  task, with a changeset. `mint` and its overrides (`is-online` and the two pingers) leave the catalog in the clean-up
  change.
- **Alternatives**: Astro Starlight (rejected by 0514); a Worker that renders on request (rejected: prerendered static
  needs no runtime and matches 0284).

## R3. Navigation

- **Decision**: `DocsConfig` stays the one source of navigation. Gen renders it to one Fumadocs `meta.json` per folder
  in the emitted `content/` (tabs become root folders marked `root: true`, groups become separators, `{ folder }`
  entries expand as today). Every refusal gen has today stays, with the same codes: `docs_source_misplaced`,
  `docs_page_outside`, `docs_page_missing`, `docs_page_unlisted`, `docs_asset_missing`, `docs_asset_unreferenced`,
  `docs_owned_key`, `docs_service_unknown`.
- **Rationale**: FR-002 (same refusals); the ADR index and the folder entry keep working; authors write no `meta.json`.
- **Change to `DocsConfig`**: `theme` goes (it named a Mintlify theme); `raw` now passes the Fumadocs layout options gen
  does not own (the escape hatch of ADR 0295 decision 4, for the new tool); `redirects` is added (R4). Breaking for a
  docs member, as the spec's Impact says; the scaffold template follows.
- **Alternatives**: authored `meta.json` (that is the product docs package shape of 0514 decision 10; core keeps its
  typed config because gen checks it).

## R4. URLs and redirects

- **Decision**: page ids map to the same paths Mintlify served (`src/docs/adr/0001-x.mdx` → `/adr/0001-x`,
  `index` → its folder). The prerender writes `adr/0001-x/index.html`; the Worker's assets use
  `html_handling: "drop-trailing-slash"` so `/adr/0001-x` answers with no redirect and `/adr/0001-x/` redirects to it.
  A `redirects` list in `DocsConfig` (empty today) covers a URL that must move; gen emits it as Cloudflare `_redirects`.
- **Proof**: before the switch, the build task saves the live Mintlify `sitemap.xml` as a fixture
  (`apps/docs/e2e/fixtures/mintlify-sitemap.txt`, one path per line). A test fails when a fixture path has neither a
  prerendered page nor a redirect (SC-001), and the post-deploy crawl checks that each one answers 200.
- **Alternatives**: `auto-trailing-slash` (rejected: every bookmark without a slash would redirect).

## R5. `llms.txt`, `llms-full.txt` and the no-gap switch

- **Decision**: gen emits both files into the site's public folder from the same pages, so they ship with each build.
  The change that switches `apps/docs` to the Fumadocs output removes `emitDocsSite`'s Mintlify output (`docs.json`)
  in the same pull request (FR-004).
- **No gap**: Mintlify keeps serving its last deploy, `llms.txt` included, until the owner moves
  docs.stackra.figentra.com to the Worker. Between that merge and the cutover the Mintlify site does not change (a
  content freeze of hours, not days), and the Worker already serves the same paths on its verification hostname. The
  smoke test fetches `llms.txt` on the old site before the cutover and on the Worker after it (SC-002).

## R6. Search

- **Decision**: Fumadocs' built-in Orama search, exported as a static index at build time and searched in the browser.
- **Rationale**: no third party and no runtime. Ask AI is STA-2024's, on Tamo's gateway (ADR 0521 decision 10).

## R7. Mintlify components in pages (EC-01, FR-009)

- **Usage today** (580 pages): `Note` 1,129, `Step` 149, `Steps` 29, `Card` 12, `Warning` 10, `Accordion` 5, `Tip` 3,
  `CardGroup` 3, `Tab` 2, `AccordionGroup` 2, `Tabs` 1, `Info` 1, `Frame` 1, `CodeGroup` 1. Two pages import a snippet.
- **Decision**: gen emits a component map that renders each name with the Fumadocs component that does the same job
  (`Note`, `Info`, `Tip`, `Warning` → `Callout` with its type; `Card`/`CardGroup` → `Card`/`Cards`; `Tabs`/`Tab` →
  `Tabs`/`Tab`; `Steps`/`Step` → `Steps`/`Step`; `Accordion`/`AccordionGroup` → `Accordion`/`Accordions`; `Frame` → a
  figure; `CodeGroup` → tabs of code blocks). An unknown capitalised tag fails the build and names the page.

## R8. Checks that replace `mint broken-links` and `mint a11y` (FR-005)

- **Links**: `stackra lint` for a docs member reads the prerendered `build/client/` and fails on an internal link,
  image or anchor with no target, naming the page. It is code in `@stackra/cli`, with no new dependency.
- **Accessibility**: Playwright with `@axe-core/playwright` (both already in the catalog) over the prerendered site, in
  `apps/docs/e2e/__tests__/*.e2e.test.ts` as `apps/playground` does it; WCAG 2.2 AA, failing on any violation and
  naming the page. CI runs it on every page.

## R9. Deploy (FR-006)

- **Decision**: `apps/docs` gets a `wrangler.jsonc` with its code facts only (ADR 0519 decision 1): `name`
  `stackra-docs`, `assets.directory` `./.stackra/site/build/client`, `not_found_handling` `404-page`,
  `html_handling` `drop-trailing-slash`. The root `runway.yaml` sends the `docs` destination to `cloudflare-workers`
  in production and `vite-dev` in dev, lists `docs: deploy-docs.yml` under `targets.cloudflare-workers.workflows`, and
  names the `public-site` preset. `deploy-docs.yml` becomes a thin caller of `runway-cloudflare-workers.yml`
  (member `apps/docs`, package `@figentra/docs`), keeping the owner's production approval (ADR 0468).
- **If 0519's renderer has not shipped** when this lands, the operational keys sit in `wrangler.jsonc` as
  `workers/static` has them today (ADR 0284 decision 8 carve-out), and move out when the renderer lands.
- **Smoke**: the provider's smoke step fetches `/`, one ADR page, `/llms.txt` and `/llms-full.txt`. A failure keeps the
  previous version serving (EC-03), since the provider moves traffic only to a version that passed.

## R10. Removing Mintlify (FR-007, SC-004)

Every file that names Mintlify, from a grep of main:

- `apps/docs`: `package.json`, `runway.yaml`, `stackra.config.ts`, `src/config/docs.config.ts`,
  `scripts/system-map/render-system-map.ts`; the scaffold template `tools/scaffold/templates/apps/docs/*`.
- `packages/developer/gen`: `emit-docs-site`, `generate-docs-site`, `watch-docs-site`, `generate`, `docs-config.base`,
  `docs-site.type`, `docs-site-dir.constant`.
- `packages/developer/cli`: `resolve-tool`, `tool-command`, `run-runway-deploy`, `member.type`.
- `packages/developer/runway`: `mintlify-provider.driver`, the config schema's `mintlifyProjectDir`,
  `runway-options.schema`, `workflow-dispatches`, `index`, the manifest and the tests.
- `packages/developer/repo-checks`: `member-root`, `must-stay-json`.
- Workflows `deploy-docs.yml`, `runway-mintlify.yml`, `linear-sync.yml`; `runway.yaml`, `pnpm-workspace.yaml`,
  `knip.jsonc`, `cspell.config.yaml`, `osv-scanner.toml`, `.markdownlint.yaml`, `.vscode/settings.json`,
  `.claude/settings.json`, `.agents/hooks/_rules.mjs` and its test, `.agents/hooks/session-context.mjs`,
  `tools/scripts/{linear,bot-token,agents-sync}.mjs` and their tests.
- The docs pages that describe Mintlify as current. ADR texts keep their history.

**Products still on Mintlify**: figentra/pay deploys its docs through `runway-mintlify.yml` and the `mintlify` target of
`@stackra/runway` (pay#27), and the per-repo wave is frozen (owner, 2026-11-02). Removing the provider from
`@stackra/runway` would break pay's runway file at its next bump. The owner chose removal now (2026-11-02; plan, "Approver's answers").

## R11. Fresh-checkout start (FR-008)

`stackra dev` for a docs member runs gen once, then `react-router dev` in `.stackra/site` with gen watching `src/`.
It needs only `@stackra/cli` built; when its `dist` is missing it fails with the one command to run
(`pnpm turbo run build --filter=@figentra/docs^...`). No `predev` calls a tool that is not a listed dependency.
