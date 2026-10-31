/**
 * Stackra file contract:
 * Purpose: proves the DTCG export covers the tokens v2 families (ADR 0501): layout lengths (a spacing multiple
 *          resolved to px), numbers, cubic-bezier easings, shadow layer lists and typography composites.
 * Boundary: a pure call on the Stackra theme.
 * Runtime: node
 * Governing contract: ADR 0501; ADR 0340 (decision 7); ADR 0022 (test placement).
 */
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";
import { themeToDtcg } from "#core/functions/theme-to-dtcg.function";

describe("themeToDtcg", () => {
  const tree = themeToDtcg(STACKRA_THEME) as Record<string, Record<string, unknown>>;

  it("writes the layout knobs as dimensions and numbers", () => {
    const layout = tree["layout"] as Record<string, Record<string, unknown>>;
    expect(layout["controlHeight"]?.["md"]).toEqual({
      $type: "dimension",
      $value: { value: 36, unit: "px" },
    });
    expect(layout["zIndex"]?.["overlay"]).toEqual({ $type: "number", $value: 50 });
  });

  it("writes easings as cubic-bezier points and leaves the stepped one out", () => {
    const easing = tree["easing"] as Record<string, unknown>;
    expect(easing["indicator"]).toEqual({ $type: "cubicBezier", $value: [0.32, 0.72, 0, 1] });
    expect(easing["blink"]).toBeUndefined();
  });

  it("writes shadows as layer lists and type steps as typography composites", () => {
    const light = (tree["shadow"] as Record<string, Record<string, { $value: unknown[] }>>)[
      "light"
    ];
    expect(light?.["raised"]?.$value).toHaveLength(2);
    expect(light?.["raised"]?.$value[0]).toMatchObject({
      offsetY: { value: 1, unit: "px" },
      blur: { value: 3, unit: "px" },
      inset: false,
    });
    const scale = (tree["typography"] as Record<string, Record<string, { $value: unknown }>>)[
      "scale"
    ];
    expect(scale?.["sm"]?.$value).toMatchObject({
      fontSize: { value: 0.875, unit: "rem" },
      lineHeight: 1.4286,
    });
  });
});
