/**
 * Stackra file contract:
 * Purpose: `requireAssurance`, the step-up check: refuses `step_up_required` unless the session's assurance reaches the
 *          level an action needs and its last authentication is within `IdentityConfig.stepUpMaxAgeMinutes`.
 * Boundary: pure: the time is a parameter. Which actions need which level is rule and settings data (ADR 0207's L3 and
 *           L4 default, a product's step-up list); this function only compares.
 * Runtime: isomorphic
 * Governing contract: ADR 0207 (decision 1); owner round 3 #15 (step-up); PUT-37 (step-up actions as settings).
 */
import { Enum } from "@stackra/contracts";

import type { IdentityConfig } from "#config/identity.config";
import { AssuranceLevel } from "#core/enums/assurance-level.enum";
import { StepUpRequiredError } from "#core/errors/step-up-required.error";
import type { Assurance } from "#core/types/assurance.type";

/** The levels, weakest first. */
const ORDER: readonly AssuranceLevel[] = Enum.values(AssuranceLevel);

/**
 * Throws unless `assurance` meets `required` at `now`.
 *
 * @throws StepUpRequiredError when the level is lower, unknown, or the authentication is older than the window.
 * @example
 * requireAssurance(assuranceOf(claims, identity), AssuranceLevel.Aal2, identity, ctx.now());
 */
export function requireAssurance(
  assurance: Assurance,
  required: AssuranceLevel,
  config: Pick<IdentityConfig, "stepUpMaxAgeMinutes">,
  now: Date,
): void {
  const { level, authenticatedAt } = assurance;
  const strongEnough = level !== undefined && ORDER.indexOf(level) >= ORDER.indexOf(required);
  const fresh =
    authenticatedAt !== undefined &&
    now.getTime() - authenticatedAt.getTime() <= config.stepUpMaxAgeMinutes * 60_000;
  if (!strongEnough || !fresh) throw StepUpRequiredError.create({ required });
}
