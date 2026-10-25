/**
 * Stackra file contract:
 * Purpose: the web `AppHeader`: the console's top bar, a `header` element that is the page's banner landmark when it
 *          is a direct child of the shell. From the inline start it holds `startContent` (the button that opens the
 *          sidebar), the `title` (the app's name or logo), the `search` slot taking the room left over, `endContent`
 *          (the bar's actions) and the `userMenu`, so right-to-left mirrors the whole bar without a physical side
 *          written anywhere. `label` names the landmark and every other `header` attribute passes through.
 * Boundary: HeroUI has no application bar (its Navbar is HeroUI Pro's), so this is the documented adapted form on a
 *           flex row and theme tokens. It imports no other shell piece: each part is a node the app fills (ADR 0317
 *           decision 4). A string title is drawn as semibold text and truncated; any other node is drawn as it is. The
 *           title is not a heading, because the page's one `h1` is PageHeader's. A `header` inside `main`, `article` or
 *           `section` is not a banner, so a page that draws the bar there should leave `label` out: a name on a plain
 *           element is not allowed (ARIA 1.2).
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3, decision 5: adapted form); ADR 0303 (decision 7); ADR 0317 (decisions 1, 4
 *          and 5); ADR 0165 (HeroUI v3 on web); WCAG 2.2 SC 1.3.1, 2.4.1 and 2.5.8.
 */
import { cn } from "@heroui/react";
import type { ComponentPropsWithRef, ReactElement } from "react";

import type { AppHeaderContractProps } from "#contracts/types/app-header-contract-props.type";

/**
 * Props of the web AppHeader: the shared contract plus the `header` element's own props, passed through. The
 * element's `aria-label` is the contract's `label` and its `title` attribute gives way to the contract's `title`, so
 * the type refuses the first and replaces the second.
 */
export type AppHeaderProps = AppHeaderContractProps &
  Omit<ComponentPropsWithRef<"header">, keyof AppHeaderContractProps | "aria-label" | "children">;

/**
 * The top bar of the console: start slot, title, search, end slot and user menu, in that order from the inline start.
 * The search slot takes the room left over, so the end slot and the user menu stay at the inline end whether or not
 * there is a search.
 */
export function AppHeader({
  title,
  search,
  startContent,
  endContent,
  userMenu,
  label,
  className,
  ...rest
}: AppHeaderProps): ReactElement {
  return (
    <header
      {...rest}
      {...(label ? { "aria-label": label } : {})}
      className={cn(
        "flex min-h-14 items-center gap-3 border-b border-separator bg-background px-4 py-2 text-foreground",
        className,
      )}
    >
      {startContent}
      {title == null ? null : (
        <div
          data-slot="app-header-title"
          className={typeof title === "string" ? "min-w-0 truncate font-semibold" : "shrink-0"}
        >
          {title}
        </div>
      )}
      <div data-slot="app-header-search" className="flex min-w-0 flex-1 items-center">
        {search}
      </div>
      {endContent == null ? null : (
        <div data-slot="app-header-actions" className="flex shrink-0 items-center gap-1">
          {endContent}
        </div>
      )}
      {userMenu}
    </header>
  );
}
