/**
 * Stackra file contract:
 * Purpose: proves `nativeExamples` drops the web-only examples (Accordion's "single") and keeps the native ones.
 * Boundary: the registry; no React Native module loads.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; ADR 0022 (test placement).
 */
import { bySlug } from "@stackra/showcase";
import { describe, expect, it } from "vitest";

import { nativeExamples } from "../native-examples.function";

describe("nativeExamples", () => {
  it("keeps the examples native draws and drops the web-only ones", () => {
    const accordion = bySlug("free", "accordion");
    if (!accordion) throw new Error("free/accordion is in the registry");
    const ids = nativeExamples(accordion).map((example) => example.id);
    expect(ids).toContain("basics");
    expect(ids).toContain("multiple");
    expect(ids).not.toContain("single");
  });
});
