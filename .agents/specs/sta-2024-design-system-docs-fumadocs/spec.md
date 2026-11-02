# Feature Specification: Design-system documentation on Fumadocs, AI-first

**Feature Branch**: `figentra/sta-2024-design-system-docs-fumadocs`

**Created**: 2026-11-02

**Status**: Clarified — Approved by owner 2026-11-02

**Tier**: big

**Approver**: owner

**Linear**: STA-2024

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: User description: the owner's decisions of 2026-11-02, relayed by the leader. Design-system documentation
moves to Fumadocs ("Instead of building our own playground, we can have a home page or a landing page, but the whole
documentation should run via the same docs we use for everything: Fumadocs. Remove all docs from our design system and
implement Fumadocs with MDX." Then, on the plan: "Yes, do it"). The docs are AI-first (owner, "Yes"): `llms.txt` and
`llms-full.txt`, page actions for assistants, Ask AI search, and docs over the developer MCP.

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: apps/docs (the Stackra docs site gains the design-system section and the AI features); apps/playground
  (retired after parity); apps/mobile unchanged (stays the native preview)
- **Services touched**: none in this repository. Ask AI depends on the OS `ai` service (Tamo's gateway, figentra/os),
  which serves a public read-only docs endpoint; it runs in no cloud environment yet
- **Packages touched**: packages/design-system/ui (the brand-theme contrast and matrix tests move in); the package that
  owns the catalogue records and showcase JSON (read as the source of the generated pages); the developer MCP
  (`stackra mcp`, ADR 0282) for the docs tools. The Stackra site's own move from Mintlify to Fumadocs is the
  prerequisite STA-2026, which this spec builds on
- **Public contract change**: additive (docs tools and resources on the developer MCP; the generated `.md` routes,
  `llms.txt` and `llms-full.txt`)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: the docs are public. Ask AI is an unauthenticated, rate-limited, read-only path through Tamo's
  gateway that answers only from the docs corpus, with citations, and never reaches tenant data or tools; a question is
  not kept beyond what the gateway's own logs and cost controls need. The MCP docs tools are local and read-only.
- **Secrets**: none on the docs site or its Worker (owner: no direct third-party provider and no new key there); the
  gateway's own model credentials stay in the OS `ai` service
- **ADR needed**: yes: Fumadocs is the only home of design-system docs (amends 0302 and 0320, extends 0514); the
  playground is retired after parity; Base UI under the Fumadocs chrome with `--color-fd-*` mapped to `@stackra/tokens`;
  the AI-first requirements
- **New dependencies**: the Fumadocs packages (approved by the owner's Fumadocs decision, one current pinned version);
  any other addition goes to the owner through the leader
- **Deploy modes**: the docs site is hosted by Stackra only (a Cloudflare Worker through Runway, ADR 0514); the MCP docs
  tools read the docs shipped with the developer tooling, so they work offline
- **Licence tier**: free (MIT, this repository)
- **UI surfaces**: the docs header (one theme switcher), one page per design-system component, the Theme Studio page, the
  Glass stage page, page actions (Copy as Markdown, Open in Claude and other assistants), Ask AI search
- **Docs to update**: the design-system pages and guides in apps/docs; the playground's README and runbook references;
  the agents pages that name the playground
- **Lane**: full
- **Change risk**: R2 (a new dependency family, an app retired, an additive public contract)

## Clarifications

### Session 2026-11-02

- Q: Is moving the Stackra docs site itself from Mintlify to Fumadocs inside this spec, or a prerequisite? → A: A
  separate prerequisite spec, STA-2026; this spec builds on it and is blocked by it (leader).
- Q: Which provider answers Ask AI, and where does it run? → A: "ship all + tamo" (owner): all five AI-first items ship,
  and Ask AI runs on Tamo's gateway in the OS `ai` service from the start, through a public, unauthenticated,
  rate-limited, read-only path that answers only from the docs corpus with citations and never reaches tenant data or
  tools; its index lives with the gateway and is refreshed on each docs deploy; a credit budget caps its cost; no direct
  third-party provider and no key on the docs Worker; "coming soon" until the gateway endpoint is live (FR-017 to
  FR-020, AC-010, AC-011).

## Glossary _(full lane)_

- **Catalogue record**: the design-system catalogue's entry for one component: its name, package, category, status and
  description.
- **Showcase JSON**: the per-component file the UI work ships with each component: its demos, props and usage notes.
  It is the source of a generated page; the UI components session keeps shipping it.
- **Generated page**: a docs page built from a catalogue record and its showcase JSON; nobody edits it by hand.
- **Theme switcher**: the one control in the docs header that chooses the theme every preview on the page renders in.
- **Parity checklist**: the table that maps every playground route to its new home, required before the playground is
  deleted.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A developer finds and tries any component in the docs (Priority: P1)

A developer building with Stackra opens the design-system section, finds a component, sees it live, reads its props,
usage and accessibility notes, and copies an example.

**Why this priority**: it is the job the playground did; until the docs do it, the playground cannot go.

**Independent Test**: open the page of any component in the catalogue; it shows a live preview, a props table, usage and
accessibility notes, all matching the component's showcase JSON.

**Acceptance Scenarios**:

1. **Given** a component with a catalogue record and showcase JSON, **When** the site is built, **Then** it has one page
   for that component with live previews of every demo, a props table, usage and accessibility notes.
2. **Given** a component's showcase JSON changes, **When** the site is rebuilt, **Then** its page changes with it and no
   hand-written page needs editing.

---

### User Story 2 - A designer previews components in every theme (Priority: P1)

A designer switches the theme once in the docs header and every preview on every page renders in it, including the
Stackra theme (steel with the champagne core) and Glass.

**Why this priority**: the playground's theme preview is the other job it did.

**Independent Test**: choose each theme in the header; every preview on the page re-renders in that theme.

**Acceptance Scenarios**:

1. **Given** a component page, **When** the reader picks a theme in the header, **Then** every preview on the page shows
   that theme, and the choice holds while they move between pages.
2. **Given** the Theme Studio page, **When** the reader changes a theme value, **Then** the previews follow, as the
   playground's Theme Studio did.

---

### User Story 3 - An AI assistant reads the docs (Priority: P1)

A developer's assistant reads the Stackra docs: it fetches `llms.txt`, a page as Markdown, or asks the local developer
MCP to search and read the docs and the API.

**Why this priority**: the owner made the docs AI-first.

**Independent Test**: fetch `llms.txt`, `llms-full.txt` and one page's `.md` route; call the MCP docs tools from an
agent and get a page back.

**Acceptance Scenarios**:

1. **Given** the built site, **When** an assistant fetches `llms.txt`, **Then** it lists every page, generated component
   pages included, and `llms-full.txt` holds their full text.
2. **Given** any page, **When** the reader uses "Copy as Markdown" or "Open in Claude", **Then** the page's Markdown is
   copied or handed to that assistant.
3. **Given** the developer MCP is running, **When** an agent searches the docs, **Then** it gets matching pages and can
   read one in full.

---

### User Story 4 - A reader asks the docs a question (Priority: P2)

A reader types a question in the search and gets an answer drawn from the docs, with links to the pages it used.

**Why this priority**: valuable, but it depends on the provider decision below.

**Independent Test**: ask a question whose answer is on one page; the answer links that page.

**Acceptance Scenarios**:

1. **Given** Ask AI search, **When** a reader asks a question the docs answer, **Then** the reply cites the pages it used.

---

### User Story 5 - The playground is retired without losing anything (Priority: P2)

The team deletes `apps/playground` once every route it had has a new home, and the docs site starts from a clean checkout.

**Why this priority**: it is the last step, gated by parity.

**Independent Test**: the parity checklist maps every playground route to a docs page, a test or an explicit removal,
and a fresh checkout starts the docs site with the documented command.

**Acceptance Scenarios**:

1. **Given** the parity checklist is complete, **When** the playground is deleted, **Then** no route is left without a
   home and the brand-theme contrast and matrix tests still run, now in `@stackra/ui`.
2. **Given** a fresh checkout, **When** a developer starts the docs site, **Then** it starts, or names exactly what to
   run first.

### Edge Cases

- **EC-01**: A component has a catalogue record but no showcase JSON: its page still builds, with the record's text and
  a visible note that no demos exist yet; the build reports it.
- **EC-02**: A showcase demo fails to render: that preview shows an error state, the rest of the page renders, and the
  build reports the component.
- **EC-03**: A theme is not available yet (the Stackra theme before its tokens land): the switcher leaves it out until
  the tokens exist.
- **EC-04**: The brand kit or the registry is unreachable during a local start: the site starts without the brand
  assets and says how to get them.
- **EC-05**: Ask AI cannot answer from the docs: it says so, and does not answer from outside them.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: THE docs site SHALL be the only home of design-system documentation; no design-system package keeps its
  own docs pages.
- **FR-002**: WHEN the site is built THE build SHALL generate one page per design-system component that has a catalogue
  record, from that record and the component's showcase JSON, with live previews, a props table, usage and accessibility
  notes.
- **FR-003**: THE generated pages SHALL NOT be edited by hand; a check SHALL fail when a generated page differs from what
  the build would produce.
- **FR-004**: THE docs header SHALL hold one theme switcher whose choice every preview on every page follows, offering
  every theme the token package defines, Glass included, and the Stackra theme once its tokens exist.
- **FR-005**: THE docs chrome SHALL take its colours from the design tokens: the primary colour from `--core-strong`, its
  foreground from `--core-foreground`, large display headings from `--core`, focus rings and links from
  `--accent`/`--focus`, and the rest from the background, surface, border and muted tokens.
- **FR-006**: THE site SHALL have a Theme Studio page and a Glass stage page that do what the playground's did.
- **FR-007**: THE brand-theme contrast and matrix tests SHALL run as `@stackra/ui`'s own tests.
- **FR-008**: THE site SHALL publish `llms.txt` and `llms-full.txt` covering every page, generated ones included.
- **FR-016**: WHILE the docs move from Mintlify to Fumadocs THE site SHALL keep serving `llms.txt` and `llms-full.txt` at
  the same stable URL, with no gap (the landing's "Copy llms.txt" links to it): the change that replaces `stackra gen`'s
  docs-site emitter with Fumadocs' own output retires the emitter in the same change, and the ADR names the URL.
- **FR-009**: THE site SHALL offer, on every page, "Copy as Markdown", "Open in Claude" (and the other assistants the
  docs framework offers) and a raw `.md` route.
- **FR-010**: WHERE Ask AI search is enabled THE search SHALL answer only from the docs and cite the pages it used.
- **FR-017**: THE Ask AI search SHALL be answered by Tamo's gateway (the OS `ai` service) through a public, unauthenticated,
  read-only path that is rate-limited per visitor, answers only from the docs corpus, and never reaches tenant data or
  tools; the docs site holds no model key (owner, 2026-11-02: "ship all + tamo").
- **FR-018**: WHEN the docs deploy THE docs corpus index that Ask AI answers from SHALL be rebuilt from the same pages,
  so an answer never cites a page the site no longer has.
- **FR-019**: THE Ask AI path SHALL stop answering when its credit budget for the period is spent, and say so.
- **FR-020**: WHILE the gateway's docs endpoint is not live THE docs SHALL show Ask AI in a "coming soon" state that
  sends nothing, and every other AI-first feature SHALL work without it.
- **FR-011**: THE developer MCP SHALL expose the docs as search and read tools and resources beside the `stackra`
  commands, in the tool shape agreed with the owner of `toolsOf`.
- **FR-012**: THE docs site SHALL share the landing's header, theme and token mapping.
- **FR-013**: WHEN a developer starts the docs site from a fresh checkout THE start SHALL succeed, or name exactly the
  command to run first; it SHALL NOT call a tool that is not a listed dependency.
- **FR-014**: WHEN the parity checklist maps every playground route to a new home THE playground SHALL be deleted in its
  own change, with the checklist in that change's description.
- **FR-015**: THE native preview SHALL stay in the mobile app; this spec SHALL NOT change it.

### Key Entities

- **Catalogue record**: a component's name, package, category, status and description.
- **Showcase JSON**: a component's demos, props and usage notes.
- **Generated page**: a component page derived from the two above.
- **Parity checklist**: playground route, new home (page, test or removal), and its status.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN the site is built THE build SHALL produce one page per catalogued design-system component.
- **AC-002**: IF a generated page was edited by hand THEN THE check SHALL fail.
- **AC-003**: WHEN a reader picks a theme THE previews on the page SHALL re-render in it.
- **AC-004**: THE site SHALL serve `llms.txt`, `llms-full.txt` and a `.md` route for every page.
- **AC-005**: WHEN an agent calls the MCP docs search THE tool SHALL return matching pages that the read tool can open.
- **AC-006**: IF Ask AI has no answer in the docs THEN THE search SHALL say so.
- **AC-007**: WHEN the playground is deleted THE change SHALL carry a complete parity checklist.
- **AC-008**: WHEN a fresh checkout starts the docs site THE start SHALL succeed or name the command to run first.
- **AC-009**: WHEN the change that switches `llms.txt` to Fumadocs lands THE URL SHALL answer before and after it.
- **AC-010**: IF a visitor exceeds the Ask AI rate limit or the budget is spent THEN THE search SHALL refuse with a clear
  message and send nothing to the model.
- **AC-011**: WHILE the gateway endpoint is not live THE Ask AI control SHALL show "coming soon" and make no request.

## Success Criteria _(mandatory)_

- **SC-001**: 100% of catalogued design-system components have a generated page with at least one live preview —
  verified by: unit (the build's page count against the catalogue)
- **SC-002**: every page renders in every offered theme with no failed preview — verified by: e2e
- **SC-003**: `llms.txt` lists 100% of the site's pages, and every page has a working `.md` route — verified by: e2e
- **SC-004**: an agent finds a component's page through the MCP docs search on the first query by its name — verified by:
  unit
- **SC-005**: every playground route appears in the parity checklist with a home before deletion — verified by: manual
  (the checklist in the PR)
- **SC-006**: a fresh checkout starts the docs site in one documented step — verified by: manual on a testbed box

## Out of scope

- The native preview (stays in the mobile app).
- The product docs hub at docs.figentra.com and the product docs packages (ADR 0514's own waves).
- New components or new showcase demos (the UI components session keeps shipping showcase JSON).
- The landing page itself (the rebrand session's work); this spec only shares its header, theme and token mapping.

## Assumptions

- The docs site is Fumadocs on Vite with React Router 7, prerendered to static files and served by a Cloudflare Worker
  deployed through Runway (ADR 0514 decisions 1 and 2), and the Stackra site stays its own site (decision 9).
- Fumadocs' Base UI chrome is accepted with its colours mapped to `@stackra/tokens` (owner, 2026-11-02, landing Q6).
- The Stackra theme's `--core*` tokens arrive with the rebrand session's core PR (C1); until then the mapping is written
  against their names.
- Fumadocs provides `llms.txt` generation and the page actions; where it does not, the build adds them.
- Ask AI runs on Tamo's gateway in the OS `ai` service (owner, 2026-11-02). The gateway-side endpoint, its index store
  and its budget are agreed with the OS backend through the leader; the index lives with the gateway and is refreshed
  by each docs deploy.
- The MCP tool shape is agreed with console-engine-d0, which owns `toolsOf`, through the leader. Today `stackra mcp`
  serves manifest, new, gen, validate, verify and `encore_*` and no docs; the docs tools are new work.
- Today `llms.txt` is written by `stackra gen`'s docs-site emitter for the Mintlify site, and the landing links to it.

## Amendments

None.

## Status history

- 2026-11-02 · — → Draft · claude (STA-1920 session) · created from the owner's decisions of 2026-11-02
- 2026-11-02 · Draft → Clarified · claude (STA-1920 session) · Q1 answered by the leader; Q2 by the owner ("ship all +
  tamo") — Approved by owner 2026-11-02
