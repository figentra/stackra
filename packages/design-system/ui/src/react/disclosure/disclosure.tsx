/**
 * Stackra file contract:
 * Purpose: the web `Disclosure` on HeroUI v3's Disclosure (React Aria's): a heading whose button shows and hides one
 *          section, with a chevron that turns as it opens.
 * Boundary: the button carries `aria-expanded` and controls the panel; Enter and Space toggle it, all React Aria's.
 *           The look is HeroUI's, themed by `@stackra/tokens`; the chevron sits at the end, so it mirrors in
 *           right-to-left. A group of sections is the `Accordion`, not this.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); WAI-ARIA 1.2 disclosure pattern; STA-1371 (wave C).
 */
import { Disclosure as HeroDisclosure } from "@heroui/react";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { DisclosureProps } from "#react/disclosure/disclosure.props";

/** One section that shows and hides. */
export function Disclosure({
  title,
  children,
  isExpanded,
  defaultExpanded,
  onExpandedChange,
  isDisabled,
  className,
}: DisclosureProps): ReactElement {
  return (
    <HeroDisclosure
      data-slot="disclosure"
      {...omitUndefined({ isExpanded, defaultExpanded, onExpandedChange, isDisabled, className })}
    >
      <HeroDisclosure.Heading>
        <HeroDisclosure.Trigger className="flex w-full items-center justify-between gap-3 text-start">
          {title}
          <HeroDisclosure.Indicator />
        </HeroDisclosure.Trigger>
      </HeroDisclosure.Heading>
      <HeroDisclosure.Content>
        <HeroDisclosure.Body>{children}</HeroDisclosure.Body>
      </HeroDisclosure.Content>
    </HeroDisclosure>
  );
}
