/**
 * Stackra file contract:
 * Purpose: `EcrTerminalGatewayOptions`, what `EcrTerminalGateway` is built with on the till: the terminal Connection
 *          id, the provider's `EcrProfile`, the link to the paired terminal and the till's currency.
 * Boundary: a type in the leaf entry; the profile is pack data and the currency a till setting.
 * Runtime: isomorphic
 * Governing contract: ADR 0377 (decisions 1 and 8).
 */
import type { EcrLink } from "#contracts/types/ecr-link.type";
import type { EcrProfile } from "#contracts/types/ecr-profile.type";

/** The gateway's construction. */
export interface EcrTerminalGatewayOptions {
  /** The till's terminal Connection id, recorded on each payment. */
  readonly id: string;

  /** The provider's protocol, from the pack. */
  readonly profile: EcrProfile;

  /** The link to the paired terminal (`EcrCardTerminalDriver` of `@stackra/peripherals/desktop`). */
  readonly link: EcrLink;

  /** The till's currency (a till setting): the currency of an answer read back by an inquiry. */
  readonly currency: string;
}
