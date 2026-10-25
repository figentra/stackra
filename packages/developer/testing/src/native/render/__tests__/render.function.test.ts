/**
 * Stackra file contract:
 * Purpose: unit tests of the `./native` `render`: the library receives one wrapper that nests the providers
 *          first-outermost around the wrapper, no wrapper without providers, a user-event session per render, and the
 *          library's cleanup with the session reset when the test finishes.
 * Boundary: test only. React Native does not run in vitest, so React Native Testing Library is a recording stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";
import { createElement, type ReactElement, type ReactNode } from "react";
import { vi } from "vitest";

import { render } from "#native/render/render.function";
import { USER_EVENT_SESSION } from "#native/user-event/user-event-session.constant";

const library = vi.hoisted(() => {
  const session = { press: vi.fn(async () => undefined) };
  return {
    session,
    render: vi.fn(async (ui: unknown, options: unknown) => ({ ui, options })),
    cleanup: vi.fn(async () => undefined),
    userEvent: { setup: vi.fn(() => session) },
  };
});

vi.mock("@testing-library/react-native/pure", () => library);

/** A provider that marks its layer with `name`. */
const layer = (name: string) =>
  function Layer({ children }: { readonly children?: ReactNode }) {
    return createElement("section", { "data-layer": name }, children);
  };

describe(render, () => {
  it("hands the library one wrapper nesting the providers around the wrapper", async () => {
    const outer = layer("outer");
    const inner = layer("inner");
    const subject = createElement("i", null, "subject");
    await render(subject, { providers: [outer], wrapper: inner });
    const [ui, options] = library.render.mock.calls.at(-1) ?? [];
    expect(ui).toBe(subject);
    const wrapper = (options as { wrapper: (props: { children: ReactNode }) => ReactElement })
      .wrapper;
    const tree = wrapper({ children: subject }) as ReactElement<{ children: ReactElement }>;
    expect(tree.type).toBe(outer);
    expect(tree.props.children.type).toBe(inner);
    expect((tree.props.children as ReactElement<{ children: unknown }>).props.children).toBe(
      subject,
    );
    expect(USER_EVENT_SESSION.current).toBe(library.session);
  });

  it("renders bare without providers or wrapper", async () => {
    const subject = createElement("i", null, "bare");
    await render(subject);
    expect(library.render).toHaveBeenLastCalledWith(subject, {});
  });

  it("cleaned up and dropped the session when the earlier tests finished", () => {
    expect(library.cleanup).toHaveBeenCalledTimes(2);
    expect(USER_EVENT_SESSION.current).toBeUndefined();
  });
});
