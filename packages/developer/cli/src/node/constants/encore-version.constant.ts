/**
 * Stackra file contract:
 * Purpose: `ENCORE_VERSION`, the `encore.dev` version `stackra new service` pins when the workspace names none (no root
 *          package.json `stackra.encore`, no default catalog `encore.dev`), such as a fresh workspace. Gen writes an
 *          Encore service declaration for every service, so a new service declares `encore.dev` from the start.
 * Boundary: data only. A test holds it equal to this repository's root package.json `stackra.encore`, so a bump there
 *           fails until this follows it.
 * Runtime: node
 * Governing contract: ADR 0091 (decision 2, amendment of 2026-11-09: `encore.dev` is a literal version); STA-2794.
 */

/** The `encore.dev` version a new service pins by default. */
export const ENCORE_VERSION = "1.58.8";
