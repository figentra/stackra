/**
 * Stackra file contract:
 * Purpose: `CURRENT_TESTING_APP`, the testing app compiled last, from which `RecordedEventsSubscriber` reads the running
 *          call (its `ContextStorage`) when it commits recorded events (STA-1789).
 * Boundary: set by the database testing plugin on every `compile()`; undefined before the first. Internal: not exported
 *           from the entry.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3).
 */
import type { TestingApp } from "@stackra/container/testing";

/** The app compiled last, if any. */
export const CURRENT_TESTING_APP: { value: TestingApp | undefined } = { value: undefined };
