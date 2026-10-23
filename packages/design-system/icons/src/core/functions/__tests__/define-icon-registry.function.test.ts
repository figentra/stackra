/**
 * Stackra file contract:
 * Purpose: proves `defineIconRegistry` returns a frozen copy holding the given components, and that its types refuse a
 *          key that is not an `IconName` and a value that is not an icon component.
 * Boundary: pure function over stand-in components; the type checks run in `tsc`, not at runtime.
 * Runtime: node
 * Governing contract: ADR 0303 (decision 10); ADR 0022 (test placement).
 */
// @covers sta-350:FR-049
import type { IconComponent } from "#contracts/types/icon-component.type";
import { defineIconRegistry } from "#core/functions/define-icon-registry.function";

const arrow: IconComponent = () => null;
const badge: IconComponent = () => null;

describe("defineIconRegistry", () => {
  it("holds the given icons, custom ones included", () => {
    const registry = defineIconRegistry({ "arrow-right": arrow, "loyalty::points-badge": badge });
    expect(registry["arrow-right"]).toBe(arrow);
    expect(registry["loyalty::points-badge"]).toBe(badge);
  });

  it("is a frozen copy, so the caller's object cannot change it", () => {
    const icons = { "arrow-right": arrow };
    const registry = defineIconRegistry(icons);
    expect(Object.isFrozen(registry)).toBe(true);
    expect(registry).not.toBe(icons);
  });

  it("refuses a key that is not an IconName and a value that is not a component", () => {
    // @ts-expect-error -- "arrow_right" is not a Lucide name, an alias or a `namespace::name`
    defineIconRegistry({ arrow_right: arrow });
    // @ts-expect-error -- a string is not an icon component
    defineIconRegistry({ "arrow-right": "ArrowRight" });
    expect(true).toBe(true);
  });
});
