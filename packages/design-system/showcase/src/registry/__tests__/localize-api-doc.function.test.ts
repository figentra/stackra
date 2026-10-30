/**
 * Stackra file contract:
 * Purpose: proves `localizeApiDoc` reads prop and event descriptions from the nested `api` catalogue (hyphenated
 *          slugs as underscored segments, dotted parts as nested keys), keeps English where it has none, and returns
 *          the doc unchanged without a catalogue.
 * Boundary: the pure function alone.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.4; ADR 0022 (test placement).
 */
import { describe, expect, it } from "vitest";

import { localizeApiDoc } from "#src/registry/localize-api-doc.function";
import type { ApiDoc } from "#src/types/api-doc.type";

const prop = (name: string, description: string) =>
  ({ name, description, type: "string", required: false, source: "stackra" }) as const;

const doc = {
  key: "free/action-menu",
  platform: "web",
  importLine: "",
  generatedFrom: { propsFiles: [], hash: "" },
  parts: [
    { name: "ActionMenu", props: [prop("label", "The name."), prop("align", "The edge.")] },
    { name: "ActionMenu.Item", props: [], events: [prop("onAction", "Runs it.")] },
  ],
} as unknown as ApiDoc;

const catalogue = {
  free: { action_menu: { ActionMenu: { label: "الاسم.", Item: { onAction: "ينفّذه." } } } },
};

describe("localizeApiDoc", () => {
  it("reads the catalogue and keeps English where it has no entry", () => {
    const parts = localizeApiDoc(doc, catalogue).parts;
    expect(parts[0]?.props.map((row) => row.description)).toEqual(["الاسم.", "The edge."]);
    expect(parts[1]?.events?.[0]?.description).toBe("ينفّذه.");
  });

  it("returns the doc itself without a catalogue", () => {
    expect(localizeApiDoc(doc, undefined)).toBe(doc);
  });
});
