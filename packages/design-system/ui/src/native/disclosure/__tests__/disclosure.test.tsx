/**
 * Stackra file contract:
 * Purpose: proves the native Disclosure hands the Accordion one section, open as a list of one id, and turns the
 *          Accordion's list back into a boolean for `onExpandedChange`.
 * Boundary: the native Accordion is replaced by a recording stand-in; what reaches it is checked.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";

import { Disclosure } from "#native/disclosure/disclosure";

const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("#native/accordion/accordion", () => ({
  Accordion: (props: Record<string, unknown>) => {
    received.props = props;
    return null;
  },
}));

describe("Disclosure (native)", () => {
  it("draws one Accordion section and reports a boolean", () => {
    const changes: boolean[] = [];
    render(
      <Disclosure title="Advanced" defaultExpanded onExpandedChange={(open) => changes.push(open)}>
        Body
      </Disclosure>,
    );
    expect(received.props["items"]).toEqual([
      { id: "disclosure", title: "Advanced", content: "Body" },
    ]);
    expect(received.props["expandedKeys"]).toEqual(["disclosure"]);
    act(() => (received.props["onExpandedChange"] as (keys: string[]) => void)([]));
    expect(changes).toEqual([false]);
    expect(received.props["expandedKeys"]).toEqual([]);
  });
});
