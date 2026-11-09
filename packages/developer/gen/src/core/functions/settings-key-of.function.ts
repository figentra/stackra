/**
 * Stackra file contract:
 * Purpose: `settingsKeyOf`, the group key of a settings class: the class name without its trailing `Settings`, in
 *          snake_case (`OrdersSettings` is `orders`, `LoyaltyKitSettings` is `loyalty_kit`, `AccountSettings` is
 *          `account`). A host override keeps its base's name, so its key is its base's.
 * Boundary: pure. The same rule as `settingsKeyOf` of `@stackra/settings` (a package never imports it), so the key gen
 *           writes into `#stackra/settings` and the manifest is the key the runtime reads; the two tests share their
 *           cases. An empty result is for the caller to refuse (`settings_group_key_empty`).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20); ADR 0305 (rule 1: overrides keep the name); ADR 0307 (rule 22); ADR 0496
 *                     (decision 7).
 */
import type { ShapeIR } from "#core/types/shape-ir.type";

/**
 * The group key of a settings class, by its name or by its shape.
 *
 * @param subject - the class name, or its shape (a host override is keyed by its base's name).
 * @example
 * settingsKeyOf("LoyaltyKitSettings"); // "loyalty_kit"
 */
export function settingsKeyOf(subject: string | Pick<ShapeIR, "name" | "base">): string {
  const name =
    typeof subject === "string"
      ? subject
      : subject.base?.kind === "package"
        ? subject.base.name
        : subject.name;
  return name
    .replace(/Settings$/, "")
    .replaceAll(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase();
}
