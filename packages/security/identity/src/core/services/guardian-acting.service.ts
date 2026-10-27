/**
 * Stackra file contract:
 * Purpose: `GuardianActingService`, a guardian acting for a minor: checks that the acting user holds a live guardian
 *          link to the minor, that the purpose is not one the link restricts, and (given the pack's age) that the minor
 *          is still under it; then returns the delegated principal the action records.
 * Boundary: over `Guardianship` and `Clock`. It refuses with `GuardianshipMissingError`, never saying which check
 *           failed. Only a signed-in user acts for someone; an agent or a service never does here. The guardian's own
 *           permissions still decide the action (the IAM decision point), so this grants nothing.
 * Runtime: isomorphic
 * Governing contract: OS-284 (a guardian acting for a minor); ADR 0361 (decisions 2 and 3); ACA-57, ACA-60, ACA-68.
 */
import { Service } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import { type Actor, ActorKind, type PublicId } from "@stackra/contracts";

import type { Guardianship } from "#contracts/index";
import { GuardianshipMissingError } from "#core/errors/guardianship-missing.error";
import { ageOn } from "#core/functions/age-on.function";
import type { ActForOptions } from "#core/types/act-for-options.type";
import type { DelegatedPrincipal } from "#core/types/delegated-principal.type";

/**
 * Lets a guardian act for a minor.
 *
 * @example
 * const delegated = await guardians.actFor(ctx.actor, input.childId, { purpose: "photos", birthDate, ageOfMajority });
 */
export class GuardianActingService extends Service {
  /** The guardian links. */
  private readonly guardianship: Guardianship;

  /** The current time. */
  private readonly clock: Clock;

  /**
   * @param guardianship - the parties service's guardian links.
   * @param clock - the current time.
   */
  constructor(guardianship: Guardianship, clock: Clock) {
    super();
    this.guardianship = guardianship;
    this.clock = clock;
  }

  /**
   * The delegated principal of `guardian` acting for `minor`.
   *
   * @throws GuardianshipMissingError when `guardian` is not a user, has no live link to `minor`, the link restricts the
   *         purpose, or `minor` is of age.
   * @throws RangeError when `birthDate` or `on` is not `YYYY-MM-DD`.
   */
  async actFor(
    guardian: Actor,
    minor: PublicId,
    options: ActForOptions,
  ): Promise<DelegatedPrincipal> {
    if (guardian.kind !== ActorKind.User || guardian.id === minor)
      throw GuardianshipMissingError.create();
    const now = this.clock.now();
    const link = await this.guardianship.link(guardian.id, minor);
    if (
      link === undefined ||
      (link.until !== undefined && link.until.getTime() <= now.getTime()) ||
      link.restrictions.includes(options.purpose)
    )
      throw GuardianshipMissingError.create();
    if (options.birthDate !== undefined && options.ageOfMajority !== undefined) {
      const on = options.on ?? now.toISOString().slice(0, 10);
      if (ageOn(options.birthDate, on) >= options.ageOfMajority)
        throw GuardianshipMissingError.create();
    }
    return {
      principal: minor,
      actingBy: guardian.id,
      relationship: link.relationship,
      purpose: options.purpose,
      at: now,
    };
  }
}
