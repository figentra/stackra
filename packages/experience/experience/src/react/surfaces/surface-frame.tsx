/**
 * Stackra file contract:
 * Purpose: `SurfaceFrame`, one surface the action reaches: a @stackra/ui `Frame` (a titled window for web and
 *          desktop, a phone for phone) holding the real @stackra/ui `Button` with the surface's words.
 * Boundary: internal to the `./react` entry (HeroMachine's machine and `Surfaces` draw it); not exported. The surface
 *           is an illustration: one `img` named by its own words (title and button) in their language, its drawn
 *           screen `inert` and hidden, so the unwired button is never a tab stop or announced as a control. With
 *           `lang` the words take their language and its direction (Arabic mirrors to the right); the chrome never
 *           mirrors its drawing.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0165 (UI through @stackra/ui); ADR 0060 (RTL); STA-2041 (design
 *                     pass §2: the Cancel order button on web, desktop and phone, and mirrored in Arabic).
 */
import { directionOf } from "@stackra/ui";
import { Bidi, Button, Frame } from "@stackra/ui/react";
import type { ReactElement } from "react";

import type { SurfaceFrameProps } from "#react/surfaces/surface-frame.props";

/** The button centred in the surface's screen. */
const SCREEN = "flex size-full items-center justify-center p-6";

/**
 * One surface with its button.
 *
 * @example
 * <SurfaceFrame surface={{ id: "web", kind: "web", title: "orders.example", button: "Cancel order" }} />
 */
export function SurfaceFrame({ surface }: SurfaceFrameProps): ReactElement {
  const button = <Button size="sm">{surface.button}</Button>;
  const screen = surface.lang ? (
    <Bidi isBlock dir={directionOf(surface.lang)} lang={surface.lang} className={SCREEN}>
      {button}
    </Bidi>
  ) : (
    <div className={SCREEN}>{button}</div>
  );
  return (
    <div
      data-slot="surface"
      data-kind={surface.kind}
      role="img"
      aria-label={`${surface.title}, ${surface.button}`}
      {...(surface.lang === undefined ? {} : { lang: surface.lang })}
    >
      {/* Drawn, not wired: out of the tab order and the tree; the img's name speaks for it. */}
      <div inert aria-hidden="true">
        {surface.kind === "phone" ? (
          <Frame variant="phone" className="max-w-40">
            {screen}
          </Frame>
        ) : (
          <Frame variant="window" title={surface.title}>
            {screen}
          </Frame>
        )}
      </div>
    </div>
  );
}
