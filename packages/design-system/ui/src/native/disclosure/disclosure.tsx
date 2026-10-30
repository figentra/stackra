/**
 * Stackra file contract:
 * Purpose: the native `Disclosure`: one section whose title shows and hides its content, drawn as the design
 *          system's `Accordion` with a single section, since HeroUI Native has no disclosure of its own.
 * Boundary: the open state is a boolean here and a list of one id inside; the Accordion carries the expanded state to
 *           assistive tech and the motion level.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave C).
 */
import { useState, type ReactElement } from "react";

import { Accordion } from "#native/accordion/accordion";
import type { DisclosureProps } from "#native/disclosure/disclosure.props";

/** The one section's id inside the Accordion. */
const ID = "disclosure";

/** One section that shows and hides. */
export function Disclosure({
  title,
  children,
  isExpanded,
  defaultExpanded = false,
  onExpandedChange,
  isDisabled,
  className,
}: DisclosureProps): ReactElement {
  const [own, setOwn] = useState(defaultExpanded);
  const open = isExpanded ?? own;
  return (
    <Accordion
      items={[{ id: ID, title, content: children }]}
      expandedKeys={open ? [ID] : []}
      onExpandedChange={(keys) => {
        const next = keys.includes(ID);
        setOwn(next);
        onExpandedChange?.(next);
      }}
      {...(isDisabled === undefined ? {} : { isDisabled })}
      {...(className === undefined ? {} : { className })}
    />
  );
}
