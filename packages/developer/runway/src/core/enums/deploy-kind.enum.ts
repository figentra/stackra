/**
 * Stackra file contract:
 * Purpose: `DeployKind`, the kinds of member an environment's `destinations` places: services, web apps, mobile apps,
 *          desktop apps and the docs site. Each is a key of `environments.<env>.destinations` and of a deploy target.
 * Boundary: an `Enum.of` value plus the type of the same name. Which destination serves a kind is runway data.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 2), ADR 0170 (what deploys where), ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** One case per destination key, in build order. */
export const DeployKind = Enum.of({
  /** Service members, packed by the topology into processes. */
  Services: "services",
  /** Web app members. */
  Web: "web",
  /** Mobile app members. */
  Mobile: "mobile",
  /** Desktop app members. */
  Desktop: "desktop",
  /** The docs site. */
  Docs: "docs",
});

/** One of the codes above. */
export type DeployKind = Enum.Value<typeof DeployKind>;
