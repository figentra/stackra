/**
 * Stackra file contract:
 * Purpose: `trackRender()`, the house defaults every native render applies: a fresh `userEvent.setup()` session for the
 *          render, and React Native Testing Library's `cleanup` (unmount and session reset) when the current test
 *          finishes.
 * Boundary: internal to `./native` (not exported); used by `render` and `renderHook`. The library's own auto-cleanup
 *           needs global test hooks, which this repository's vitest does not install, so the cleanup is registered
 *           here; outside a test (a `beforeAll`) nothing is registered.
 * Runtime: react-native (vitest)
 * Governing contract: ADR 0269 (decision 6).
 */
import { cleanup, userEvent as library } from "@testing-library/react-native/pure";

import { restoreAfterTest } from "#core/functions/restore-after-test.function";
import { USER_EVENT_SESSION } from "#native/user-event/user-event-session.constant";

/** Starts the render's user-event session and schedules the cleanup. */
export function trackRender(): void {
  USER_EVENT_SESSION.current = library.setup();
  restoreAfterTest(async () => {
    await cleanup();
    USER_EVENT_SESSION.current = undefined;
  });
}
