/**
 * Stackra file contract:
 * Purpose: `RegistryAccess`, what a catalogue client needs: the registry origin and, for `@stackra-pro`, the licence
 *          token (`STACKRA_LICENCE_TOKEN`).
 * Boundary: type only; the token is passed to the client and never printed.
 * Runtime: node
 * Governing contract: ADR 0453 (decisions 1, 10 and 13).
 */

/** Where the registry is and how to read it. */
export type RegistryAccess = {
  /** The registry origin, `https://npm.stackra.figentra.com/` by default. */
  readonly origin: string;
  /** The licence token, when one is set. */
  readonly token: string | undefined;
};
