/**
 * Stackra file contract:
 * Purpose: `SHOWCASE_NUMERALS`, the digits the playground's Display menu offers (`?numerals=`), first the default:
 *          Latin, then Arabic-Indic. A customer's setting in a product; a viewer's pick here.
 * Boundary: data only; the setting is @stackra/i18n's (`I18nProvider`'s `numerals`), applied by its shared formatters.
 * Runtime: browser
 * Governing contract: ADR 0192 (decision 2, as amended 2026-10-28: the digits are a per-customer setting).
 */
import { NumberingSystem } from "@stackra/i18n";

/** The digits on offer, the default first. */
export const SHOWCASE_NUMERALS = Object.freeze([
  NumberingSystem.Latn,
  NumberingSystem.Arab,
] as const);
