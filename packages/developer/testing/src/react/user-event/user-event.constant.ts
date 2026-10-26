/**
 * Stackra file contract:
 * Purpose: `userEvent`, Testing Library's user-event with the house default: each interaction (`click`, `type`,
 *          `keyboard`, ...) runs in the session the current test's latest `render` set up with `userEvent.setup()`,
 *          so pointer and keyboard state carry across one test's steps and never into the next test.
 * Boundary: before any render (or outside a test) an interaction gets a fresh session of its own, as user-event's
 *           direct calls do. `setup(options)` is user-event's own, for a test that wants a configured session.
 * Runtime: browser
 * Governing contract: ADR 0269 (decision 6).
 */
import { userEvent as library, type UserEvent } from "@testing-library/user-event";

import { USER_EVENT_SESSION } from "#react/user-event/user-event-session.constant";

/**
 * The house user-event.
 *
 * @example
 * render(<SignInForm />);
 * await userEvent.type(screen.getByLabelText("Email"), "lina@northwind.example");
 */
export const userEvent: UserEvent = new Proxy(library as unknown as UserEvent, {
  get: (target, name) =>
    name === "setup"
      ? Reflect.get(target, name)
      : Reflect.get(USER_EVENT_SESSION.current ?? library.setup(), name),
});
