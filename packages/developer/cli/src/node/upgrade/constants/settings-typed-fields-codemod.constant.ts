/**
 * Stackra file contract:
 * Purpose: `SETTINGS_TYPED_FIELDS_CODEMOD`, 0.29.0: gen refuses a settings field no setting type holds and records
 *          the settings in the manifest.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0013 (decision 5); STA-145; changeset 1b727b9.
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** Gen refuses a settings field no setting type holds. */
export const SETTINGS_TYPED_FIELDS_CODEMOD: UpgradeCodemod = {
  id: "settings-typed-fields",
  version: "0.29.0",
  title: "Gen refuses a settings field no setting type holds",
  note: "Gen refuses settings_unsupported_type, settings_scope_widened, settings_too_deep, settings_group_key_empty and settings_group_conflict, writes an enum setting as a choice key with its options and a string array as a list key, and records every group and key in the manifest's settings section. Fix each refused field; a later group or key rename needs @Renamed. stackra gen regenerates the manifest.",
  source: "1b727b9",
};
