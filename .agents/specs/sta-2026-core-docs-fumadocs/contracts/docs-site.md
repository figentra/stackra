# Contract: the Stackra docs site and its tooling

**Spec**: `.agents/specs/sta-2026-core-docs-fumadocs/spec.md` · **Linear**: STA-2026

## Public URLs (docs.stackra.figentra.com)

- Every path in `apps/docs/e2e/fixtures/mintlify-sitemap.txt` answers 200 with the same page, or redirects (301) to
  the page that replaced it.
- `/llms.txt` and `/llms-full.txt` answer 200 with `text/plain` before, during and after the switch.
- An unknown path answers 404 with the site's 404 page.
- `/adr/<id>/` redirects to `/adr/<id>` (no trailing slash).

## `@stackra/gen` (breaking for a docs member; a `minor` changeset while gen is 0.x)

- `DocsConfig`: `theme` removed, `redirects` added, `raw` now holds Fumadocs options (data-model.md).
- `generateDocsSite(root)` writes the Fumadocs site to `.stackra/site/` and returns the same refusal codes as today
  plus `docs_redirect_shadows_page`, `docs_redirect_target_missing` and `docs_component_unknown` (a capitalised tag
  that is neither mapped nor imported).
- `DOCS_SITE_DIR` stays `.stackra/site`.

## `stackra` CLI for a member whose layout is `docs`

| Command         | Runs                                                                                   |
| --------------- | -------------------------------------------------------------------------------------- |
| `stackra dev`   | gen once, then `react-router dev` in `.stackra/site` with gen watching `src/`          |
| `stackra build` | gen, then `react-router build` (prerender) in `.stackra/site`                          |
| `stackra lint`  | gen and build when stale, then the link check over `build/client/`; exit 1 names pages |

An unbuilt `@stackra/cli` or missing site dependency fails with the one command to run (FR-008).

## Runway

- Root `runway.yaml`: `environments.production.destinations.docs: cloudflare-workers`,
  `environments.dev.destinations.docs: vite-dev`, `targets.cloudflare-workers.workflows.docs: deploy-docs.yml`; the
  `mintlify` target and `MINTLIFY_ADMIN_KEY` leave core's runway in the clean-up change.
- `apps/docs/runway.yaml`: names the `public-site` preset; keeps `port` and `domain`.
- `@stackra/runway`'s `mintlify` provider: see plan, "Open for the approver".
