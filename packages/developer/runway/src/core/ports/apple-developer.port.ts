/**
 * Stackra file contract:
 * Purpose: the `AppleDeveloper` port: the App Store Connect calls mobile onboarding makes: find and register a bundle
 *          id, enable a capability on it, and find the app record of a bundle id.
 * Boundary: an abstract class that is its own token; the real driver signs App Store Connect API requests with the
 *           root kit's key read by name in CI, the memory driver keeps state in the process for tests and dry runs.
 *           The API cannot create an app record, so the port has no such call (ADR 0480 decision 4).
 * Runtime: isomorphic
 * Governing contract: ADR 0482 (decision 4), ADR 0480 (decisions 3 and 4), ADR 0263 (ports resolve by type).
 */
import { Port } from "@stackra/contracts";

import type { AppleCapability } from "#core/enums/apple-capability.enum";
import type { AppleBundle } from "#core/types/apple-bundle.type";

/** Apple's developer and App Store Connect side. */
export abstract class AppleDeveloper extends Port {
  /** The bundle id `identifier`, or `null` when it is not registered. */
  abstract findBundle(identifier: string): Promise<AppleBundle | null>;

  /** Registers `identifier` under `name` and answers its resource id. */
  abstract registerBundle(identifier: string, name: string): Promise<string>;

  /** Enables `capability` on the bundle resource `bundle`. */
  abstract enableCapability(bundle: string, capability: AppleCapability): Promise<void>;

  /** The App Store Connect app id of `identifier`, or `null` when no app record exists. */
  abstract findApp(identifier: string): Promise<string | null>;
}
