# Feature Specification: `@stackra/ui-pro`, the remaining HeroUI Pro components

**Feature Branch**: `figentra/sta-416-ui-pro-remaining`

**Created**: 2026-10-23

**Status**: Implementing

**Linear**: STA-416

**Linear project**: Stackra Design System

**Clarifications status**: complete

**Analyze**: — <!-- lite lane: /speckit.analyze not run -->

**Input**: Owner, 2026-10-23: wrap every HeroUI Pro component in `@stackra/ui-pro`, not only the first thirteen of STA-403.
The main design-system session agreed the scope the same day: every Pro component the free HeroUI packages do not have,
as a second pull request stacked on STA-403's, with props kept local until a free wave adds a matching contract.

## Impact

- **Apps touched**: `apps/playground` (one Pro route per new web component), `apps/mobile` (one review screen per new
  native component), `apps/docs` (ADR 0304 decision 12)
- **Services touched**: none
- **Packages touched**: `packages/design-system/ui-pro`
- **Public contract change**: none published; `@stackra/ui-pro` stays private (ADR 0304 decision 1)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none; no CI change beyond STA-403's
- **Secrets**: none new
- **ADR needed**: no new ADR; ADR 0304 gains decision 12 in this pull request (it is not merged yet)
- **New dependencies**: owner-approved 2026-10-23: the optional peers of `@heroui-pro/react` in `catalog:frontend`
  (eight `@tiptap/*` 3.32.0, `maplibre-gl` 6.14.0, `marked` 18.1.1, `react-markdown` 10.1.0, `remark-breaks` 4.0.0,
  `remark-gfm` 4.0.1, `streamdown` 2.7.0, `shiki` 4.5.0, `@number-flow/react` 0.6.2, `embla-carousel` and
  `embla-carousel-react` 8.6.0) and of `heroui-native-pro` in `catalog:mobile` (`@shopify/react-native-skia` 2.6.2,
  `victory-native` 41.26.0, `libphonenumber-js` 1.13.15, `react-native-pager-view` 8.0.2, `react-native-reanimated-dnd`
  2.0.0)
- **Deploy modes**: none; a private library and dev-only apps
- **Licence tier**: our wrapper code is MIT; the new peers are MIT, Apache-2.0 (`streamdown`) and BSD-3-Clause
  (`maplibre-gl`); HeroUI Pro stays under its own licence and is never committed or bundled
- **UI surfaces**: `apps/playground`, `apps/mobile` (neither shipped to users)
- **Docs to update**: ADR 0304, the package README and AGENTS
- **Lane**: lite (recorded reason: the owner decided the scope and the dependencies on 2026-10-23; the shape is STA-403's)
- **Change risk**: R1 (library code and dev-only apps; new catalog pins)

## Decisions taken by the owner (2026-10-23)

1. Every HeroUI Pro component is wrapped, web (59 more) and native (49 more); none of their names is a free HeroUI one.
2. The optional Pro peers above are pinned, so no component is skipped for a missing peer.
3. A component that a free wave of `@stackra/ui` will also wrap (Sidebar, DataTable, NumberField, DatePicker,
   ActionPalette, SwipeableRow, TrendChip, DataGrid, Kanban) keeps its own Pro wrapper; its props follow the free
   contract once that contract exists.

## User Scenarios & Testing

### User Story 1 - Every Pro component in our own apps (Priority: P1)

A Stackra app builder imports any HeroUI Pro component from `@stackra/ui-pro/react` or `@stackra/ui-pro/native` with
the `@stackra/ui` props vocabulary.

**Independent Test**: unit tests per component prove each contract prop reaches HeroUI Pro under its HeroUI name and
unknown props pass through.

### User Story 2 - Review every component (Priority: P2)

**Independent Test**: each new web component has a playground route under "Pro" that the all-routes axe run covers in
light, dark, LTR and RTL; each new native component has a screen in the mobile review area.

### Edge Cases

- **EC-01**: A HeroUI Pro component or part cannot be verified against its docs and types: it is skipped and listed in
  the pull request.

## Requirements

- **FR-001**: `@stackra/ui-pro/react` SHALL wrap HeroUI Pro's charts: AreaChart, BarChart, ChartTooltip, ComposedChart,
  LineChart, PieChart, RadarChart and RadialChart.
- **FR-002**: `@stackra/ui-pro/react` SHALL wrap HeroUI Pro's AI components: ChainOfThought, ChatAttachment,
  ChatConversation, ChatListView, ChatLoader, ChatMessage, ChatMessageActions, ChatSource, ChatTool, CodeBlock,
  Markdown, PromptInput, PromptSuggestion and TextShimmer.
- **FR-003**: `@stackra/ui-pro/react` SHALL wrap HeroUI Pro's form components: CellColorPicker, CellSelect, CellSlider,
  CellSwitch, CheckboxButtonGroup, DropZone, InlineSelect, NativeSelect, NumberStepper, RadioButtonGroup and
  RichTextEditor.
- **FR-004**: `@stackra/ui-pro/react` SHALL wrap HeroUI Pro's navigation, overlay and layout components: ContextMenu,
  Navbar, Segment, Stepper, Sheet, EmojiPicker, Resizable, HoverCard and FloatingToc.
- **FR-005**: `@stackra/ui-pro/react` SHALL wrap HeroUI Pro's data display and feedback components: Agenda, ActionBar,
  Carousel, EmptyState, FileTree, HoloCard, ItemCard, ItemCardGroup, KpiGroup, ListView, Map, Timeline, Widget,
  EmojiReactionButton, NumberValue, PressableFeedback and Rating.
- **FR-006**: `@stackra/ui-pro/native` SHALL wrap HeroUI Native Pro's charts: AreaChart, BarChart, ChartCrosshair,
  ChartIndicator, ChartTooltip, ComposedChart, LineChart, PieChart, RadarChart, RadialChart and StackedMeter.
- **FR-007**: `@stackra/ui-pro/native` SHALL wrap HeroUI Native Pro's buttons: Fab, MorphButton, SocialAuthButton,
  ToggleButton and ToggleButtonGroup.
- **FR-008**: `@stackra/ui-pro/native` SHALL wrap HeroUI Native Pro's data display and feedback components: Badge,
  Carousel, EmptyState, FlipCard, Table, Timeline, Widget, NumberValue, ProgressBar, ProgressCircle, Rating and TrendChip.
- **FR-009**: `@stackra/ui-pro/native` SHALL wrap HeroUI Native Pro's date and time components: Agenda, DateField,
  DateRangePicker, DateTimePicker, RangeCalendar, TimePicker, WheelDateTimePicker and WheelTimePicker.
- **FR-010**: `@stackra/ui-pro/native` SHALL wrap HeroUI Native Pro's form components: Autocomplete, ComboBox, NumberPad,
  NumberStepper, PhoneNumberField, RadioButtonGroup, WheelPicker and WheelPickerGroup.
- **FR-011**: `@stackra/ui-pro/native` SHALL wrap HeroUI Native Pro's navigation components: MorphTabs, Segment,
  Stepper, SplitView and SwipeableTabs.
- **FR-012**: `apps/playground` SHALL show each new web component on its own route under the "Pro" navigation group.
- **FR-013**: `apps/mobile` SHALL show each new native component on its own screen in the design-system review area.

## Success Criteria

- **SC-001**: `pnpm verify` is green with the change — verified by: CI (Quality Gate)
- **SC-002**: The playground e2e reports no axe violation on any Pro route in the four combinations — verified by: e2e

## Out of scope

- Free `@stackra/ui` components (the main design-system session's waves 4 to 13).
- The free native components in the mobile review area (after the waves pull request merges).

## Status history

- 2026-10-23 · — → Draft · Claude (lead) · from the owner's request and the main session's scope answer (lite lane)
- 2026-10-23 · Draft → Clarified · Claude (lead) · the owner approved the dependencies; no open questions
- 2026-10-23 · Clarified → Planned · Claude (lead)
- 2026-10-23 · Planned → Tasked · Claude (lead)
- 2026-10-23 · Tasked → Implementing · Claude (lead) · builders under way
