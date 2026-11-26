/**
 * Stackra file contract:
 * Purpose: `TimelineHero`, a landing hero for a product that follows something from place to place (a parcel, an
 *          order, a visit): the `h1`, its lede and primary action, and at the inline end a window titled by the
 *          route's reference with the origin and destination over an ordered list of timed events, the last marked
 *          current.
 * Boundary: composition of @stackra/ui and the kit's band and CTA row only; every word comes in props. The arrow
 *           between origin and destination is decorative (`Icon` turns it in right-to-left), so the list's label
 *           names the route. The current event is marked by `aria-current="step"` and weight, never by colour alone.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 16); ADR 0504 (module UI kits); WCAG 2.2 1.3.1 and 1.4.1; STA-2041.
 */
import { Frame, Heading, Icon, Illustration, Text } from "@stackra/ui/react";
import type { ReactElement } from "react";

import { ROUTE_ARROW_ICON } from "#core/constants/route-arrow-icon.constant";
import { CtaRow } from "#react/cta-row/cta-row";
import { RuledBand } from "#react/ruled-band/ruled-band";
import { RULED_BAND_INLINE } from "#react/ruled-band/ruled-band-inline.constant";
import type { TimelineHeroProps } from "#react/timeline-hero/timeline-hero.props";

/**
 * The headline and its action beside a route's timeline.
 *
 * @example
 * <TimelineHero title="Every carrier. One status." lede={lede} primary={start} route={parcel} art={drawing} />
 */
export function TimelineHero({
  title,
  lede,
  primary,
  route,
  art,
  className,
}: TimelineHeroProps): ReactElement {
  const last = route.events.length - 1;
  return (
    <RuledBand label={title} className={className ?? ""}>
      <div className={`grid gap-12 py-16 lg:grid-cols-2 lg:py-24 ${RULED_BAND_INLINE}`}>
        <div className="flex flex-col items-start gap-6">
          <Heading level={1} type="h1" className="max-w-xl text-balance">
            {title}
          </Heading>
          <Text tone="muted" className="max-w-lg text-pretty">
            {lede}
          </Text>
          <CtaRow primary={primary} />
          {art === undefined ? null : (
            <div data-slot="hero-art" className="w-full max-w-sm">
              <Illustration
                src={art.src}
                width={art.width}
                height={art.height}
                {...(art.alt === undefined ? {} : { alt: art.alt })}
                className="w-full"
              />
            </div>
          )}
        </div>
        <div data-slot="hero-timeline" className="min-w-0">
          <Frame variant="schematic" title={route.reference}>
            <div className="flex flex-col gap-6 p-6">
              <Text className="inline-flex flex-wrap items-center gap-2 font-semibold">
                {route.origin}
                <Icon name={ROUTE_ARROW_ICON} aria-hidden />
                {route.destination}
              </Text>
              <ol
                aria-label={route.label}
                className="ms-1.5 flex flex-col gap-5 border-s border-border ps-5"
              >
                {route.events.map((event, index) => (
                  <li
                    key={`${event.time}|${event.status}`}
                    aria-current={index === last ? "step" : undefined}
                    className="relative flex flex-col gap-0.5"
                  >
                    <span
                      aria-hidden
                      className={`absolute -start-[calc(1.25rem+5px)] top-1.5 size-2.5 rounded-full ${
                        index === last ? "bg-accent" : "bg-border"
                      }`}
                    />
                    <Text type="small" tone="muted">
                      {event.time}
                    </Text>
                    <Text className={index === last ? "font-semibold" : ""}>{event.status}</Text>
                    {event.actor === undefined ? null : (
                      <Text type="small" tone="muted">
                        {event.actor}
                      </Text>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </Frame>
        </div>
      </div>
    </RuledBand>
  );
}
