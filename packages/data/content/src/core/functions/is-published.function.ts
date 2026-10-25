/**
 * Stackra file contract:
 * Purpose: `isPublished`, whether a `Publishable` record is live at `now`: published, or scheduled for a time that
 *          has come. A reader filters on it, so a scheduled record is live on time even before the scheduler's job
 *          flips its status.
 * Boundary: pure; `now` is the caller's clock.
 * Runtime: isomorphic
 * Governing contract: ADR 0321 (decisions 2 and 6).
 */
import { PublicationStatus } from "#core/enums/publication-status.enum";

/**
 * Whether `record` is live at `now`.
 *
 * @example
 * isPublished({ publicationStatus: PublicationStatus.Scheduled, publishAt: monday }, tuesday); // true
 */
export function isPublished(
  record: { readonly publicationStatus: PublicationStatus; readonly publishAt: Date | null },
  now: Date,
): boolean {
  if (record.publicationStatus === PublicationStatus.Published) return true;
  return (
    record.publicationStatus === PublicationStatus.Scheduled &&
    record.publishAt !== null &&
    record.publishAt.getTime() <= now.getTime()
  );
}
