/**
 * Stackra file contract:
 * Purpose: `trackRender()`, the house defaults every web render applies: a fresh `userEvent.setup()` session for the
 *          render, and Testing Library's `cleanup` (unmount and session reset) when the current test finishes.
 * Boundary: internal to `./react` (not exported); used by `render` and `renderHook`. Outside a test (a `beforeAll`)
 *           nothing is registered, as with `freezeClock`.
 * Runtime: browser (vitest, jsdom)
 * Governing contract: ADR 0269 (decision 6).
 */
import { cleanup } from "@testing-library/react";
import { userEvent as library } from "@testing-library/user-event";

import { restoreAfterTest } from "#core/functions/restore-after-test.function";
import { USER_EVENT_SESSION } from "#react/user-event/user-event-session.constant";

/** Starts the render's user-event session and schedules the cleanup. */
export function trackRender(): void {
  USER_EVENT_SESSION.current = library.setup();
  restoreAfterTest(() => {
    cleanup();
    USER_EVENT_SESSION.current = undefined;
  });
}
