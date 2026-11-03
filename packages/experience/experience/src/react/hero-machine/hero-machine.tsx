/**
 * Stackra file contract:
 * Purpose: `HeroMachine`, the landing's hero: a ruled blueprint band with the plain headline, its lede and the
 *          call-to-action row at the inline start, the machine (the schematic) at the inline end, and the engine
 *          drawing standing on a dither horizon whose champagne core is the sun.
 * Boundary: composition of @stackra/ui only; every word comes in props. The horizon's only motion is DitherArt's
 *           own drift, which stops below the `full` motion level. The drawing is `Illustration`'s four tone layers in
 *           the theme's roles, never fetched; it is placed by logical layout and never mirrored.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0165 (UI through @stackra/ui); ADR 0060 (RTL); STA-2041 (design
 *                     pass §2 and §4).
 */
import { BlueprintSection, DitherArt, Heading, Illustration, Text } from "@stackra/ui/react";
import type { ReactElement } from "react";

import { CtaRow } from "#react/cta-row/cta-row";
import type { HeroMachineProps } from "#react/hero-machine/hero-machine.props";

/**
 * The headline, its actions and the machine on its horizon.
 *
 * @example
 * <HeroMachine title="One backend, every surface." lede={lede} primary={docs} art={engine} horizon={strata} />
 */
export function HeroMachine({
  title,
  lede,
  primary,
  copyLink,
  command,
  art,
  horizon,
  machine,
  className,
}: HeroMachineProps): ReactElement {
  return (
    <BlueprintSection label={title} className={`overflow-hidden ${className ?? ""}`}>
      <div className="grid gap-12 px-4 pt-16 sm:px-8 lg:grid-cols-2 lg:px-12 lg:pt-24">
        <div className="flex flex-col items-start gap-6">
          <Heading level={1} type="h1" className="max-w-xl text-balance">
            {title}
          </Heading>
          <Text tone="muted" className="max-w-lg text-pretty">
            {lede}
          </Text>
          <CtaRow primary={primary} copyLink={copyLink} command={command} />
        </div>
        {machine == null ? null : (
          <div data-slot="hero-machine" className="min-w-0">
            {machine}
          </div>
        )}
      </div>
      <div data-slot="hero-horizon" className="relative mt-12 flex justify-end">
        <DitherArt
          front="stk-tile-line"
          mask="top"
          {...horizon}
          className={`absolute inset-x-0 bottom-0 h-2/3 ${horizon.className ?? ""}`}
        />
        <div data-slot="hero-art" className="relative w-full max-w-md">
          <Illustration
            src={art.src}
            width={art.width}
            height={art.height}
            {...(art.alt === undefined ? {} : { alt: art.alt })}
            className="w-full"
          />
        </div>
      </div>
    </BlueprintSection>
  );
}
