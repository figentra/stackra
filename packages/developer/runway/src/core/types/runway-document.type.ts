/**
 * Stackra file contract:
 * Purpose: `RunwayDocument`, each runway kind to its parsed type, so `parseRunway(kind, …)` returns the type of the
 *          kind it was given.
 * Boundary: type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decisions 1 and 2).
 */
import type { AppRunway } from "#core/types/app-runway.type";
import type { RootRunway } from "#core/types/root-runway.type";
import type { ServiceRunway } from "#core/types/service-runway.type";

/** Runway kind to parsed document. */
export type RunwayDocument = {
  /** The repository root's runway. */
  root: RootRunway;
  /** An app member's runway. */
  app: AppRunway;
  /** A service member's runway. */
  service: ServiceRunway;
};
