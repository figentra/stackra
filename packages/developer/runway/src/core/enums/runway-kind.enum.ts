/**
 * Stackra file contract:
 * Purpose: the three kinds of runway file: the repository's root runway (WHERE things run and how they are packed)
 *          and the member runways of an app and of a service (WHAT the member needs). Each code is also the name of
 *          its JSON Schema file, `@stackra/runway/schema/<code>.json`.
 * Boundary: an `Enum.of` value plus the type of the same name. A package has no runway.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decisions 1 and 2), ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** One case per runway JSON Schema. */
export const RunwayKind = Enum.of({
  /** The root `runway.yaml`: providers, destinations, shared pools, defaults and topology. */
  Root: "root",
  /** An app member's `runway.yaml`: its dev port, domains, public vars, release channels and config values. */
  App: "app",
  /** A service member's `runway.yaml`: its dedicated `requires`, secret names, sizes, queues and config values. */
  Service: "service",
});

/** One of the codes above. */
export type RunwayKind = Enum.Value<typeof RunwayKind>;
