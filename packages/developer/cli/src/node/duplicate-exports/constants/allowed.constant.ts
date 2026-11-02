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
  AddressField:
    "@stackra/ui's native address field component vs @stackra/validation's address field type; different things",
  CATEGORIES:
    "repo-checks' member categories vs the showcase's component categories; different lists",
  CommentThread:
    "@stackra/collaboration's comment thread model vs @stackra/ui's native comment thread component",
  ContextMenu:
    "@stackra/navigation's native long-press menu on a navigation item vs @stackra/ui's web context menu component",
  ContextMenuProps: "the props of the two ContextMenu components above",
  Meter: "@stackra/model's usage-meter decorator vs @stackra/ui's native meter component",
  Platform: "@stackra/platform's device platform port vs the showcase's web/native platform enum",
  STACKRA_THEME:
    "@stackra/console's terminal theme (an ASCII logo, a gradient, an accent, a glyph) vs @stackra/tokens' design-system theme",
  Spinner:
    "@stackra/console's running-spinner handle (update, stop) vs @stackra/ui's native spinner component",
  findCommand:
    "@stackra/console's lookup in a registry of Command classes vs @stackra/cli's lookup in its CliCommand list, which goes when stackra moves onto the console (STA-1966)",
  runCommand:
    "@stackra/console's dispatch of one parsed command vs @stackra/runway's child-process helper",
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
  SavedView:
    "@stackra/ui sits below the domain packages and imports none of them (ADR 0302), so it declares the shape its component takes; @stackra/panel's schema validates the stored one",
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
});
