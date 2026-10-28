/**
 * Stackra file contract:
 * Purpose: the web `Breadcrumbs` on HeroUI v3's Breadcrumbs: draws the shared contract's `items` as the trail from the
 *          root to the current page inside a named navigation landmark, and passes every other HeroUI Breadcrumbs prop
 *          (the separator included) through.
 * Boundary: no styling of its own beyond letting the row wrap; the look is HeroUI's, themed by `@stackra/tokens`. HeroUI's item draws its own
 *          HeroUI `Link`, which is the base of the `@stackra/ui` Link, so an `href` reaches the app's router through
 *          the same `RouterProvider` seam and the component imports no router. React Aria marks the last item as the
 *          current page (`aria-current="page"`, not a link), so that item is given no `href` here. React Aria's list
 *          takes the landmark's name too, so both carry `label`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0313; ADR 0165 (HeroUI v3 on web); owner
 *          decision 6 of STA-350 (thin wrappers); WCAG 2.2 SC 2.4.8.
 */
import type { ReactElement } from "react";
import { Breadcrumbs as HeroBreadcrumbs } from "@heroui/react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import type { BreadcrumbsProps } from "#react/breadcrumbs/breadcrumbs.props";

/**
 * The trail from the root to the current page. Every step but the last is a link; the last is the current page, drawn
 * as text and announced as such.
 */
export function Breadcrumbs({
  items,
  label: labelProp,
  className,
  ...rest
}: BreadcrumbsProps): ReactElement {
  const t = useUiText();
  const label = labelProp ?? t(UI_KEYS.ui.breadcrumbs.label);
  return (
    <nav aria-label={label}>
      <HeroBreadcrumbs
        {...rest}
        aria-label={label}
        // HeroUI's row does not wrap, so a long trail would scroll sideways in a narrow column (WCAG 1.4.10).
        className={["flex-wrap", className].filter(Boolean).join(" ")}
      >
        {items.map((item, index) => (
          <HeroBreadcrumbs.Item
            key={item.id}
            {...(index === items.length - 1
              ? {}
              : omitUndefined({ href: item.href, onPress: item.onPress }))}
          >
            {item.label}
          </HeroBreadcrumbs.Item>
        ))}
      </HeroBreadcrumbs>
    </nav>
  );
}
