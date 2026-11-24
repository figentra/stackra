/**
 * Stackra file contract:
 * Purpose: unit tests of `fillComponent`: it replaces every `@@NAME@@` placeholder of a component document with its
 *          value, each occurrence and each name; leaves a document with no placeholder, and text that only looks like
 *          one (lowercase, one `@`, digits), untouched; and throws, naming the placeholder, when a name has no value, so
 *          no component ships unfilled.
 * Boundary: test only; pure string work.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0484 (decision 2); ADR 0171 (the program only declares).
 */
import { describe, expect, it } from "@stackra/testing";

import { fillComponent } from "#node/functions/fill-component.function";

describe("fillComponent", () => {
  it("replaces every occurrence of every placeholder with its value", () => {
    const document = "name: @@NODE@@\ninstall: npm i -g pnpm@@@PNPM@@\nagain: @@NODE@@";
    expect(fillComponent(document, { NODE: "24.22.0", PNPM: "12.16.1" })).toBe(
      "name: 24.22.0\ninstall: npm i -g pnpm@12.16.1\nagain: 24.22.0",
    );
  });

  it("leaves a document with no placeholder, and text that only looks like one, as it is", () => {
    const text = "plain\n@NODE@ @@node@@ @@NODE1@@ @@ @@@@";
    expect(fillComponent(text, { NODE: "24" })).toBe(text);
    expect(fillComponent("", {})).toBe("");
  });

  it("takes an empty value as a value", () => {
    expect(fillComponent("a=@@MISE@@;", { MISE: "" })).toBe("a=;");
  });

  it("throws, naming the placeholder, when a name has no value", () => {
    expect(() => fillComponent("pin: @@ENCORE@@", {})).toThrow(
      "component placeholder @@ENCORE@@ has no value",
    );
    expect(() => fillComponent("@@NODE@@ and @@PNPM@@", { NODE: "24" })).toThrow(
      "component placeholder @@PNPM@@ has no value",
    );
  });
});
