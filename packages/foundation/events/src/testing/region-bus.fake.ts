/**
 * Stackra file contract:
 * Purpose: `RegionBusFake`, the in-memory `RegionBus` of a test: it keeps every record sent to the other regions for
 *          `sent()`.
 * Boundary: a port fake (ADR 0269). It delivers nowhere: a test of the receiving region calls
 *           `deliverRemoteEvent` with the copy. A send is recorded as `calls("send")`.
 * Runtime: node
 * Governing contract: ADR 0269 (decisions 2 and 3); ADR 0294 (amendment item 12: `<name>.fake.ts`); STA-1268.
 */
import { Fake } from "@stackra/testing";

import { RegionBus } from "#contracts/index";
import type { RecordedEvent } from "#contracts/index";

/**
 * The region bus fake.
 *
 * @example
 * const app = await createTestingModule(PlanCatalogueModule).override(RegionBus, new RegionBusFake()).compile();
 */
export class RegionBusFake extends Fake.of(RegionBus) {
  /** Records the call. */
  async send(records: readonly RecordedEvent[]): Promise<void> {
    this.record("send", records);
  }

  /** Everything ever sent, oldest first. */
  sent(): readonly RecordedEvent[] {
    return this.calls("send").flat();
  }
}
