/**
 * Stackra file contract:
 * Purpose: the `ConsentAuthority` port: whether one person may consent for another to one document or purpose, and as
 *          what (`guardian`), answered from the relationship records the owning service keeps.
 * Boundary: an abstract class that is its own token. The parties and identity services implement it (the guardian link,
 *           custody restrictions); this package never decides who is a guardian. An age floor (who needs a guardian)
 *           is market-pack data the caller applies with `needsGuardianConsent`.
 * Runtime: isomorphic
 * Governing contract: OS-284 (consent on behalf of another); ADR 0361 (decision 3: parties); ADR 0263.
 */
import { Port, type PublicId } from "@stackra/contracts";

/**
 * Answers who may consent for whom.
 *
 * @example
 * const relationship = await authority.relationshipOf(parent.id, child.id, "photos"); // "guardian" or undefined
 */
export abstract class ConsentAuthority extends Port {
  /**
   * How `givenBy` may consent for `subject` to `document`, or `undefined` when they may not.
   *
   * @throws Error when the records cannot be read; the consent is then not recorded.
   */
  abstract relationshipOf(
    givenBy: PublicId,
    subject: PublicId,
    document: string,
  ): Promise<string | undefined>;
}
