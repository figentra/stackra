/**
 * Stackra file contract:
 * Purpose: proves the web MemberPicker names its combo box with the host's label, asks the host's `loadOptions` with
 *          the typed text, reports the chosen member, shows the host's empty words when nothing matches, and keeps an
 *          Arabic name in its own direction under `dir="rtl"`.
 * Boundary: unit tier, jsdom, the real @stackra/ui EntityPicker; no container. jsdom has no IntersectionObserver nor
 *           layout, so both get stand-ins (as in the EntityPicker test).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; ADR 0260; ADR 0060 (right-to-left).
 */
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { MemberPicker } from "#react/member-picker/member-picker";

const PEOPLE = [
  { id: "mbr_ada", label: "Ada Lovelace", avatar: { name: "Ada Lovelace" } },
  { id: "mbr_alan", label: "Alan Turing", avatar: { name: "Alan Turing" } },
];

/** Answers from PEOPLE by label, one page. */
const people = () =>
  vi.fn((search: string) =>
    Promise.resolve({
      items: PEOPLE.filter((person) => person.label.toLowerCase().includes(search.toLowerCase())),
      nextCursor: null,
    }),
  );

const LABELS = { label: "Assignee", emptyMessage: "No member matches" };

/** Types into the field the way a person does: focus first, which is what lets the list open. */
const type = (text: string) => {
  const input = screen.getByRole("combobox");
  act(() => input.focus());
  fireEvent.change(input, { target: { value: text } });
};

describe("MemberPicker (web)", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}

        unobserve() {}

        disconnect() {}
      },
    );
    Object.defineProperty(Element.prototype, "scrollTo", {
      value: () => undefined,
      configurable: true,
    });
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(Element.prototype, "scrollTo");
  });

  it("names the field by the host's label and asks the host's loadOptions", async () => {
    const load = people();
    render(<MemberPicker debounceMs={0} loadOptions={load} labels={LABELS} />);
    expect(screen.getByRole("combobox", { name: /Assignee/ })).toBeTruthy();
    type("Ada");
    expect(await screen.findByRole("option", { name: /Ada Lovelace/ })).toBeTruthy();
    expect(load).toHaveBeenCalledWith("Ada", undefined);
  });

  it("reports the chosen member", async () => {
    const onChange = vi.fn();
    render(
      <MemberPicker debounceMs={0} loadOptions={people()} onChange={onChange} labels={LABELS} />,
    );
    type("Alan");
    const alan = await screen.findByRole("option", { name: /Alan Turing/ });
    act(() => alan.click());
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ id: "mbr_alan" }));
  });

  it("shows the host's words when nothing matches", async () => {
    render(<MemberPicker debounceMs={0} loadOptions={people()} labels={LABELS} />);
    type("Zed");
    expect(await screen.findByText("No member matches")).toBeTruthy();
  });

  it("keeps an Arabic name in its own direction under right-to-left", async () => {
    const load = vi.fn(() =>
      Promise.resolve({ items: [{ id: "mbr_sara", label: "سارة" }], nextCursor: null }),
    );
    render(
      <div dir="rtl">
        <MemberPicker debounceMs={0} loadOptions={load} labels={{ label: "المسؤول" }} />
      </div>,
    );
    expect(screen.getByRole("combobox", { name: /المسؤول/ })).toBeTruthy();
    type("سا");
    expect(await screen.findByRole("option", { name: /سارة/ })).toBeTruthy();
  });
});
