/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./native` entry of @stackra/settings (the generated settings page's form) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. React Native only; it imports the core through `#core/index`.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { SettingsForm } from "#native/settings-form/settings-form";
export type { SettingsFormProps } from "#native/settings-form/settings-form.props";
