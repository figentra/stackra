# Implementation Plan: Stackra Design System: design-system category, `@stackra/tokens`, `@stackra/ui`, `apps/playground`

**Spec**: `.agents/specs/sta-350-design-system/spec.md` · **Linear**: STA-350 · **Date**: 2026-10-23

## Summary

A `design-system` package category is added. `@stackra/tokens` takes the brand tokens as the `stackra` theme and renders
a theme to HeroUI v3 web CSS and to the Uniwind / HeroUI Native theme. `@stackra/ui` carries the shared contracts and
the two providers, one per platform. `apps/playground` renders the foundations on HeroUI v3 with a theme and direction
switcher and is covered by Playwright and axe. `@stackra/brand` is deleted; its assets move to `apps/docs` and
`apps/mobile`. ADR 0302 records the five owner decisions.

## Technical Context

- **Language**: TypeScript, CSS generated from theme data, Vite and React Router (playground)
- **Members**: new `packages/design-system/{tokens,ui}` and `apps/playground`; changed `apps/mobile` and `apps/docs`;
  deleted `packages/experience/brand`
- **Testing**: vitest in each package's `__tests__/`; Playwright and axe e2e in `apps/playground/src/**/__tests__/`
- **Storage**: none

## Constitution Check

| Law                                   | Result | Note                                                                                            |
| ------------------------------------- | ------ | ----------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | tokens and ui are `tier:lib`; the playground is `tier:app` and imports only packages            |
| Secrets (ADR 0173)                    | N/A    | no secret is read or written                                                                    |
| Security                              | N/A    | no auth, tenant data or outbound call                                                           |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                    |
| Tenancy                               | N/A    | no tenant data                                                                                  |
| Delegation                            | PASS   | package-builder, frontend-builder, test-engineer and docs-adr-steward; a separate reviewer      |
| Not built yet (ADR 0227)              | PASS   | no Storybook; the shared web and native component library stays deferred (contract shared only) |
| Test placement (ADR 0022)             | PASS   | every test, e2e included, in a `__tests__/` folder beside its subject                           |
| Versions and catalogs                 | PASS   | the `e2e` catalog is owner-approved and pinned exactly; every member uses `catalog:`            |
| Deploy modes (ADR 0076)               | N/A    | libraries and a dev-only app, not deployed                                                      |
| Licence tier (ADR 0077)               | PASS   | packages MIT with `LICENSE`; brand assets stay under the ADR 0024 NOTICE                        |
| Docs and ADRs                         | PASS   | ADR 0302, amendment notes, structure page, READMEs, roadmap                                     |

## Deploy modes

| Mode       | Behaviour                                                 |
| ---------- | --------------------------------------------------------- |
| SaaS       | none: libraries and a dev-only app, nothing deployed      |
| On-prem    | none: libraries and a dev-only app, nothing deployed      |
| Air-gapped | none: no network at run time; fonts ship inside the theme |

## Correctness properties

- **P-001**: Every theme has a light and a dark variant for every token, and a renderer fails naming the missing token instead of writing a partial file — Validates: FR-001, FR-003, FR-004
- **P-002**: The `stackra` theme values equal the retired brand tokens, token for token — Validates: FR-002
- **P-003**: A committed generated CSS file equals what the generator prints now — Validates: FR-003, FR-004
- **P-004**: No file outside ADRs and historical specs names `@stackra/brand`, and every moved asset exists in its new home — Validates: FR-005
- **P-005**: A package scaffolded or validated in `design-system` is accepted, and an unknown category still fails — Validates: FR-006
- **P-006**: The `./react` provider puts the colour scheme and `dir` on the document, and the `./native` provider applies the same scheme from the shared contract — Validates: FR-007, FR-008, FR-009
- **P-007**: Every playground route, found by listing the route folders, renders without an axe violation in light, dark, LTR and RTL — Validates: FR-010, FR-011
- **P-008**: For every Size and TextTone, both Icons hand the drawn component the same pixel size (`ICON_SIZES`) and the same colour role — Validates: FR-012
- **P-009**: Decorative is the default on both runtimes: an Icon with no label has no accessible name and is hidden — Validates: FR-013
- **P-010**: Each runtime's Text and Heading props extend their contract (type test) — Validates: FR-017, FR-018, FR-019
- **P-011**: Props outside the contract reach HeroUI unchanged on both runtimes, and the contract-owned HeroUI props cannot be passed — Validates: FR-018, FR-019
- **P-012**: Text in Arabic, by `lang` or by the screen's locale, takes the theme's `-ar` style and other text never does — Validates: FR-019, FR-020
- **P-013**: An Icon is drawn mirrored exactly when it asks for it and the direction is right to left — Validates: FR-014
- **P-014**: The native provider gives Lucide icons the md size and the theme foreground colour — Validates: FR-015
- **P-015**: Every Icon and Typography sample of the playground shows what its contract promises (names, mirroring, sizes, computed type, live state) — Validates: FR-016, FR-021
- **P-016**: A loading Button refuses presses and keeps its accessible name on web and reports busy on native, and an IconButton or CloseButton always has a non-empty accessible name, with every HeroUI prop outside the contract passed through — Validates: FR-022, FR-023, FR-024
- **P-017**: An internal, same-origin, unmodified Link click navigates through the router provider, and an external link or absolute URL never does, on both runtimes — Validates: FR-025, FR-026
- **P-018**: Every Button, IconButton, CloseButton and Link sample of the playground shows what its contract promises, listed under its category — Validates: FR-027, FR-028
- **P-019**: Each runtime's Surface, Card, Separator, Chip and Badge props extend their contract, and the contract's value sets equal HeroUI's on both runtimes (type tests), so a HeroUI change fails to compile — Validates: FR-029, FR-030, FR-031, FR-033, FR-034, FR-035, FR-037, FR-038, FR-039
- **P-020**: A card title is a heading on both runtimes: web `h<level>` (default `h3`) with HeroUI's look, native `accessibilityRole="header"` with `level` dropped — Validates: FR-030, FR-031
- **P-021**: Props outside the contract reach HeroUI unchanged on both runtimes for Surface and Card, and HeroUI's surface context still reaches the children on web — Validates: FR-030, FR-031
- **P-022**: A separator draws its level's theme colour on both runtimes; on web it is a horizontal `hr` or a vertical `role="separator"` with `aria-orientation`, on native it never hands HeroUI Native the contract's `variant` — Validates: FR-030, FR-031
- **P-023**: With no props, a Chip is the same `secondary`, `default`, `md` chip on both runtimes, and press handlers are refused by the type — Validates: FR-034, FR-035
- **P-024**: A StatusBadge reads as its text alone: its dot has no name and nothing is a live region, on both runtimes — Validates: FR-034, FR-035
- **P-025**: Props outside the Chip contract reach HeroUI unchanged on both runtimes — Validates: FR-034, FR-035
- **P-026**: A badge at each logical corner sits on the reading side of its anchor, right in left-to-right and left in right-to-left, on both runtimes — Validates: FR-038, FR-039
- **P-027**: A badge without a label is hidden from assistive technology, and with a label assistive technology gets exactly the label and not the visible content — Validates: FR-038, FR-039
- **P-028**: A badge never takes a press: a press on it reaches the anchored element — Validates: FR-038, FR-039
- **P-029**: Props outside the Badge contract reach the HeroUI base unchanged on both runtimes — Validates: FR-038, FR-039
- **P-030**: Every Surface, Card, Separator, Chip, StatusBadge and Badge sample of the playground shows what its contract promises, listed under its category — Validates: FR-032, FR-036, FR-040
- **P-031**: Without a label an Avatar is hidden from assistive technology and with one it is exactly one image named by it; its fallback is the loaded image, else `fallback`, else the initials of `name`, else the person icon, on both runtimes — Validates: FR-041, FR-042, FR-043, FR-044
- **P-032**: A Spinner with a label is one named status (web `status`, native busy progressbar), without one it is hidden, and HeroUI's English "Loading" never reaches a user — Validates: FR-042, FR-043
- **P-033**: A Skeleton shows its children only when not loading, takes its loading state and animation from the enclosing SkeletonGroup unless it sets its own, and a group with a loading label exposes exactly that text while loading — Validates: FR-042, FR-043, FR-045
- **P-034**: Props outside the Avatar, Spinner, Skeleton and SkeletonGroup contracts reach HeroUI unchanged on both runtimes — Validates: FR-042, FR-043
- **P-035**: Every Avatar, Spinner and Skeleton sample of the playground shows what its contract promises, listed under its category — Validates: FR-046
- **P-036**: `IconName` accepts a Lucide name, an alias and a namespaced custom name and nothing else, and `IconComponentProps` names every prop `Icon` hands the component — Validates: FR-047
- **P-037**: The committed Lucide name list is exactly what the installed `lucide-react` and `lucide-react-native` ship, and no generated file names an icon outside it — Validates: FR-048
- **P-038**: `findIcon` resolves a registered name or an alias from own properties only, and `isIconName` separates valid names from every other string — Validates: FR-049
- **P-039**: A registry provider gives its icons their registry, nests with the nearest winning, and a name outside every registry resolves to nothing without throwing — Validates: FR-050
- **P-040**: The Lucide re-exports and the full registry are opt-in entries that no other entry imports — Validates: FR-051
- **P-041**: `Icon` draws the icon its name resolves to on both runtimes, nothing for an unregistered name (with one development warning per name), and no component prop — Validates: FR-052
- **P-042**: An icon slot of Button, IconButton, CloseButton and Chip draws a name through `Icon` and an element as given — Validates: FR-053
- **P-043**: Only `@stackra/icons` and `@stackra/ui` import a Lucide package, and the playground registers only the icons it draws — Validates: FR-054
- **P-044**: Every field extends `FieldContractProps`; the playground's router, index and navigation follow its route folders, and a wrong path, an unknown category or a missing page fails with the folder's name; `react-hook-form` is an exact catalog entry and a required peer of `@stackra/ui` — Validates: FR-055, FR-056, FR-057
- **P-045**: A bound field shows its rule's message and is invalid after a failed submit, clears both once valid, is required and disabled as the form says, and binds a string, a boolean and a choice, on both runtimes — Validates: FR-058, FR-059
- **P-046**: A FormSection is a group named by its title, tied to its description, and a disabled section disables the fields inside it on web; the native one is a named group with a level-3 heading — Validates: FR-060, FR-061
- **P-047**: Every FormField and FormSection sample of the playground shows what its contract promises, axe clean in the four combinations — Validates: FR-062
- **P-048**: A TextField, TextArea and InputGroup name their input by the label, tie the description and the error to it, keep the affixes at the reading start and end, and pass every HeroUI prop outside the contract through, on both runtimes — Validates: FR-063, FR-064, FR-065, FR-066, FR-067, FR-068, FR-069, FR-070, FR-071
- **P-049**: A SearchField clears from its button, reports busy while loading and submits and clears through its handlers, with every state shown and axe clean — Validates: FR-072, FR-073, FR-074
- **P-050**: A Select, ComboBox and TagGroup call `onChange` with string keys, filter by label unless the app does, show picked items as removable named tags and refuse change when disabled or read-only, with every sample shown — Validates: FR-075, FR-076, FR-077, FR-078, FR-079, FR-080, FR-081
- **P-051**: A Checkbox, CheckboxGroup, RadioGroup and Switch keep their own state, show `value` when controlled, tie a group's description and error to the group, and refuse input when disabled or read-only, with every sample shown — Validates: FR-082, FR-083, FR-084, FR-085, FR-086, FR-087, FR-088, FR-089
- **P-052**: A Label names its control, a Description's id is the one a control names it by, a FieldError follows the field's validity, and a Form hands its validation errors to the fields in it — Validates: FR-090, FR-091, FR-092, FR-093, FR-094
- **P-053**: The native provider sets the colour scheme React Native's `Appearance` follows, and releases it for `system` — Validates: FR-095
- **P-054**: A side and an alignment give React Aria a placement it accepts and HeroUI Native a physical side that follows the reading direction — Validates: FR-097
- **P-055**: Every tone has a default icon, and only warning and danger are announced at once — Validates: FR-096
- **P-056**: A Modal and a Drawer open from a trigger or by state, are named by their title, dismiss by Escape and a press outside unless told not to, and return focus on close, with every size and placement shown — Validates: FR-098, FR-099, FR-100, FR-101
- **P-057**: An AlertDialog asks one decision with focus on the safe button, useConfirmation answers it with a promise, and LeaveConfirmation asks before unsaved work is lost — Validates: FR-102, FR-103, FR-104, FR-105
- **P-058**: A Menu and an ActionMenu list grouped actions, scope selection to a section, call the action's handler and name their trigger — Validates: FR-106, FR-107, FR-108, FR-109
- **P-059**: A Popover places its content by side and alignment and closes as told, and a Tooltip describes the element and never names it — Validates: FR-110, FR-111
- **P-060**: An Alert and a toast announce by tone, show the tone's icon and offer their actions, with every tone shown — Validates: FR-112, FR-113, FR-114, FR-115, FR-116
- **P-061**: A ProgressBar and a ProgressCircle are named, determinate or indeterminate by their value, and still under reduced motion — Validates: FR-117, FR-118, FR-119, FR-120
- **P-062**: A collection takes items, an empty state and a loading flag, reports its selection as a list of string ids and a sort as a column and a direction — Validates: FR-121
- **P-063**: A selection becomes ids in the items' order, and a press on a column moves its sort from none to ascending to descending — Validates: FR-122
- **P-064**: A List shows rows, its empty state only when empty and nothing loads, reports its selection as ids and asks for more at its end — Validates: FR-126, FR-127, FR-128, FR-129, FR-130
- **P-065**: A Table is named, sorts by a column and a direction, selects rows and loads more — Validates: FR-123, FR-124, FR-125
- **P-066**: A PropertyList shows labelled values, an empty value for a missing one, and copies on request — Validates: FR-131, FR-132, FR-133, FR-134
- **P-067**: Tabs and an Accordion select and expand by ids and follow the reading direction — Validates: FR-135, FR-136, FR-137, FR-138, FR-139, FR-140
- **P-068**: Cursor pagination and breadcrumbs navigate, refuse a press while loading and mirror in right-to-left — Validates: FR-141, FR-142, FR-143, FR-144, FR-145, FR-146
- **P-069**: An empty state, an error state and a page skeleton are named, announce as they should and carry no copy of their own — Validates: FR-147, FR-148, FR-149, FR-150, FR-151
- **P-070**: A navigation list marks the current place, a sidebar collapses, and an app shell keeps one main landmark and moves its sidebar into a drawer on a narrow screen — Validates: FR-152, FR-154, FR-155, FR-156, FR-157, FR-158, FR-159, FR-160, FR-161, FR-162
- **P-071**: A page's ordered actions put the first as primary and the overflow in a menu, and the app bar and page header hold their parts in reading order — Validates: FR-163, FR-164, FR-165, FR-166, FR-167, FR-168
- **P-072**: A section and the two layouts stack with an even gap, and the side column sits at the logical end from the breakpoint up — Validates: FR-169, FR-170, FR-171, FR-172, FR-173
- **P-073**: A screen keeps clear of the safe areas, a navigation header and a tab bar name the current place and mirror in right-to-left — Validates: FR-174, FR-175, FR-176, FR-177
- **P-074**: A route is an overlay whose route is its open state, closing returns to where the user came from, and unsaved work is confirmed before it is left — Validates: FR-153, FR-178, FR-179, FR-180, FR-181, FR-182, FR-183, FR-184

## Contracts and events

Public surface: `@stackra/tokens` (`./contracts`, the theme, the renderers) and `@stackra/ui` (`./contracts`,
`./react`, `./native`). No runtime contract, no event.

## Data and tenancy

None.

## Delegation and risk plan

R2: the lead splits the work by member; `package-builder` writes tokens and the category tooling, `frontend-builder` the
ui package and the playground, `test-engineer` the e2e, `docs-adr-steward` ADR 0302. A separate reviewer checks the pull
request. Order: the category and tokens first, then ui, then the playground, then the e2e and the brand retirement.

## ADRs

ADR 0302 (new, same pull request); ADR 0165, 0128, 0227, 0300 and 0024 apply and get amendment notes where the owner's
decisions change them.

## Docs

ADR 0302, the regenerated `apps/docs/src/standards/structure.mdx`, the package and category READMEs, the roadmap.

## Project structure

`packages/design-system/{tokens,ui}`, `apps/playground`, `tools/scripts/{structure,validate-repository,scaffold}.mjs`,
`pnpm-workspace.yaml` (the `e2e` catalog), `apps/mobile`, `apps/docs`.
