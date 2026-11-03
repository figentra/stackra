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

| Node | Block | What it holds |
| --- | --- | --- |
| `header` | `web.site_header` | Docs, Decisions, Packages, Runway; docs search, Ask AI, GitHub |
| `hero` | `web.hero_machine` | "One backend, every surface." (plain, no accent word), the CTA row, the engine art, the strata horizon |
| `statement` | `web.statement` | The boilerplate with steel keywords (`*…*`) |
| `follow` | `web.chapter_title` | "Follow one action." |
| `write` … `ship` | `web.station` | Write, Expose, Call, Draw, Delegate, Ship: each shows `order.cancel` transformed; the station's media is its one child, a `web.step_switcher` |
| `agents`, `agents-grid` | `web.chapter_title`, `web.bento_grid` | "Built for agents.": only what exists today (tools by default, `stackra mcp`, `llms.txt`), then `web.ask_ai` |
| `built-on`, `products` | `web.chapter_title`, `web.product_cards` | Pay, Billing, Invoicing & Tax, Commerce, Tamo, Organza, Flow, each with its brand kit's line |
| `try-it` | `web.terminal_demo` | `stackra create my-app` (see below) |
| `open-source`, `build-once` | `web.chapter_title`, `web.mono_display` | "The code is MIT. The marks are not."; `BUILD ONCE.` |
| `closing`, `closing-cta` | `web.statement`, `web.cta_row` | Three facts, then the hero's CTA row |
| `footer` | `web.site_footer` | Link groups and "Stackra is made by Figentra Technologies L.L.C" |

## Held for the owner

- The copy as a whole, the dock status lines (each station's `status`) included.
- "The marks are not." follows ADR 0024 and is held for the owner.
- Brief Q7: contributor avatars show people only, or bots and agents too. The page has no contributors node until the
  owner answers.

## The try-it recording

The terminal's `lines` are recorded from the real CLI, never written by hand. `stackra create` (ADR 0515) has not
shipped, so the `try-it` node holds `"lines": []`. Once it ships, run on the testbed:

```sh
node tools/scripts/record-terminal-demo.mjs --out stackra-create.json -- stackra create my-app
```

and paste the file's list into the `try-it` node's `lines`. The block shows the recording's final frame under reduced
motion and at the edge. The recording lives in this document, not in a file of its own: `pnpm validate` allows `.json`
here only as a top-level `<page>.json`, and `stackra dev` seeds every such file as a page.

## Files this document names

- `art/engine.svg`: the hero's engine drawing, written by `tools/scripts/draw-landing-art.mjs`.
- `posters/strata.dark.png`: the strata pattern's poster under the horizon and the terminal band; owed by the brand
  kit's patterns batch.
- Product themes are named by product id (`pay`, `billing`, …) and resolved by the renderer.

The code samples follow the house examples (`.agents/rules/http-conventions.md`, ADR 0260, ADR 0294 and a committed
`stackra.manifest.json`); check them against gen when it ships.
