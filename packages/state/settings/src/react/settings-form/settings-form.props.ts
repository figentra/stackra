/**
 * Stackra file contract:
 * Purpose: `SettingsFormProps`, what the web `SettingsForm` takes: the generated page it renders, as on native.
 * Boundary: a type only. The page carries its keys, labels, bounds and scope, so nothing here names a field, and its
 *           lang keys are the words (ADR 0504 decision 4).
 * Runtime: browser
 * Governing contract: ADR 0305 (props in `<name>.props.ts`); ADR 0307 (rule 24); ADR 0302 (decision 3: one API on
 *                     web and native).
 */
import type { SettingsPage } from "#core/index";

/** The props of the web settings form. */
export interface SettingsFormProps {
  /** The page to render, from the member's generated `SettingsPages`. */
  readonly page: SettingsPage;
}
