/**
 * Stackra file contract:
 * Purpose: `ResourceValueProps`, the props of the web and native `ResourceValue`: one `ValueCell`.
 * Boundary: props only; internal to the resource pages of both entries.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 1: wire paths); ADR 0164.
 */
import type { ValueCell } from "#core/types/value-cell.type";

/** Props of `ResourceValue`. */
export type ResourceValueProps = ValueCell;
