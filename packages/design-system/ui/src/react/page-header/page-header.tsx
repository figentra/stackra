/**
 * Stackra file contract:
 * Purpose: the web `PageHeader`: the top of a page, a `header` holding the breadcrumb trail, the title as a real
 *          heading (the page's `h1` by default, `headingLevel` to move it), the `status` beside it, a muted line under
 *          it and the page's actions. `actions` is an ordered list: the first is the primary button, the next two are
 *          secondary buttons and the rest go in an ActionMenu named by `moreActionsLabel`. `startContent` leads the
 *          title and `endContent` follows the actions. An action with an `href` is a link drawn as a button, so it
 *          navigates through the nearest `RouterProvider`; one with only `onPress` is a button.
 * Boundary: HeroUI has no page header, so this is the documented adapted form on the earlier waves' `Breadcrumbs`,
 *           `Heading` and `Text` over a flex layout of theme tokens, and it imports no sibling piece of wave 6:
 *           `status` is a node (ADR 0317 decision 4). The actions row is `PageActions`, an internal row shared with
 *           Section and not a shell piece. The title is drawn in the `h3` style whatever its level, because the
 *           largest style is a marketing size too big for a console page. `label` makes the header a named group,
 *           never a landmark: a `header` inside `main` is not a banner, and a plain element may not take
 *           `aria-label`. The trail's landmark name is Breadcrumbs' own, so a page that draws two headers with a
 *           trail each gives one of them its own `Breadcrumbs` instead.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3, decision 5: adapted form); ADR 0303 (decision 7); ADR 0317 (decisions 1, 4
 *          and 5); ADR 0165 (HeroUI v3 on web); WCAG 2.2 SC 1.3.1, 2.4.6, 2.4.8 and 2.5.8.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { Breadcrumbs } from "#react/breadcrumbs/breadcrumbs";
import { Heading } from "#react/heading/heading";
import { PageActions } from "#react/page-actions/page-actions";
import { Text } from "#react/text/text";
import type { PageHeaderProps } from "#react/page-header/page-header.props";

/**
 * The top of a page: trail, title with status, description and actions. The title is the page's `h1` unless
 * `headingLevel` says otherwise; draw one per page.
 */
export function PageHeader({
  title,
  description,
  headingLevel = 1,
  breadcrumbs,
  status,
  actions,
  startContent,
  endContent,
  moreActionsLabel,
  label,
  className,
  ...rest
}: PageHeaderProps): ReactElement {
  const t = useUiText();
  moreActionsLabel ??= t(UI_KEYS.ui.page_header.more_actions);
  return (
    <header
      {...rest}
      {...(label ? { role: "group", "aria-label": label } : {})}
      className={cn("flex flex-col gap-3", className)}
    >
      {breadcrumbs && breadcrumbs.length > 0 ? <Breadcrumbs items={breadcrumbs} /> : null}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 flex-1 basis-64 items-start gap-3">
          {startContent}
          <div className="grid min-w-0 gap-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Heading level={headingLevel} type="h3">
                {title}
              </Heading>
              {status}
            </div>
            {description == null ? null : <Text tone="muted">{description}</Text>}
          </div>
        </div>
        <PageActions
          actions={actions ?? []}
          moreActionsLabel={moreActionsLabel}
          endContent={endContent}
        />
      </div>
    </header>
  );
}
