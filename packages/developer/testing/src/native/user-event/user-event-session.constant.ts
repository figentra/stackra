/**
 * Stackra file contract:
 * Purpose: `USER_EVENT_SESSION`, the React Native user-event session of the current test's latest render, which
 *          `userEvent` calls go to.
 * Boundary: internal test-process state of `./native` (not exported); set by each render, cleared when its test
 *           finishes.
 * Runtime: react-native
 * Governing contract: ADR 0269 (decision 6).
 */
import type { userEvent } from "@testing-library/react-native/pure";

/** The session `userEvent.setup()` made for the latest render; `undefined` outside a rendering test. */
export const USER_EVENT_SESSION: { current: ReturnType<typeof userEvent.setup> | undefined } = {
  current: undefined,
};
