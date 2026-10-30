/**
 * Stackra file contract:
 * Purpose: `REPLACED_PROPS`, the hand table from a HeroUI prop our props types refuse (`Omit<…, "isPending">`) to the
 *          contract prop that takes its place. gen-api sets `ApiProp.replaces` on the first candidate the part has.
 * Boundary: data only; a HeroUI name with no row (or no candidate on the part) is simply not exposed.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.2 step 5; ADR 0303 (props vocabulary).
 */

/** HeroUI prop -> our candidate props, first match on the part wins. */
export const REPLACED_PROPS: Readonly<Record<string, readonly string[]>> = {
  isPending: ["isLoading"],
  fullWidth: ["isFullWidth"],
  "aria-label": ["label"],
  "aria-labelledby": ["label"],
  accessibilityLabel: ["label"],
  disabled: ["isDisabled"],
  readOnly: ["isReadOnly"],
  editable: ["isReadOnly"],
  value: ["selectedKeys", "selectedKey"],
  defaultValue: ["defaultSelectedKeys", "defaultSelectedKey"],
  onValueChange: ["onSelectionChange", "onChange"],
  onChangeText: ["onChange"],
  onSelectedChange: ["onSelectionChange", "onChange"],
  active: ["isActive"],
  open: ["isOpen"],
  color: ["tone", "variant"],
  status: ["tone", "variant"],
};
