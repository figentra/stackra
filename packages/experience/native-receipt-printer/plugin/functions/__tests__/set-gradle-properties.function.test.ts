/**
 * Stackra file contract:
 * Purpose: unit tests of `setGradleProperties`: an existing key is replaced in place, a new key is appended, and every
 *          other line is kept.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0478 (decision 2); ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import type { PropertiesItem } from "#plugin/types/properties-item.type";
import { setGradleProperties } from "#plugin/functions/set-gradle-properties.function";

describe("setGradleProperties", () => {
  it("replaces in place, appends new keys and keeps the rest", () => {
    const items: PropertiesItem[] = [
      { type: "comment", value: "generated" },
      { type: "property", key: "stackra.receiptPrinter.vendors", value: "epson" },
      { type: "empty" },
      { type: "property", key: "hermesEnabled", value: "true" },
    ];
    expect(
      setGradleProperties(items, {
        "stackra.receiptPrinter.vendors": "sunmi,pax",
        "stackra.receiptPrinter.paxArtifact": "com.pax:neptunelite:1.0",
      }),
    ).toEqual([
      { type: "comment", value: "generated" },
      { type: "property", key: "stackra.receiptPrinter.vendors", value: "sunmi,pax" },
      { type: "empty" },
      { type: "property", key: "hermesEnabled", value: "true" },
      {
        type: "property",
        key: "stackra.receiptPrinter.paxArtifact",
        value: "com.pax:neptunelite:1.0",
      },
    ]);
  });
});
