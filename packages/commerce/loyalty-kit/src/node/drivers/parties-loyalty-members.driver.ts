/**
 * Stackra file contract:
 * Purpose: `PartiesLoyaltyMembersDriver`, the `LoyaltyMembers` answer over the OS parties service: a member is a live
 *          person there (`parties.person.get@1` finds it, and it is neither merged away nor erased).
 * Boundary: abstract, so it is never bound as it stands: the generated `PartiesClient` lives in the host
 *           (`#stackra/clients/parties`, ADR 0260 decision 3) and a package cannot import it, so the host subclasses
 *           this driver and declares its client as `parties`, injected into its own constructor (a class token, ADR 0294
 *           rule 17). The client is typed by the
 *           one call it makes, so no OS package is a dependency. Only a not-found refusal answers "not a member";
 *           every other failure (unreachable service, forbidden) throws, so a redemption fails closed.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 15 and 16); ADR 0260 (decisions 3 and 9); OS ADR 0013 (parties); STA-804.
 */
import { Driver } from "@stackra/container";
import { isRefusal, NotFoundError } from "@stackra/errors";

import { LoyaltyMembers } from "#contracts/ports/loyalty-members.port";
import type { MemberId } from "#contracts/types/member-id.type";

/**
 * Membership read from the parties service; the member id is the person's public id.
 *
 * @example
 * // the host's driver, over the client gen wrote for it
 * export class OsLoyaltyMembersDriver extends PartiesLoyaltyMembersDriver {
 *   protected override readonly parties: PartiesClient;
 *
 *   constructor(parties: PartiesClient) {
 *     super();
 *     this.parties = parties;
 *   }
 * }
 */
export abstract class PartiesLoyaltyMembersDriver extends Driver(LoyaltyMembers) {
  /** The host's generated `PartiesClient`, typed by the one call this driver makes. */
  protected abstract readonly parties: {
    readonly person: {
      readonly get: {
        call(input: { readonly id: string }): Promise<{
          readonly mergedInto: string | null;
          readonly erasedAt: unknown;
        }>;
      };
    };
  };

  /** A live person is a member; an unknown, merged-away or erased one is not. */
  async isMember(principalId: MemberId): Promise<boolean> {
    try {
      const person = await this.parties.person.get.call({ id: principalId });
      return person.mergedInto === null && person.erasedAt === null;
    } catch (error) {
      if (isRefusal(error, NotFoundError)) return false;
      throw error;
    }
  }
}
