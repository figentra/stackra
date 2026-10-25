/**
 * Stackra file contract:
 * Purpose: `SettingEnvironment`, where a settings write lands: a live tenant, its sandbox, or a tenant still in its
 *          setup phase (before its first publish).
 * Boundary: an `Enum.of` value plus the type of the same name. The caller (the OS tenancy context) says which one
 *           applies; `SettingsResolver#write` refuses a key that is not live-editable on live, and allows every key in
 *           a sandbox and during setup (where an edit applies to live with its revision as the audit).
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decisions 3 to 5 and 9); OS ADR 0006 (decisions 1 and 2); config-model section 3.
 */
import { Enum } from "@stackra/contracts";

/** The environments a write can land in. */
export const SettingEnvironment = Enum.of({
  /** A published tenant: only live-editable keys change in place. */
  Live: "live",
  /** A sandbox: every key changes here and reaches live by promotion. */
  Sandbox: "sandbox",
  /** Before the first publish: every edit applies to live, with its revision as the audit. */
  Setup: "setup",
});

/** One of the codes above. */
export type SettingEnvironment = Enum.Value<typeof SettingEnvironment>;
