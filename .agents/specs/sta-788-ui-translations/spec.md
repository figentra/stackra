# Feature Specification: ui and ui-pro words from the catalogues, and the placeholder check

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-788 (remainder)

**Clarifications status**: complete

**Input**: Move the ui and ui-pro components (web and native) from English constants to `useTranslation` on the
existing catalogue keys, and add an ICU placeholder comparison to the catalogue-completeness check.

## Impact

- **Apps touched**: none
- **Packages touched**: packages/design-system/ui, packages/design-system/ui-pro; tools/scripts/catalogue-completeness.mjs
- **Secrets**: none
- **ADR needed**: no (ADR 0403 and 0080)
- **New dependencies**: `@stackra/i18n` (workspace) in ui and ui-pro; the lockfile is not updated here
- **Lane**: lite
- **Change risk**: R1

## Requirements

- **FR-001** `useCatalogueText(english)` (ui core): the provider's `t`, or the package's English catalogue when no
  `I18nProvider` is mounted or it lacks the key; `useUiText` and `useUiProText` bind it to `ui::*` and `ui_pro::*`.
- **FR-002** Every web and native ui component's default words come from `UI_KEYS`; caller labels still win.
  Developer-only console messages stay English.
- **FR-003** ui-pro defaults: code block copy, chat attach, sidebar rail, navbar menu toggle, plan step status words
  (`ui_pro::enums.plan_step_status.*`), approval status words, scheduler actions. Labels the contract requires
  (conversation, table of contents) stay required; the chat loader stays decorative without a label.
- **FR-004** `catalogue-completeness.mjs` compares each translation's ICU placeholders with English and refuses a
  message that does not parse.

## Not built here

- Native-speaker review of the machine-translated catalogues (ADR 0192).
- `pnpm install` to link `@stackra/i18n` into ui and ui-pro (lockfile is the owner's).
- Tests are written but not run (owner mode).
