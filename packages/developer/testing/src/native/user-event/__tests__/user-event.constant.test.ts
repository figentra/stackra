/**
 * Stackra file contract:
 * Purpose: unit tests of the `./native` `userEvent`: a press after a render runs in that render's session, one before
 *          any render runs in a fresh session of its own, and `setup` is the library's own.
 * Boundary: test only. React Native does not run in vitest, so React Native Testing Library is a recording stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";
import { createElement } from "react";
import { vi } from "vitest";

import { render } from "#native/render/render.function";
import { userEvent } from "#native/user-event/user-event.constant";

const library = vi.hoisted(() => {
  const rendered = { press: vi.fn(async (_node: unknown) => undefined) };
  const fresh = { press: vi.fn(async (_node: unknown) => undefined) };
  return {
    rendered,
    fresh,
    render: vi.fn(async () => ({})),
    cleanup: vi.fn(async () => undefined),
    userEvent: { setup: vi.fn(() => rendered) },
  };
});

vi.mock("@testing-library/react-native/pure", () => library);

/** A stand-in for a host instance. */
const NODE = { type: "View", props: {}, children: [] };

describe("userEvent (native)", () => {
  it("presses through the session the render set up", async () => {
    await render(createElement("i"));
    await userEvent.press(NODE as never);
    expect(library.rendered.press).toHaveBeenCalledWith(NODE);
  });

  it("presses through a fresh session before any render", async () => {
    library.userEvent.setup.mockReturnValueOnce(library.fresh);
    await userEvent.press(NODE as never);
    expect(library.fresh.press).toHaveBeenCalledWith(NODE);
  });

  it("hands setup through to the library", () => {
    expect(userEvent.setup).toBe(library.userEvent.setup);
  });
});
