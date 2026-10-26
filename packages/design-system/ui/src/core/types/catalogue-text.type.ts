/**
 * Stackra file contract:
 * Purpose: `CatalogueText`: formats one key with its ICU values.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0080; ADR 0268 (R15: ICU, typed keys);
 *          ADR 0403 (catalogues in seven languages).
 */
import type { I18nKey } from "@stackra/i18n";

/** Formats one key with its ICU values. */
export type CatalogueText = (key: I18nKey, values?: Readonly<Record<string, unknown>>) => string;
