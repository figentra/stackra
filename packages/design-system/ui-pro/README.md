# @stackra-pro/ui

<!--
Stackra file contract:
Purpose: the package's reader guide: its entries, compositions, catalogue words, app setup and the restricted publishing.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0004 §1; ADR 0294; ADR 0403.
-->

Stackra Design System Pro components for Stackra's own apps only: the @stackra/ui props vocabulary over HeroUI Pro on web and HeroUI Native Pro on native. Published only to Figentra's restricted Keygen channel, never to npmjs.

**Tier:** `tier:lib` (`packages/design-system/ui-pro`). Laid out in the programming model v3 (ADR 0294, 0295).

## Entry points

Only Stackra's and Figentra's own apps import it (ADR 0310). `@stackra/ui` and every free package never do;
`pnpm validate` refuses it.

| Import                      | Holds                                                                                                                                                                                     |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@stackra-pro/ui`           | `src/config/ui-pro.config.ts`: `UiProConfig`                                                                                                                                              |
| `@stackra-pro/ui/contracts` | the props contracts (`<Name>ContractProps`) on `@stackra/ui/contracts`' `Size` and `Tone`                                                                                                 |
| `@stackra-pro/ui/react`     | every HeroUI Pro web component (66): charts, AI, forms, navigation, overlays, layout, data display and feedback; Pro `Command` is ActionPalette, `FloatingToc` is FloatingTableOfContents |
| `@stackra-pro/ui/native`    | every HeroUI Native Pro component (55): charts, buttons, data display, date and time, forms and navigation; Pro `Fab` is FloatingActionButton                                             |
| `@stackra-pro/ui/node`      | `src/node/ui-pro.module.ts`: the root module                                                                                                                                              |
| `@stackra-pro/ui/assets/*`  | static files at the package root (ADR 0234)                                                                                                                                               |

Each component is a thin wrapper: the `@stackra/ui` vocabulary (`size`, `tone`, `isDisabled`, `label`, `onPress`) maps
onto HeroUI Pro's names, every other prop passes through, and the compound parts are HeroUI Pro's own. The web
components are on the playground's "Pro" routes, the native ones in `apps/mobile`'s design-system review area. A
component with nothing in the vocabulary to map (most charts, Markdown, Timeline, Table) keeps HeroUI Pro's API as it is.

## Compositions

Nine web components are the package's own compositions, not one HeroUI Pro component each (the scheduler, the
signature field, the floor-plan editor, the live table map and the KDS board also ship on native):

| Component           | Built on                                     | Use                                                                                                                                                                   |
| ------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AssistantPanel`    | layout, `@stackra/ui`'s `AiMark`             | the sidekick's panel: the assistant's name and AI label, header actions, the conversation, the composer                                                               |
| `ApprovalCard`      | `ChatTool`                                   | an agent's tool call waiting for a human: approve, reject, escalate; the decided state after (ADR 0360)                                                               |
| `PlanView`          | `Timeline`                                   | an agent's plan, step by step with its status read out in words (ADR 0245 decision 8)                                                                                 |
| `ResourceScheduler` | its own markup (HeroUI Pro has no scheduler) | a day or week of bookings per staff, room or chair; drag or arrow keys to move, Shift or the bottom edge to resize, snapped; processing gaps leave the resource free  |
| `SignatureField`    | its own SVG box, `@stackra/ui`'s `TextField` | sign by drawing or by typing a name (the keyboard way); reports SVG path data or the name                                                                             |
| `WorkflowCanvas`    | its own markup and SVG (no Pro graph)        | an automation as a graph: trigger and steps in flow columns, arrows with branch conditions, run status per step; arrow keys walk the graph, pressing selects (OS-230) |
| `FloorPlanEditor`   | its own markup (no Pro floor plan)           | one area's tables (rectangular or round, with seats), walls and labels on a grid; drag or arrow keys to move, Shift or the corner to resize, snapped to cells         |
| `LiveTableMap`      | the plan's markup, `@stackra/ui`'s `Chip`    | the plan read-only: each table's status word in its tone, the caller's lines (time, waiter, party, spend), a suggested table ringed; a press reports the table        |
| `KdsBoard`          | cards, `@stackra/ui`'s `Button` and `Chip`   | kitchen tickets oldest first, aged in the caller's tones; rush, allergy and held flags; line bump, ticket bump, recall, all-day counts; a station or the expo         |

The scheduler and the signature field propose and report only, and the workflow canvas only selects (the caller maps an automation document onto its nodes and edges and edits the step): the caller saves a moved booking, and binding a
signature to a document is `@stackra/documents`' e-signature port. Opening hours, the working week (`days`) and the
step (`slotMinutes`) are the caller's data, never defaults here.

The restaurant compositions carry no restaurant data (STA-962). The floor-plan editor proposes a moved or resized
item; one editor is one area, and the zoom is `cellSize`. The live map shows the statuses, words, tones and lines the
caller passes (a pack, kept live by realtime). The KDS board ages tickets against the caller's `now` with the age
steps from a setting (`ageTones`); bumps and recalls are the caller's to save, and a bump bar reaches it as the screen
maps it (`@stackra/peripherals`).

## Own words (catalogue)

Every word a component says by default (the code block's "Copy code", the chat's "Scroll to latest", the table of
contents' "On this page", the rich text editor's "Link") is a key in `assets/lang/<locale>/ui_pro.json`, in seven
languages (ADR 0403); a `label` the caller passes wins. `useUiProText()` reads it through `@stackra/ui`'s
`useCatalogueText`: `src/react/hooks/` from `@stackra/ui/react`, `src/native/hooks/` from `@stackra/ui/native`, so a
native bundle never loads the web entry and `core/` stays free of React (ADR 0004 §1).

## Using it in an app

- Web: `@heroui-pro/react` with its peers (`motion`, `react-resizable-panels`, `recharts` for Kpi), and the styles in
  this order: `@import "tailwindcss";`, `@import "@heroui/styles";`, `@import "@heroui-pro/react/css";` and
  `@import "@stackra-pro/ui/assets/public/css/ui-pro.css";`, the last outside any `@layer` so it wins over HeroUI Pro's layered rules.
- Map under Vite: pass `workerUrl` from `import url from "maplibre-gl/dist/maplibre-gl-worker.mjs?url"`. MapLibre
  looks for its worker beside its own module, which Vite's dep optimiser moves and its build does not emit; without
  it the map draws no GeoJSON layer, routes included ("Worker failed to load").
- Native: `heroui-native-pro` (with `@internationalized/date` for Calendar and DatePicker) inside `@stackra/ui`'s
  `DesignSystemProvider`, plus `@import "heroui-native-pro/styles";` and a `@source` line for its `lib` folder.
- Install: a `heroui-pro login` session locally; `HEROUI_AUTH_TOKEN` from Infisical `/ci` in CI. Without it the HeroUI
  Pro packages are empty shells.

## Publishing

`@stackra-pro/ui` publishes only to the restricted channel, Keygen Cloud's npm engine for Figentra's account,
`https://npm.pkg.keygen.sh/figentra/` (ADR 0310 as amended, ADR 0177 decision 2), for Figentra's own repositories, and
never to npmjs. The Keygen custom domain gets its name later (ADR 0290 decision 17); the registry then moves to it.

- `"private": true` stays, so `pnpm publish` and changesets never send it to npmjs.
- The tarball is the Pro form of ADR 0316 decision 2: `pnpm pack` applies `publishConfig.exports`, which name `dist`
  and `assets` only with no `@stackra/source` condition; `files` lists no `src` and ends with `!**/*.map` (a negated
  entry drops only what the entries before it added); the build is minified with no source maps.
- `@heroui-pro/react` and `heroui-native-pro` stay external peers. Each consuming repository installs them with its own
  HeroUI Pro licence token; this package carries none.
- Keygen's npm engine takes no `npm publish`: a release step will upload the packed tarball with the Keygen CLI
  (`keygen new`, `keygen upload`, `keygen publish`). That step is STA-482; until it lands, nothing publishes this
  package, and the release workflow neither installs nor builds it (`release.yml` filters it out).
- `pnpm validate` checks the private flag, the registry, `files` and the packed exports.

## Structure

```text
stackra.config.ts          the member definition: static data (ADR 0295)
assets/                    static files: public/, lang/ (templates/, stubs/, data/ with their first file)
src/
├── config/ui-pro.config.ts   UiProConfig, the deploy-time configuration
├── contracts/             the leaf: ports/, enums/, types/
├── core/                  isomorphic code: services, drivers, errors, functions, schemas, blocks
├── node/                  the module: ui-pro.module.ts and its groups (models/, actions/, queries/, …)
└── testing/               fakes/ and matchers/ for consumers' tests
```

The module groups, and the one home of every kind suffix, are on the docs page `standards/structure` (`pnpm docs`),
generated from `tools/scripts/structure.mjs`. A group folder appears with its first file. `stackra gen` writes `stackra.manifest.json` here on its first run.

## Tasks

| Task            | Command                                         |
| --------------- | ----------------------------------------------- |
| `build`         | `tsdown`                                        |
| `typecheck`     | `tsc --noEmit`                                  |
| `lint`          | `oxlint .`                                      |
| `test`          | `vitest run`                                    |
| `test:coverage` | `vitest run --coverage` (shared gate: 80/80/70) |
| `format`        | `oxfmt --write .`                               |
| `format:check`  | `oxfmt --check .`                               |
| `clean`         | `rm -rf dist coverage .turbo`                   |

Run one with `pnpm turbo run <task> --filter=@stackra-pro/ui`.
