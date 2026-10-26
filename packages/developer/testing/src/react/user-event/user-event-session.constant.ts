/**
 * Stackra file contract:
 * Purpose: `USER_EVENT_SESSION`, the user-event session of the current test's latest render, which `userEvent` calls go
 *          to.
 * Boundary: internal test-process state of `./react` (not exported); set by each render, cleared when its test
 *           finishes.
 * Runtime: browser
 * Governing contract: ADR 0269 (decision 6).
 */
import type { UserEvent } from "@testing-library/user-event";

/** The session `userEvent.setup()` made for the latest render; `undefined` outside a rendering test. */
export const USER_EVENT_SESSION: { current: UserEvent | undefined } = { current: undefined };
