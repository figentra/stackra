/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Accordion` takes: the sections, which of them are expanded (as lists of string
 *          ids), whether several may be, the variant and a switch for the whole accordion. Each runtime's
 *          `AccordionProps` is this plus its HeroUI accordion's own props, which pass through unchanged.
 * Boundary: types only. Expansion is not selection: an accordion has no `selectionMode` or `selectedKeys`, and reports
 *           `onExpandedChange` with ids in the items' order, never a `Set`. An accordion has no empty or loading state of
 *           its own: a page that has no sections draws an `EmptyState` instead.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); ADR 0313 (decisions 1
 *          and 2); WAI-ARIA 1.2 accordion pattern.
 */
import type { AccordionVariant } from "#contracts/enums/accordion-variant.enum";
import type { AccordionItem } from "#contracts/types/accordion-item.type";
import type { CollectionContractProps } from "#contracts/types/collection-contract-props.type";

/** Props shared by the web and native `Accordion`. */
export interface AccordionContractProps extends Pick<
  CollectionContractProps<AccordionItem>,
  "items"
> {
  /** The ids of the expanded sections, for a controlled accordion; pair it with `onExpandedChange`. */
  readonly expandedKeys?: readonly string[] | undefined;
  /** The ids expanded at the start, for an uncontrolled accordion. */
  readonly defaultExpandedKeys?: readonly string[] | undefined;
  /** Called with the ids now expanded each time a section opens or closes, in the order the items are in. */
  readonly onExpandedChange?: ((keys: readonly string[]) => void) | undefined;
  /** True to let several sections stay open at once; otherwise opening one closes the others. Defaults to false. */
  readonly canExpandMultiple?: boolean | undefined;
  /** The surface of the accordion: `default` on the page, `surface` as a panel of its own. Defaults to `default`. */
  readonly variant?: AccordionVariant | undefined;
  /** True to show every section but refuse expanding or collapsing any of them. */
  readonly isDisabled?: boolean | undefined;
}
