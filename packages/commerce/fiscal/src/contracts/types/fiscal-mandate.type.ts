/**
 * Stackra file contract:
 * Purpose: `FiscalMandate`, one channel of a market pack's fiscal section: the driver key, its options, the
 *          guest-check document mode, and the two legal floors this package enforces (the offline reporting window
 *          and the retention period).
 * Boundary: a type only; pack data read through `FiscalPackSource`. `options` is unvalidated pack data: the driver
 *           parses it with its own schema and refuses what does not fit. No value here has a default in code.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 2 and 3); ADR 0363 (decisions 3 and 4).
 */
import type { CheckDocumentMode } from "#contracts/enums/check-document-mode.enum";

/** What a pack says about one channel in one market on one date. */
export type FiscalMandate = {
  /** The driver key (`zatca`, `peppol`, `tse`); the registered driver with this key serves the channel. */
  readonly driver: string;
  /** The driver's options for this market: endpoints, versions, profile ids, code mappings, time zone. */
  readonly options: Readonly<Record<string, unknown>>;
  /** Hours a sealed record may wait for submission before the unit must stop issuing; `null` when the law sets none. */
  readonly reportingWindowHours: number | null;
  /** Years fiscal records must be kept; `null` when the pack sets none. */
  readonly retentionYears: number | null;
  /**
   * How a guest check paid in parts is documented (till channel); absent when the pack does not say, and then
   * `FiscalService.sealCheck` refuses rather than pick one.
   */
  readonly checkDocument?: CheckDocumentMode;
};
