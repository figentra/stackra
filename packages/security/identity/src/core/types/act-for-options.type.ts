/**
 * Stackra file contract:
 * Purpose: `ActForOptions`, what `GuardianActingService.actFor` takes beside the two principals: the purpose and, to
 *          end the guardianship at an age, the minor's birth date with the age the market pack sets.
 * Boundary: a type only. The age is market-pack data (a legal floor) or a stricter product setting, never a number in
 *           code; without it the link alone decides.
 * Runtime: isomorphic
 * Governing contract: OS-284; ADR 0370 (legal floors in packs); ACA-68.
 */

/** The options of acting for someone. */
export interface ActForOptions {
  /** What the guardian acts for (`enrolment`, `photos`, `pickup`); a restricted purpose is refused. */
  readonly purpose: string;

  /** The minor's birth date, `YYYY-MM-DD`. */
  readonly birthDate?: string;

  /** The age from which a person acts for themself (from the market pack); needs `birthDate`. */
  readonly ageOfMajority?: number;

  /** The date the age is judged on, `YYYY-MM-DD`; today (UTC) when absent. */
  readonly on?: string;
}
