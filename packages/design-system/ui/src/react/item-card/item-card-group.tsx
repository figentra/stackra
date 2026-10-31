/**
 * Stackra file contract:
 * Purpose: the web `ItemCardGroup`: ItemCards or SettingsCells joined into one rounded surface with separators, under
 *          an optional heading and over an optional footnote.
 * Boundary: a `section` named by its heading, the cards a list; drawing only.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); WCAG 2.2 SC 1.3.1.
 */
import { cn } from "@heroui/react";
import { Children, useId, type ReactElement } from "react";

import { ItemCardGroupContext } from "#react/item-card/item-card-group-context";
import type { ItemCardGroupProps } from "#react/item-card/item-card-group.props";

/** Cards joined into one surface. */
export function ItemCardGroup({
  title,
  description,
  children,
  className,
}: ItemCardGroupProps): ReactElement {
  const id = useId();
  return (
    <section aria-labelledby={title ? id : undefined} className={cn("tray grid", className) ?? ""}>
      {title ? (
        <h3 id={id} className="tray__header m-0 text-xs font-medium text-muted">
          {title}
        </h3>
      ) : null}
      <ItemCardGroupContext value>
        <ul className="tray__body divide-y divide-separator overflow-hidden">
          {Children.map(Children.toArray(children), (child) => (
            <li>{child}</li>
          ))}
        </ul>
      </ItemCardGroupContext>
      {description ? <p className="px-3 pt-2 pb-1 text-xs text-muted">{description}</p> : null}
    </section>
  );
}
