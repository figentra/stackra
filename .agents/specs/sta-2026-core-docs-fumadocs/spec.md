# Feature Specification: Core docs move from Mintlify to Fumadocs

**Feature Branch**: `figentra/sta-2026-core-docs-fumadocs`

**Created**: 2026-11-02

**Status**: Clarified

**Tier**: big

**Approver**: owner

**Linear**: STA-2026

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: ADR 0514 (accepted 2026-11-02): every Figentra docs site is self-hosted Fumadocs on a Cloudflare Worker,
deployed through Runway; Stackra keeps its own site at docs.stackra.figentra.com (decision 9). The leader made this the
prerequisite of STA-2024 (design-system docs on Fumadocs) on 2026-11-02: core's own `apps/docs` moves first, with
`stackra gen` emitting the Fumadocs site and `llms.txt` kept published.

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: apps/docs (the Stackra docs site moves from Mintlify to Fumadocs)
- **Services touched**: none
- **Packages touched**: packages/developer/gen (the docs-site target emits a Fumadocs site instead of a Mintlify one);
  packages/developer/cli (`stackra dev|build|lint` for a docs member); packages/developer/runway (the docs member deploys
  through the Cloudflare Workers provider; the Mintlify provider retires)
- **Public contract change**: breaking for docs members: `DocsConfig` and the docs-site output change from Mintlify's
  `docs.json` to the Fumadocs site; the pages' URLs and `llms.txt`'s URL stay the same
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none (a public static site; the Mintlify admin key is no longer used)
- **Secrets**: none new; `MINTLIFY_ADMIN_KEY` stops being read and the owner may retire it
- **ADR needed**: no (ADR 0514 decided it; this spec carries it out)
- **New dependencies**: the Fumadocs packages and their React Router 7 and Vite peers, at one current pinned version
  (the owner approved the Fumadocs packages); `mint` leaves the catalog
- **Deploy modes**: same in all three (a Stackra-hosted public site)
- **Licence tier**: free (MIT, this repository)
- **UI surfaces**: the docs site: navigation, search, page layout and the ADR index
- **Docs to update**: apps/docs README and AGENTS; the docs, release and runway runbooks; the agents pages and repository
  rules that say "Mintlify"; ADR 0002's superseded note already points at 0514
- **Lane**: full
- **Change risk**: R2 (a site rebuilt on a new framework; a dependency family added and one removed)

## Clarifications

### Session 2026-11-02

- Q: Is this spec a prerequisite of STA-2024 or part of it? → A: A separate prerequisite; STA-2024 builds on it (leader).
- No other critical ambiguity: ADR 0514 decided the framework, hosting, deploy path and the Stackra site's place.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A reader keeps every page and link (Priority: P1)

Someone with a bookmark, a link from an ADR, or the landing's "Copy llms.txt" button reaches the same content after the
move.

**Why this priority**: the move must not break the site anyone relies on.

**Independent Test**: every page URL that answered before the move answers after it with the same content; `llms.txt`
answers at its URL throughout.

**Acceptance Scenarios**:

1. **Given** a page URL from before the move, **When** it is opened after, **Then** the same page answers.
2. **Given** the landing's "Copy llms.txt", **When** it is used during and after the move, **Then** `llms.txt` answers.

---

### User Story 2 - An author edits docs the same way (Priority: P1)

An author writes MDX pages and ADRs where they do now, starts the site locally with one command, and opens a pull request
whose checks catch a broken link or an inaccessible page.

**Why this priority**: authors write docs every day; the move must not slow them.

**Independent Test**: edit a page, start the site, see the change; break a link and see the check fail.

**Acceptance Scenarios**:

1. **Given** a fresh checkout, **When** an author starts the docs site, **Then** it starts, or names exactly the command
   to run first.
2. **Given** a broken link or a page that fails accessibility, **When** the pull request runs its checks, **Then** they
   fail and name the page.

---

### User Story 3 - The site deploys through Runway (Priority: P1)

A merge to main deploys the docs site through Runway to the Cloudflare Worker; nothing deploys to Mintlify.

**Why this priority**: ADR 0514 decision 2.

**Independent Test**: a merge to main produces a Runway deploy of the docs Worker, then a smoke test of its pages.

**Acceptance Scenarios**:

1. **Given** a merged docs change, **When** the deploy runs, **Then** the Worker serves the new page and the smoke test
   passes.

### Edge Cases

- **EC-01**: A Mintlify component name the pages still use (`Note`, `Card`, `CardGroup`, `Tabs`, `Steps`) renders
  through the transitional mapping of ADR 0514 decision 10 until the page is rewritten.
- **EC-02**: A page that Mintlify served under a URL the new site would change keeps its URL, or redirects to the new one.
- **EC-03**: The deploy fails its smoke test: the previous version keeps serving.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: THE Stackra docs site SHALL be built with Fumadocs and served as static files by a Cloudflare Worker
  (ADR 0514 decisions 1 and 9).
- **FR-002**: WHEN `stackra gen` runs for a docs member THE generator SHALL emit the Fumadocs site from the authored pages
  and the docs config, as it emits the Mintlify site today, with the same refusals for a misplaced or unlisted page.
- **FR-003**: THE site SHALL keep every page URL it had, or redirect it.
- **FR-004**: WHILE the docs move THE site SHALL keep serving `llms.txt` and `llms-full.txt` at the same URL with no gap;
  the change that switches to Fumadocs' output SHALL retire gen's Mintlify emitter in the same change.
- **FR-005**: WHEN a pull request touches the docs THE checks SHALL fail on a broken link or an accessibility failure,
  as `mint broken-links` and `mint a11y` do today.
- **FR-006**: WHEN a docs change merges to main THE docs member SHALL deploy through Runway's Cloudflare Workers provider,
  then pass a smoke test of its pages (ADR 0514 decision 2, 0299's checks carried over).
- **FR-007**: WHEN the move is complete THE repository SHALL hold no Mintlify: no `mint` dependency, Mintlify provider,
  deploy branch, `MINTLIFY_*` reference or "Mintlify Deployment" check.
- **FR-008**: WHEN a developer starts the docs site from a fresh checkout THE start SHALL succeed, or name exactly the
  command to run first, and SHALL NOT call a tool that is not a listed dependency.
- **FR-009**: THE pages that use Mintlify component names SHALL render through the transitional mapping until rewritten.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN the move lands THE pages from before SHALL answer at their URLs.
- **AC-002**: THE `llms.txt` URL SHALL answer before, during and after the switch.
- **AC-003**: IF a page has a broken link THEN THE pull request check SHALL fail.
- **AC-004**: WHEN a docs change merges THE Runway deploy SHALL publish it and the smoke test SHALL pass.
- **AC-005**: WHEN the move is complete THE repository SHALL contain no Mintlify reference.

## Success Criteria _(mandatory)_

- **SC-001**: 100% of the URLs the Mintlify site served answer after the move — verified by: e2e (a crawl of the old
  sitemap)
- **SC-002**: `llms.txt` answers on every check during the switch — verified by: e2e (smoke test before and after)
- **SC-003**: a docs change reaches the live site within one deploy of its merge — verified by: manual (the first
  deploys)
- **SC-004**: zero Mintlify references remain — verified by: unit (a repo-check)

## Out of scope

- The design-system pages, the theme switcher and the AI-first features (STA-2024 builds them on this site).
- The product docs hub at docs.figentra.com and the product docs packages (ADR 0514's own waves).
- Rewriting pages into Fumadocs components beyond what renders through the transitional mapping.

## Assumptions

- Fumadocs runs on Vite with React Router 7, prerendered to static files (ADR 0514 decision 1, citing 0165 and 0227).
- Runway's Cloudflare Workers provider (STA-1921, merged) deploys the site as a `docs` destination member.
- The owner points docs.stackra.figentra.com at the Worker (DNS is the owner's).

## Amendments

None.

## Status history

- 2026-11-02 · — → Draft · claude (STA-1920 session) · created as the prerequisite of STA-2024 (leader, 2026-11-02)
- 2026-11-02 · Draft → Clarified · claude (STA-1920 session) · no open question; scope set by the leader
