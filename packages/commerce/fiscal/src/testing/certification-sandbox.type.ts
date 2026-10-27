/**
 * Stackra file contract:
 * Purpose: `CertificationSandbox`, what a sandbox certification run takes from config: the issued endpoints and
 *          codes, the registered seller, and a buyer the sandbox knows.
 * Boundary: a type only, in the `./testing` entry; credentials stay in the caller's ports, never here.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 1 to 4); ADR 0269 (fixtures in the owning package's `./testing`);
 *                     owner decision D3 (2026-10-27): certification pending until a sandbox run passes.
 */
import type { FiscalParty } from "#contracts/types/fiscal-party.type";

/** What a sandbox run takes from config. */
export type CertificationSandbox = {
  /** Pack option overrides: the sandbox endpoints and codes issued with the access. */
  readonly options?: Readonly<Record<string, unknown>>;
  /** The issuer registered with the sandbox (its name, tax number, address). */
  readonly seller?: Partial<FiscalParty>;
  /** A buyer the sandbox knows (a registered tax number), when the case's buyer would be refused. */
  readonly buyer?: FiscalParty | null;
};
