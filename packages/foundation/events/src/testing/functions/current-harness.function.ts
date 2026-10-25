/**
 * Stackra file contract:
 * Purpose: `currentHarness`, the event plumbing of the testing app compiled last.
 * Boundary: reads `CURRENT_HARNESS`; a helper called before any app compiled is a test bug, so it throws. Internal:
 *           not exported from the entry.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3).
 */
import { CURRENT_HARNESS } from "#testing/constants/current-harness.constant";
import type { EventsHarness } from "#testing/types/events-harness.type";

/**
 * The current harness.
 *
 * @throws Error when no testing app has been compiled since the events testing entry loaded.
 */
export function currentHarness(): EventsHarness {
  const harness = CURRENT_HARNESS.value;
  if (harness === undefined)
    throw new Error(
      "No testing app: compile one with createTestingModule(Root).compile() before using the event helpers",
    );
  return harness;
}
