/**
 * Stackra file contract:
 * Purpose: `ALLOWED`, the intended copies the duplicate-export check exempts: the same exported name in more than one
 *          package on purpose, each with its reason; a new entry needs the same (moved from
 *          `tools/scripts/duplicate-exports.mjs`).
 * Boundary: data only; permanent entries. `stackra duplicate-exports` notes an entry that no longer matches a duplicate.
 * Runtime: node
 * Governing contract: ADR 0305 (one declaration per file, one home per concept); stackra-224 (STA-1382).
 */

/** Intended copies: name to the reason it is declared in more than one package. */
export const ALLOWED: Readonly<Record<string, string>> = Object.freeze({
  kebabCase:
    "coding-standard has no workspace dependency by design (oxlint loads it alone) and splits acronym runs for file names; everyone else imports @stackra/support",
  pascalCase:
    "coding-standard has no workspace dependency by design (oxlint loads it alone); everyone else imports @stackra/support",
  KIND_BASES:
    "coding-standard has no workspace dependency by design, so it keeps its own kind table beside gen's",
  LibraryPresetOptions:
    "tooling presets (tsdown, vitest) are tier:config with no workspace dependency (ADR 0300); each preset owns its options",
  libraryPreset:
    "tooling presets (tsdown, vitest) are tier:config with no workspace dependency (ADR 0300); each preset owns its factory",
  // Two concepts that share a name.
  FooterLink:
    "@stackra/experience's authored footer link (a LocalizedText label, content) vs @stackra/ui's Footer render prop (a resolved string label); the content layer resolves one into the other",
  RawBody:
    "@stackra/actions' raw response body of a query (an iCalendar feed, a CSV) vs @stackra/integrations' raw request body of a managed client call (a SOAP envelope); opposite directions",
  Surface:
    "@stackra/ui's Surface component vs @stackra/experience's landing surface type; different things",
  SurfaceKind:
    "@stackra/ai's kind of surface that opened an AI turn (screen, mcp_host, messaging, background) vs @stackra/experience's frame a landing surface is drawn in (web, desktop, phone)",
  settingsKeyOf:
    "the same derivation twice by design: gen keys a settings class from its source shape and never loads @stackra/settings, whose internal copy keys it from the runtime class; the two tests share their cases",
  AddressField:
    "@stackra/ui's native address field component vs @stackra/validation's address field type; different things",
  CATEGORIES:
    "repo-checks' member categories vs the showcase's component categories; different lists",
  CommentThread:
    "@stackra/collaboration's comment thread model vs @stackra/ui's native comment thread component",
  ContextMenu:
    "@stackra/navigation's native long-press menu on a navigation item vs @stackra/ui's web context menu component",
  ContextMenuProps: "the props of the two ContextMenu components above",
  FilterKind:
    "@stackra/panel's SDUI filter controls (nine codes, the spec's `control`) vs @stackra/ui's six FilterBar editors; the panel's list renderer maps one onto the other",
  Flag: "@stackra/feature-flags' Flag kind (a declared feature flag) vs @stackra/ui's web country flag component",
  CreateCommand:
    "@stackra/console's `stackra-console create` command class vs @stackra/cli's `stackra create`, which goes when stackra moves onto the console (STA-1966)",
  Meter: "@stackra/model's usage-meter decorator vs @stackra/ui's native meter component",
  Platform: "@stackra/platform's device platform port vs the showcase's web/native platform enum",
  RenderContext:
    "@stackra/console's per-run terminal driver context (mode, theme, streams) vs @stackra/experience's document render context (locale, block handlers)",
  Renderer:
    "@stackra/console's terminal output port vs @stackra/experience's L2-document-to-elements port (web and native); neither package may import the other",
  STACKRA_THEME:
    "@stackra/console's terminal theme (an ASCII logo, a gradient, an accent, a glyph) vs @stackra/tokens' design-system theme",
  Spinner:
    "@stackra/console's running-spinner handle (update, stop) vs @stackra/ui's native spinner component",
  TableColumn:
    "@stackra/console's terminal table column contract (row key, kind, alignment) vs @stackra/ui's Table component column (sort, width, pin)",
  shapeArabic:
    "@stackra/console depends on no domain package (ADR 0506 decision 5), so it shapes terminal text itself; @stackra/documents shapes PDF text",
  // One shape, kept by the design system so it depends on no domain package.
  HourCycle:
    "@stackra/ui sits below the domain packages and imports none of them (ADR 0302), so it declares the shape its component takes; @stackra/i18n's enum has the same values",
  RuleBuilder:
    "@stackra/ui sits below the domain packages and imports none of them (ADR 0302), so it declares the shape its component takes; @stackra/rules' web RuleBuilder is the domain one; ui's is the native renderer",
  RuleBuilderProps: "the props of the two RuleBuilder components above",
  RuleField:
    "@stackra/ui sits below the domain packages and imports none of them (ADR 0302), so it declares the shape its component takes; @stackra/rules maps its field onto it",
  SocialProvider:
    "@stackra/ui sits below the domain packages and imports none of them (ADR 0302), so it declares the shape its component takes; @stackra/identity's enum names the same providers",
  WidgetSize:
    "@stackra/ui sits below the domain packages and imports none of them (ADR 0302), so it declares the shape its component takes; @stackra/panel's enum has the same sizes",
  BarcodeFormat:
    "@stackra/ui sits below the domain packages and imports none of them (ADR 0302), so it declares the formats its Barcode draws; @stackra/platform's type names what a device scanner reads",
  CODE128_PATTERNS:
    "@stackra/ui depends on no helper package (ADR 0302 keeps it to config, contracts, i18n, icons, tokens and validation), so its Barcode keeps the Code 128 table beside @stackra/support's",
  RecurrenceRule:
    "@stackra/ui sits below the domain packages and imports none of them (ADR 0302), so it declares the rule its recurrence editor takes; @stackra/calendar's is the domain one",
  parseRrule:
    "@stackra/ui sits below the domain packages and imports none of them (ADR 0302), so its recurrence editor reads RRULE text itself; @stackra/calendar's parser is the domain one",
  changeOf:
    "@stackra/ui sits below the domain packages and imports none of them (ADR 0302), so its Stat computes its own change; @stackra/panel's is the panel widget's",
  periodOf:
    "@stackra/ui sits below the domain packages and imports none of them (ADR 0302), so its period picker resolves its own period; @stackra/actions' is the action input's",
  // A port's shape and the store that persists it, or a stand-in where the owner cannot be a dependency.
  ApprovalBinding:
    "@stackra/actions' contract type of a parked call vs @stackra/tenancy's model that stores it for the approval-binding store; the model's name derives its locked key and table (ADR 0509)",
  StepUpRequiredError:
    "@stackra/actions' testing stand-in for its memory ActorStatusCheck, since actions cannot depend on @stackra/identity, whose refusal of the same code is the real one",
  DbMigrateCommand:
    "@stackra/cli's `stackra db:migrate` (the release step, any environment) loads the member's own @stackra/database/node at run time, so the CLI never depends on MikroORM; @stackra/database's is the command that member's console runs",
  DbRollbackCommand:
    "@stackra/cli's `stackra db:rollback` refuses staging and production before it loads the member's @stackra/database/node, so the CLI never depends on MikroORM; @stackra/database's is the command that member's console runs",
  DatabaseRunner:
    "@stackra/cli declares the runner shape it needs and loads @stackra/database/node from the member at run time, so the CLI never depends on MikroORM; the database package's service is the real runner",
});
