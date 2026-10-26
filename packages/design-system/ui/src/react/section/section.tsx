/**
 * Stackra file contract:
 * Purpose: the web `Section`: a titled card on a detail page, a `section` landmark named by its title, which is a real
 *          heading (`h2` by default, `headingLevel` to move it) with a muted line under it. `actions` is an ordered
 *          list: the first is the primary button, the next two secondary buttons and the rest go in an ActionMenu named
 *          by `moreActionsLabel`; `startContent` leads the title and `endContent` follows the actions. The body is the
 *          children.
 * Boundary: HeroUI has no section, so this is the documented adapted form on HeroUI's `Card` (drawn as a `section`
 *           through React Aria's `render`, so its classes stay) with the title and description it already has, and it
 *           imports no sibling piece of wave 6 (ADR 0317 decision 4). The name is the title, through
 *           `aria-labelledby`; `label` replaces it, for a page whose two sections share a title, and a caller's own
 *           `aria-label` or `aria-labelledby` is refused by the type. The title is the section's own heading, so a page's
 *           outline is the caller's to keep: a section under the page's `h1` is `h2`, one inside another section `h3`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3, decision 5: adapted form); ADR 0303 (decision 7); ADR 0317 (decisions 1, 4
 *          and 5); ADR 0165 (HeroUI v3 on web); WCAG 2.2 SC 1.3.1, 2.4.6 and 2.5.8.
 */
import { cn } from "@heroui/react";
import { createElement, useId, type ReactElement } from "react";

import type { SectionContractProps } from "#contracts/types/section-contract-props.type";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#core/hooks/use-ui-text";
import { Card, type CardProps } from "#react/card/card";
import { PageActions } from "#react/page-actions/page-actions";

/**
 * Props of the web Section: the shared contract plus the card's own props, passed through. The element's `aria-label`
 * is the contract's `label` and `aria-labelledby` is the title's, so the type refuses both; its `title` attribute gives
 * way to the contract's `title`, and the element is a `section`, so `render` is not a prop here.
 */
export type SectionProps = SectionContractProps &
  Omit<CardProps, keyof SectionContractProps | "aria-label" | "aria-labelledby" | "render">;

/**
 * A titled card: title and description, actions and a body. Draw one per block of a detail page and give it a title
 * the page does not repeat; two with the same title need a `label` each.
 */
export function Section({
  title,
  description,
  headingLevel = 2,
  actions,
  moreActionsLabel,
  startContent,
  endContent,
  label,
  children,
  className,
  ...rest
}: SectionProps): ReactElement {
  const t = useUiText();
  moreActionsLabel ??= t(UI_KEYS.ui.section.more_actions);
  const titleId = useId();
  return (
    <Card
      {...rest}
      // A `label` names the section outright; otherwise the title does, so a renamed title renames the landmark too.
      {...(label ? { "aria-label": label } : { "aria-labelledby": titleId })}
      render={(domProps) => createElement("section", domProps)}
      className={cn("gap-4", className) ?? ""}
    >
      <Card.Header className="flex-row flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-1 basis-48 items-start gap-3">
          {startContent}
          <div className="grid min-w-0 gap-1">
            <Card.Title id={titleId} level={headingLevel}>
              {title}
            </Card.Title>
            {description == null ? null : <Card.Description>{description}</Card.Description>}
          </div>
        </div>
        <PageActions
          actions={actions ?? []}
          moreActionsLabel={moreActionsLabel}
          endContent={endContent}
          size="sm"
        />
      </Card.Header>
      {children == null ? null : <Card.Content>{children}</Card.Content>}
    </Card>
  );
}
