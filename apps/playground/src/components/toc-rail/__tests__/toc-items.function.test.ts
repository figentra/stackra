/**
 * Stackra file contract:
 * Purpose: proves the table of contents follows the page contract: section order, no header, links or pager rows,
 *          anatomy only for a compound, the examples after the first under Examples, the parts under API.
 * Boundary: pure; the translator echoes the key.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
import { bySlug } from "@stackra/showcase";

import { tocItems } from "#src/components/toc-rail/toc-items.function";

const echo = (key: string) => key;

describe("tocItems", () => {
  it("lists a leaf component's sections, its examples and its one part, in order", () => {
    const button = bySlug("free", "button");
    if (!button) throw new Error("free/button is not registered");
    const ids = tocItems(button, echo).map((item) => item.id);
    expect(ids[0]).toBe("import");
    expect(ids).not.toContain("anatomy");
    expect(ids).not.toContain("header");
    expect(ids).not.toContain("pager");
    expect(ids.indexOf("examples")).toBeLessThan(ids.indexOf("example-states"));
    expect(ids.indexOf("api")).toBeLessThan(ids.indexOf("api-Button"));
    expect(ids).not.toContain("example-variants"); // examples[0] is Usage
  });

  it("adds Anatomy for a compound component and one API row per part", () => {
    // Modal is compound (Modal, Modal.Close, Modal.Title, Modal.Section); Tabs is one part since the redesign.
    const modal = bySlug("free", "modal");
    if (!modal) throw new Error("free/modal is not registered");
    const items = tocItems(modal, echo);
    expect(items.some((item) => item.id === "anatomy")).toBe(true);
    expect(items.filter((item) => item.id.startsWith("api-"))).toHaveLength(modal.parts.length);
  });
});
