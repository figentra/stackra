<!--
Stackra file contract:
Purpose: the seed experience document of Stackra's own landing site (stackra.figentra.com), the page that follows one
         action, order.cancel, from the class to every surface (STA-2041).
Boundary: seeds only. Runway imports them once into experience; after that, pages are edited in the experience
          builder, not here. Words live in the document's props, one LocalizedText per human string; code, file names,
          commands and the mono display's title are never translated.
Runtime: none (read by Runway's landing import and `stackra dev`)
Governing contract: ADR 0440 (landing documents), ADR 0441 decision 1; ADR 0024 (MIT, marks excluded); ADR 0515
                    (`stackra create`)
-->

# assets/landing

One JSON experience document per page (`<page>.json`, a list of `{ id, block, props, children? }` nodes, its text per
locale inside each block). `index.json` is the home page.

**PROPOSED: copy needs the owner's sign-off; brief Q7 (contributors as people only, or with bots) is the owner's.**
The Arabic is a transcreated draft for the native reviewer. Until both are signed off, nothing here ships.

## The page, top to bottom

Each node's `block` is the key gen's rule gives its class, `<member>.<snake(folder)>` (ADR 0294 decision 20): the
landing blocks are `@stackra/experience`'s, in `src/core/blocks/<name>/`, so `experience.hero_machine` and so on.
Nothing registers these keys yet (see "Held for the owner"), so this document does not resolve today.

| Node | Block | What it holds |
| --- | --- | --- |
| `header` | `experience.site_header` | Docs, Decisions, Packages, Runway, named "Site"; docs search, GitHub. No Ask AI link while it is coming soon |
| `hero` | `experience.hero_machine` | "One backend, every surface." (plain, no accent word), the CTA row, the machine (named "One action, every surface": `cancel-order.action.ts` piped into web, desktop and the Arabic phone), the engine art, the strata horizon |
| `statement` | `experience.statement` | The boilerplate with steel keywords (`*…*`) |
| `follow` | `experience.chapter_title` | "Follow one action." |
| `write` … `ship` | `experience.station` | Write, Expose, Call, Draw, Delegate, Ship: each shows `order.cancel` transformed. Draw's one child is an `experience.surfaces` (the Cancel order button on web, desktop and phone, the phone in Arabic); every other station's is an `experience.step_switcher` (Delegate: the MCP tool descriptor, then "Approve as…") |
| `agents`, `agents-grid` | `experience.chapter_title`, `experience.bento_grid` | "Built for agents.": only what exists today (tools by default, `stackra mcp`, `llms.txt`), then `experience.ask_ai` with its coming-soon note |
| `built-on`, `products` | `experience.chapter_title`, `experience.product_cards` | A grid named "Built on Stackra": Pay, Billing, Invoicing & Tax, Commerce, Tamo, Organza, Flow, each with its brand kit's line |
| `try-it-title`, `try-it` | `experience.chapter_title`, `experience.terminal_stage` | "Try it.", which says the session is recorded once `stackra create` ships; then `stackra create my-app` (see below) |
| `open-source`, `build-once` | `experience.chapter_title`, `experience.mono_display` | "The code is MIT. The marks are not."; `BUILD ONCE.` |
| `closing`, `closing-cta` | `experience.statement`, `experience.cta_row` | Three facts, then the hero's CTA row |
| `footer` | `experience.site_footer` | Link groups and "Stackra is made by Figentra Technologies L.L.C" |
| `dock` | `experience.page_dock` | The stations' ids, titles and status lines; a node never reads another node, so they are repeated here and change with the stations |

A surface's `title` and `button` are the drawn app's own words in its `lang`, not the page's, so they are plain
strings: the phone shows «إلغاء الطلب» on the English page too. The Arabic signature is the brand's own Arabic form,
«من فيجنترا» (the brand's Arabic glossary): the underscore and the cursor stay on the Latin "by figentra_" only.

## Held for the owner

- The blocks' registration. Gen does not compile the block kind yet: it emits no schema for a block class and
  registers blocks only for an app. The OS landing shell registers its own set (`registerBlocks` with these keys, the
  `@stackra/experience` classes and their `./react` components); until that lands, no node here resolves and nothing
  checks this document against the classes.
- The copy as a whole, the dock status lines (each station's `status`) included.
- "The marks are not." follows ADR 0024 and is held for the owner.
- Brief Q7: contributor avatars show people only, or bots and agents too. The page has no contributors node until the
  owner answers.
- The products' sites: no card has an `href` until each product's public URL is confirmed.
- The `stackra create my-app` chips: the hero and the closing CTA row hold no `command` until `stackra create` ships
  (ADR 0515); the try-it terminal keeps the command in its bar.

## The try-it recording

The terminal's `lines` are recorded from the real CLI, never written by hand. `stackra create` (ADR 0515) has not
shipped, so the `try-it` node holds `"lines": []`: the block then draws the command bar and the monitor, no log, and
the `try-it-title` node above it says the session is recorded once the command ships. Once it ships, drop that line
from the subtitle and run on the testbed:

```sh
node tools/scripts/record-terminal-demo.mjs --out stackra-create.json -- stackra create my-app
```

and paste the file's list into the `try-it` node's `lines`. The block shows the recording's final frame under reduced
motion and at the edge. The recording lives in this document, not in a file of its own: `pnpm validate` allows `.json`
here only as a top-level `<page>.json`, and `stackra dev` seeds every such file as a page.

## Files this document names

Every file is named by a root-relative URL (`/art/engine`, `/posters/strata-dark.png`): the landing surface serves this
folder at the site root, so the same URL resolves on a locale-prefixed route (`/ar-sa/`, ADR 0297), where a
page-relative one would not. `@stackra/experience` defines no `<module>::<path>` lookup for document assets, so the
document holds the URL itself.

- `art/<name>.<tone>.svg`: each drawing (`engine` for the hero, `monitor` for the try-it band, `stack`) as four
  single-tone mask layers, one per tone: `ground`, `dots`, `line` and `core`. Each layer is the whole drawing in
  painter's order, its tone white and every other element black, on a transparent background, so occlusion is exact.
  `tools/scripts/draw-landing-art.mjs` draws them; never edit them by hand. A document names a drawing by its base URL
  and its viewBox size, `{ "src": "/art/engine", "width": 505, "height": 588 }`, and `@stackra/ui`'s `Illustration`
  stacks the four layers as CSS masks over the token roles (`--background`, `--stk-tile-line`, `--accent`, `--core`),
  because an image cannot read the page's variables. The hero's `art` and the try-it node's `monitor` take this
  shape. The `stack` drawing is not placed: no station or chapter explains the layers, and the one chapter near it
  ("Built on Stackra.") is a `chapter_title`, which takes no drawing.
- `posters/strata-dark.png` and `posters/strata-light.png`: the strata pattern's posters (1600 x 900) under the hero
  horizon and the try-it band, named per scheme (`{ "light": …, "dark": … }`), so `DitherArt` shows the scheme's own.
  Copied unchanged from the brand kit, `figentra/brand` at commit `28ad0e89`,
  `brands/stackra/patterns/posters/strata-{dark,light}-1600x900.png`; to refresh them, copy the kit's files again
  at a newer commit and note it here.
- A product's `brand` (`pay`, `billing`, …) names a theme the page passes to `ProductCards` in code (`themes`); a brand
  with no theme draws in the page's own.

The code samples follow the house examples (`.agents/rules/http-conventions.md`, ADR 0260, ADR 0294 and a committed
`stackra.manifest.json`) and gen's own output: the Call station's client is `#stackra/clients/<service>` and a member
is called with `.call(input)` (`emitClients`, `ServiceClient`); the Delegate station's descriptor carries the derived
name `orders_order_cancel` (`toolName`), the input's JSON Schema and the four hints `toolHints` gives a write with no
idempotency or effect tags. The Ship sample uses `runway.yaml`'s current keys (no `deploy.gate`, a deprecated alias of
`release.gate`). Change a sample when gen's output changes.

## Runway

The `surfaces.landing` entry in `runway.yaml` that serves this document is its own pull request
(`figentra/sta-2041-landing-surface`), merged on the owner's word with the copy sign-off. Nothing in this folder
touches `runway.yaml`.
