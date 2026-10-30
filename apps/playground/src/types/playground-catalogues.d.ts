/**
 * Stackra file contract:
 * Purpose: the type of `virtual:playground-catalogues`, the module `cataloguesPlugin` serves: every catalogue of the
 *          playground by locale, then namespace.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (conventions 1); STA-1371 (playground dev speed).
 */
declare module "virtual:playground-catalogues" {
  import type { Messages } from "@stackra/i18n";

  /** Every catalogue of the playground, by locale, then namespace. */
  const CATALOGUES: Readonly<Record<string, Messages>>;
  export default CATALOGUES;
}
