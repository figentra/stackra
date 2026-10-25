// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit tests of the `./react` `render`: the providers wrap the subject first-outermost with the wrapper
 *          innermost, Testing Library's options pass through, a render starts a user-event session, and the document
 *          and the session are clean again in the next test.
 * Boundary: test only, jsdom; the providers are local components.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";
import { screen } from "@testing-library/react";
import { createElement, type ReactNode } from "react";

import { render } from "#react/render/render.function";
import { USER_EVENT_SESSION } from "#react/user-event/user-event-session.constant";

/** A provider that marks its layer with `name`. */
const layer = (name: string) =>
  function Layer({ children }: { readonly children?: ReactNode }) {
    return createElement("section", { "data-layer": name }, children);
  };

describe(render, () => {
  it("wraps the subject in the providers, first outermost, and the wrapper innermost", () => {
    render(createElement("p", null, "subject"), {
      providers: [layer("outer"), layer("inner")],
      wrapper: layer("wrapper"),
    });
    const layers: string[] = [];
    for (let node = screen.getByText("subject").parentElement; node; node = node.parentElement) {
      const name = node.getAttribute("data-layer");
      if (name !== null) layers.push(name);
    }
    expect(layers).toEqual(["wrapper", "inner", "outer"]);
    expect(USER_EVENT_SESSION.current).toBeDefined();
  });

  it("renders bare without providers and passes Testing Library's options through", () => {
    const container = document.body.appendChild(document.createElement("main"));
    const view = render(createElement("p", null, "bare"), { container });
    expect(view.container).toBe(container);
    expect(container.textContent).toBe("bare");
  });

  it("starts each test with an empty document and no session", () => {
    expect(screen.queryByText("subject")).toBeNull();
    expect(screen.queryByText("bare")).toBeNull();
    expect(USER_EVENT_SESSION.current).toBeUndefined();
  });
});
