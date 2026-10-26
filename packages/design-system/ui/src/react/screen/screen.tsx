/**
 * Stackra file contract:
 * Purpose: the web `Screen`, an adapted form: the page container of an app that has no AppShell (a desktop shell with
 *          its own title bar, an installed app). A `main` landmark that fills the window height, scrolls its content
 *          when `isScrollable` and keeps clear of the desktop title bar (`titlebar-area-height`, falling back to the
 *          safe-area inset) at the top, of the home indicator at the bottom and of a notch at the sides, for the
 *          `edges` it is given. `label` names the landmark and every other `main` attribute passes through.
 * Boundary: HeroUI has no screen container and native's keyboard and safe-area work has no web counterpart, so this is
 *           a `main` on theme tokens and `env()` insets. `isKeyboardAvoiding` is accepted and ignored: the browser
 *           scrolls a focused field into view. The side insets are physical (`pl`, `pr`) on purpose, because a notch is
 *           on one real side whatever the text direction. A screen holds the page's one `main`, as AppShell does, so a
 *           page uses one or the other and never both. A caller's `className` wins over the defaults, so a sample can
 *           give it a fixed height. `isEmbedded` is for a screen drawn inside another page (a preview, the playground):
 *           its root is a plain `div`, because that page already holds the one `main`, and it takes no `label`, because
 *           a name on a plain element is not allowed (ARIA 1.2).
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3, decision 5: adapted form); ADR 0303 (decision 7); ADR 0317 (decisions 5
 *          and 7); ADR 0165 (HeroUI v3 on web); ADR 0060; WCAG 2.2 SC 1.4.10 and 2.4.1.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { ScreenEdge } from "#contracts/enums/screen-edge.enum";
import type { ScreenProps } from "#react/screen/screen.props";

/**
 * The inset classes of each edge, written out in full so Tailwind finds them. The desktop title bar is the top inset
 * when the window draws its own controls; otherwise it is the device's safe area, and `0px` where there is neither.
 */
const EDGE_CLASS_NAME: Readonly<Record<ScreenEdge, string>> = Object.freeze({
  top: "pt-[env(titlebar-area-height,env(safe-area-inset-top,0px))]",
  bottom: "pb-[env(safe-area-inset-bottom,0px)]",
  sides: "pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)]",
});

/**
 * The container of one screen: a `main` that fills the window, scrolls when asked and keeps clear of the system's
 * own parts on the edges named. Without `edges` it clears all of them.
 */
export function Screen({
  isScrollable = true,
  // Taken so it does not reach the DOM; the browser lifts a focused field itself.
  isKeyboardAvoiding: _isKeyboardAvoiding,
  edges = ScreenEdge,
  isEmbedded = false,
  label,
  className,
  children,
  ...rest
}: ScreenProps): ReactElement {
  const Root = isEmbedded ? "div" : "main";
  return (
    <Root
      {...rest}
      {...(label && !isEmbedded ? { "aria-label": label } : {})}
      className={cn(
        "flex h-dvh flex-col bg-background text-foreground",
        isScrollable ? "overflow-y-auto" : "overflow-hidden",
        edges.map((edge) => EDGE_CLASS_NAME[edge]),
        className,
      )}
    >
      {children}
    </Root>
  );
}
