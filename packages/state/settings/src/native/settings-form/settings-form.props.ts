/**
 * Stackra file contract:
 * Purpose: `SettingsFormProps`, what `SettingsForm` takes: the generated page it renders.
 * Boundary: a type only. The page carries its keys, labels, bounds and scope, so nothing here names a field.
 * Runtime: react-native
 * Governing contract: ADR 0305 (props in `<name>.props.ts`); ADR 0307 (rule 24).
 */
import type { SettingsPage } from "#core/index";

/** The props of the settings form. */
export interface SettingsFormProps {
  /** The page to render, from the member's generated `SettingsPages`. */
  readonly page: SettingsPage;
}
