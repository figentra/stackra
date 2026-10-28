/**
 * Stackra file contract:
 * Purpose: the native `Accordion` on HeroUI Native's Accordion: draws the shared contract (`items`, `variant`,
 *          `isDisabled`, `expandedKeys`, `defaultExpandedKeys`, `onExpandedChange` and `canExpandMultiple`) as HeroUI
 *          Native's items, triggers, indicators and content, reports the open sections as a list of ids in the items'
 *          order, and passes every other HeroUI Native Accordion prop through.
 * Boundary: no styling of its own. HeroUI Native names its keys `value`, takes one id as a string when a single section
 *           may be open and a list when several may, and answers a collapse with `undefined`; the wrapper keeps the
 *           contract's list in both cases. A string `title` or `content` is wrapped in `Text`, because HeroUI Native
 *           draws them straight into a View, where a bare string is an error. HeroUI Native sets the trigger's
 *           `expanded` and `disabled` accessibility state.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI Native on native); ADR 0313 (decisions 1 and 2); owner
 *          decision 6 of STA-350 (thin wrappers).
 */
import { Accordion as HeroAccordion } from "heroui-native";
import { useState, type ReactNode, type ReactElement } from "react";

import { keysOfSelection } from "#core/functions/keys-of-selection.function";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Text } from "#native/text/text";
import type { AccordionProps } from "#native/accordion/accordion.props";

/** A string drawn as `Text`, anything else as it is. */
const asNode = (node: ReactNode, className?: string): ReactNode =>
  typeof node === "string" ? <Text {...(className ? { className } : {})}>{node}</Text> : node;

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
}: AccordionProps): ReactElement {
  // The accordion always runs controlled: HeroUI Native's value is one string or a list by mode, the contract's a list.
  const [own, setOwn] = useState<readonly string[]>(defaultExpandedKeys ?? []);
  const expanded = expandedKeys ?? own;
  const ids = items.map((item) => item.id);
  const change = (keys: readonly string[]) => {
    setOwn(keys);
    onExpandedChange?.(keys);
  };
  const sections = items.map((item) => (
    <HeroAccordion.Item key={item.id} value={item.id} isDisabled={item.isDisabled ?? false}>
      <HeroAccordion.Trigger>
        {asNode(item.title, "flex-1")}
        <HeroAccordion.Indicator />
      </HeroAccordion.Trigger>
      <HeroAccordion.Content>{asNode(item.content)}</HeroAccordion.Content>
    </HeroAccordion.Item>
  ));
  const shared = { ...rest, ...omitUndefined({ variant, isDisabled }) };
  return canExpandMultiple ? (
    <HeroAccordion
      {...shared}
      selectionMode="multiple"
      value={[...expanded]}
      onValueChange={(next: string[]) => change(keysOfSelection(next, ids))}
    >
      {sections}
    </HeroAccordion>
  ) : (
    <HeroAccordion
      {...shared}
      selectionMode="single"
      value={expanded[0]}
      onValueChange={(next: string | undefined) => change(next === undefined ? [] : [next])}
    >
      {sections}
    </HeroAccordion>
  );
}
