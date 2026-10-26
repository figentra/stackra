/**
 * Stackra file contract:
 * Purpose: the web `Accordion` on HeroUI v3's Accordion (React Aria's disclosure group): draws the shared contract
 *          (`items`, `variant`, `isDisabled`, `expandedKeys`, `defaultExpandedKeys`, `onExpandedChange` and
 *          `canExpandMultiple`) as HeroUI's items, headings, trigger buttons, indicators and panels, reports the open
 *          sections as a list of ids in the items' order, and passes every other HeroUI Accordion prop through.
 * Boundary: no styling of its own; the look is HeroUI's, themed by `@stackra/tokens`. Each title is a button inside a
 *           heading, `aria-expanded` and the panel link are React Aria's, and a collapsed panel is hidden from the
 *           accessibility tree. Opening a section closes the others unless `canExpandMultiple`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (UI contract, HeroUI v3 on web); ADR 0313 (decisions 1 and 2);
 *          WAI-ARIA 1.2 accordion pattern; owner decision 6 of STA-350 (thin wrappers).
 */
import { Accordion as HeroAccordion } from "@heroui/react";

import { keysOfSelection } from "#core/functions/keys-of-selection.function";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { AccordionProps } from "#react/accordion/accordion.props";

/**
 * A stack of sections whose titles open and close their content. `expandedKeys` is the list of open ids;
 * `onExpandedChange` is called with the new list whenever the user opens or closes a section.
 */
export function Accordion({
  items,
  expandedKeys,
  defaultExpandedKeys,
  onExpandedChange,
  canExpandMultiple = false,
  variant,
  isDisabled,
  ...rest
}: AccordionProps) {
  const ids = items.map((item) => item.id);
  return (
    <HeroAccordion
      {...rest}
      {...omitUndefined({ variant, isDisabled, expandedKeys, defaultExpandedKeys })}
      allowsMultipleExpanded={canExpandMultiple}
      onExpandedChange={(keys) => onExpandedChange?.(keysOfSelection(keys, ids))}
    >
      {items.map((item) => (
        <HeroAccordion.Item
          key={item.id}
          id={item.id}
          {...(item.isDisabled ? { isDisabled: true } : {})}
        >
          <HeroAccordion.Heading>
            <HeroAccordion.Trigger>
              {item.title}
              <HeroAccordion.Indicator />
            </HeroAccordion.Trigger>
          </HeroAccordion.Heading>
          <HeroAccordion.Panel>
            <HeroAccordion.Body>{item.content}</HeroAccordion.Body>
          </HeroAccordion.Panel>
        </HeroAccordion.Item>
      ))}
    </HeroAccordion>
  );
}
