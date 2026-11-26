/**
 * Stackra file contract:
 * Purpose: `EncoreCloudLink`, whether this workstation's Encore CLI can reach a service's Encore Cloud app: `linked`, or
 *          not, with the reason Encore gave (`not logged in`, an app it cannot find, no network).
 * Boundary: type only; `encoreCloudLink` answers it and `runEncoreDev` acts on it.
 * Runtime: node
 * Governing contract: ADR 0091 (amendment of 2026-11-09, rule 1: the generated `encore.app`); ADR 0525 (amendment of
 *                     2026-11-10: dev secret values come from the workspace file, never from a cloud); STA-2794.
 */

/** The answer of one Encore Cloud probe. */
export type EncoreCloudLink =
  | {
      /** The CLI is logged in and reads the app: `encore run` can fetch its secrets. */
      readonly linked: true;
    }
  | {
      /** The CLI cannot read the app, so `encore run` would stop at "Fetching application secrets". */
      readonly linked: false;

      /** Encore's own last error line, or why the probe could not run. */
      readonly reason: string;
    };
