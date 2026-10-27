/**
 * Stackra file contract:
 * Purpose: `EDIFACT_ORDER`, a recorded EDIFACT D.96A ORDERS with a UNA header and an escaped colon, from a made-up
 *          supplier to Figentra, for the EDI envelope and connector tests.
 * Boundary: test data only; hand-written from the public EDIFACT envelope rules, certification pending (owner D3,
 *           2026-10-27). No real partner, GLN of a real company or trading data.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0447 (decision 4); stackra-46 re-scope (R2-7, M6).
 */

/** An EDIFACT ORDERS from 14:5012345678901 to 14:6291041500213, interchange 77, test. */
export const EDIFACT_ORDER = [
  "UNA:+.? '",
  "UNB+UNOC:3+5012345678901:14+6291041500213:14+261028:0930+77++++++1'",
  "UNH+1+ORDERS:D:96A:UN'",
  "BGM+220+PO-7782+9'",
  "NAD+BY+5012345678901::9'",
  "FTX+AAI+++Fragile?: handle with care'",
  "UNT+5+1'",
  "UNZ+1+77'",
  "",
].join("\n");
