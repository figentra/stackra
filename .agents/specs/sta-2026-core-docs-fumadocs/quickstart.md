# Quickstart: validate the docs move

**Spec**: `.agents/specs/sta-2026-core-docs-fumadocs/spec.md` · **Linear**: STA-2026

Builds and tests run on the testbed (`stackra testbed run`) or in CI, never on the Mac.

## 1. Author loop (User Story 2, FR-008)

1. From a fresh checkout on a box: `pnpm install`, then `pnpm --filter @figentra/docs dev`.
   Expected: the site starts on port 3333, or the command fails naming the one command to run first.
2. Edit `apps/docs/src/docs/index.mdx`. Expected: the page reloads with the change.
3. Add a page under `src/docs/` without listing it in `docs.config.ts`. Expected: gen fails with `docs_page_unlisted`.

## 2. Checks (FR-005, AC-003)

1. `pnpm --filter @figentra/docs lint` on a clean tree. Expected: exit 0.
2. Change a link to `/adr/9999-missing`. Expected: exit 1, naming the page and the link.
3. `pnpm --filter @figentra/docs test:e2e` (axe). Expected: exit 0; an `<img>` without `alt` added to a page fails it,
   naming the page.

## 3. URLs and `llms.txt` (FR-003, FR-004, SC-001)

1. `pnpm --filter @figentra/docs build`. Expected: `build/client/` holds a page for every path in
   `e2e/fixtures/mintlify-sitemap.txt`, or the path is in `_redirects` (the unit test proves it).
2. `build/client/llms.txt` and `llms-full.txt` exist and list every page.

## 4. Deploy (User Story 3, FR-006, AC-004)

1. Merge a docs change. Expected: `deploy-docs.yml` runs `runway-cloudflare-workers.yml` for `apps/docs`, waits on the
   owner's production approval, deploys, and the smoke step passes for `/`, one ADR page, `/llms.txt` and
   `/llms-full.txt`.
2. After the owner's cutover: the crawl of the fixture against docs.stackra.figentra.com answers 200 for every path.

## 5. No Mintlify (FR-007, SC-004)

`stackra validate --repository`. Expected: green; adding `mint` to a `package.json` or a `MINTLIFY_` name outside an
ADR fails it.
