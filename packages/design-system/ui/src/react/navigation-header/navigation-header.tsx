/**
 * Stackra file contract:
 * Purpose: the web `NavigationHeader`, an adapted form: the compact header of one screen, a `header` element. From the
 *          inline start it holds the back button (a link when `backHref` is given, otherwise a button for `onBack`), the
 *          `startContent` slot, the `title` as a heading (level 1 unless `headingLevel` says otherwise) and the
 *          `endContent` slot; with `hasLargeTitle` the title moves under the bar and is drawn large. Right-to-left
 *          mirrors the row, and the back chevron with it. `label` names the landmark and every other `header`
 *          attribute passes through.
 * Boundary: HeroUI has no navigation header, and the web PageHeader is for a full page with breadcrumbs and actions, so
 *           this is the compact form on a flex row and theme tokens. It imports no other shell piece (ADR 0317
 *           decision 4), so PageHeader's own title block is not reused. The back link goes through the nearest React
 *           Aria `RouterProvider`, never through a router import. The title is the page's `h1` by default, so a page
 *           holds this or a PageHeader, not both. A `header` inside `main` is not a banner, so a page that draws it there
 *           should leave `label` out: a name on a plain element is not allowed (ARIA 1.2).
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3, decision 5: adapted form); ADR 0303 (decision 7); ADR 0317 (decisions 1, 4,
 *          5 and 7); ADR 0165 (HeroUI v3 on web); ADR 0060; WCAG 2.2 SC 1.3.1, 2.4.6 and 2.5.8.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { Heading } from "#react/heading/heading";
import { Icon } from "#react/icon/icon";
import { IconButton } from "#react/icon-button/icon-button";
import { Link } from "#react/link/link";
import type { NavigationHeaderProps } from "#react/navigation-header/navigation-header.props";
import { useIsScrolled } from "#react/hooks/use-is-scrolled";

/** The back chevron, mirrored in right-to-left because it points the reading way back. */
const BACK_ICON = <Icon name="chevron-left" />;

/**
 * The compact header of one screen: back button, start slot, title and end slot, in that order from the inline start.
 * The title takes the room left over, so the end slot stays at the inline end.
 */
export function NavigationHeader({
  title,
  headingLevel = 1,
  hasLargeTitle = false,
  onBack,
  backHref,
  backLabel: backLabelProp,
  startContent,
  endContent,
  label,
  className,
  ...rest
}: NavigationHeaderProps): ReactElement {
  const isScrolled = useIsScrolled();
  const t = useUiText();
  const backLabel = backLabelProp ?? t(UI_KEYS.ui.navigation_header.back);
  const heading = (
    <Heading
      level={headingLevel}
      type={hasLargeTitle ? "h2" : "h5"}
      isTruncated={!hasLargeTitle}
      data-slot="navigation-header-title"
      className={hasLargeTitle ? "px-4 pb-3" : "min-w-0 flex-1"}
    >
      {title}
    </Heading>
  );
  return (
    <header
      {...rest}
      {...(isScrolled ? { "data-scrolled": "" } : {})}
      {...(label ? { "aria-label": label } : {})}
      className={cn("material-role-nav-bar border-b border-separator text-foreground", className)}
    >
      <div className="flex min-h-14 items-center gap-2 px-2 py-2">
        {backHref === undefined ? (
          onBack === undefined ? null : (
            <IconButton icon={BACK_ICON} label={backLabel} variant="ghost" onPress={onBack} />
          )
        ) : (
          <Link
            href={backHref}
            label={backLabel}
            underline="hover"
            data-slot="navigation-header-back"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-pill)]"
            {...(onBack ? { onPress: onBack } : {})}
          >
            {BACK_ICON}
          </Link>
        )}
        {startContent}
        {hasLargeTitle ? <div className="flex-1" /> : heading}
        {endContent == null ? null : (
          <div data-slot="navigation-header-actions" className="flex shrink-0 items-center gap-1">
            {endContent}
          </div>
        )}
      </div>
      {hasLargeTitle ? heading : null}
    </header>
  );
}
