/**
 * Stackra file contract:
 * Purpose: `SettingsClass`, the base class `Settings({...})` returns, which a module's settings class extends.
 * Boundary: a type only, one abstract construct signature, so `class X extends Settings({...})` resolves one base type
 *           and a consumer's declaration emit can name it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 25: every factory returns an exported, named class type).
 */
import type { Settings } from "#core/bases/settings.base";

/** The base class of one settings group. */
export type SettingsClass = abstract new () => Settings;
