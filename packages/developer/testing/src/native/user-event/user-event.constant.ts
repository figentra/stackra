/**
 * Stackra file contract:
 * Purpose: `userEvent`, React Native Testing Library's user-event with the house default: each interaction (`press`,
 *          `type`, `scrollTo`, ...) runs in the session the current test's latest `render` set up with
 *          `userEvent.setup()`, and never in another test's.
 * Boundary: before any render (or outside a test) an interaction gets a fresh session of its own, as the library's
 *           direct calls do. `setup(options)` is the library's own, for a test that wants a configured session.
 * Runtime: react-native
 * Governing contract: ADR 0269 (decision 6).
 */
import { userEvent as library } from "@testing-library/react-native/pure";

import { USER_EVENT_SESSION } from "#native/user-event/user-event-session.constant";

/**
 * The house user-event.
 *
 * @example
 * await render(<Home />);
 * await userEvent.press(screen.getByTestId("home-scan"));
 */
export const userEvent: typeof library = new Proxy(library, {
  get: (target, name) =>
    name === "setup"
      ? Reflect.get(target, name)
      : Reflect.get(USER_EVENT_SESSION.current ?? library.setup(), name),
});
