/**
 * Stackra file contract:
 * Purpose: unit tests of `isPublished`: a published record is live, a draft is not, and a scheduled one goes live at
 *          its time.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0321 (decisions 2 and 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { PublicationStatus } from "#core/enums/publication-status.enum";
import { isPublished } from "#core/functions/is-published.function";

const MONDAY = new Date("2026-10-26T09:00:00Z");
const TUESDAY = new Date("2026-10-27T09:00:00Z");

describe(isPublished, () => {
  it("answers per state and time", () => {
    const at = (publicationStatus: PublicationStatus, publishAt: Date | null) => ({
      publicationStatus,
      publishAt,
    });
    expect(isPublished(at(PublicationStatus.Published, null), MONDAY)).toBe(true);
    expect(isPublished(at(PublicationStatus.Draft, MONDAY), TUESDAY)).toBe(false);
    expect(isPublished(at(PublicationStatus.Scheduled, TUESDAY), MONDAY)).toBe(false);
    expect(isPublished(at(PublicationStatus.Scheduled, MONDAY), MONDAY)).toBe(true);
    expect(isPublished(at(PublicationStatus.Scheduled, null), TUESDAY)).toBe(false);
  });
});
