/**
 * Stackra file contract:
 * Purpose: unit tests of the `./react` `userEvent`: an interaction after a render runs in that render's session, one
 *          before any render still works on a session of its own, and `setup` is user-event's own.
 * Boundary: test only, jsdom.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 6).
 */
// @vitest-environment jsdom
import { describe, expect, it } from "@stackra/testing";
import { screen } from "@testing-library/react";
import { userEvent as library } from "@testing-library/user-event";
import { createElement } from "react";
import { vi } from "vitest";

import { render } from "#react/render/render.function";
import { userEvent } from "#react/user-event/user-event.constant";
import { USER_EVENT_SESSION } from "#react/user-event/user-event-session.constant";

describe("userEvent", () => {
  it("clicks through the session the render set up", async () => {
    const onClick = vi.fn();
    render(createElement("button", { type: "button", onClick }, "Save"));
    expect(userEvent.click).toBe(USER_EVENT_SESSION.current?.click);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("types on a session of its own before any render", async () => {
    const input = document.body.appendChild(document.createElement("input"));
    expect(USER_EVENT_SESSION.current).toBeUndefined();
    await userEvent.type(input, "Lina");
    expect(input.value).toBe("Lina");
    input.remove();
  });

  it("hands setup through to user-event", () => {
    expect(userEvent.setup).toBe(library.setup);
  });
});
