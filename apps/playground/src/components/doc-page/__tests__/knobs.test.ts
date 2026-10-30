/**
 * Stackra file contract:
 * Purpose: the knobs playground's pure parts: which API props become which knobs, and the JSX shown for their values.
 * Boundary: pure functions; renders nothing.
 * Runtime: node
 * Governing contract: STA-1371 (doc pages wave, 2026-10-28).
 */
import type { ApiProp } from "@stackra/showcase";
import { describe, expect, it } from "vitest";

import { knobCode } from "#src/components/doc-page/knob-code.function";
import { knobsFromProps } from "#src/components/doc-page/knobs-from-props.function";
import { tagList } from "#src/components/doc-page/tag-list.function";

const prop = (name: string, type: string, extra: Partial<ApiProp> = {}): ApiProp => ({
  name,
  type,
  required: false,
  description: "",
  source: "stackra",
  ...extra,
});

describe("knobsFromProps", () => {
  it("maps unions, booleans and word strings, and skips the rest", () => {
    const knobs = knobsFromProps([
      prop("variant", '"primary" | "secondary"', { default: "primary" }),
      prop("isDisabled", "boolean"),
      prop("label", "string"),
      prop("id", "string"),
      prop("onPress", "() => void"),
      prop("autoFocus", "boolean", { source: "react-aria" }),
      prop("description", "ReactNode"),
      prop("icon", "ReactNode"),
      prop("value", "number"),
      prop("maxValue", "number"),
    ]);
    expect(knobs).toEqual([
      { prop: "variant", control: "select", options: ["primary", "secondary"], initial: "primary" },
      { prop: "isDisabled", control: "switch" },
      { prop: "label", control: "text" },
      { prop: "description", control: "text" },
      { prop: "value", control: "number" },
    ]);
  });
});

describe("knobCode", () => {
  const knobs = knobsFromProps([
    prop("variant", '"primary" | "secondary"', { default: "primary" }),
    prop("isDisabled", "boolean"),
  ]);
  it("writes only changed props", () => {
    expect(knobCode("Button", knobs, { variant: "primary" }, "Save")).toBe("<Button>Save</Button>");
    expect(knobCode("Button", knobs, { variant: "secondary", isDisabled: true })).toBe(
      '<Button variant="secondary" isDisabled />',
    );
    expect(knobCode("ProgressBar", knobsFromProps([prop("value", "number")]), { value: 60 })).toBe(
      "<ProgressBar value={60} />",
    );
  });
});

describe("tagList", () => {
  it("splits on the middle dot", () => {
    expect(tagList("A · B ·  · C")).toEqual(["A", "B", "C"]);
  });
});
