/**
 * Stackra file contract:
 * Purpose: `HeroMachineBlock`, the landing's hero: a ruled blueprint band with the plain headline, its lede and the
 *          call-to-action row at the inline start, the machine (the schematic) at the inline end, and the engine
 *          drawing standing on a dither horizon whose champagne core is the sun.
 * Boundary: composition of @stackra/ui only; every word comes in props. The horizon's only motion is DitherArt's
 *           own drift, which stops below the `full` motion level. The drawing is placed by logical layout and never
 *           mirrored.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0165 (UI through @stackra/ui); ADR 0060 (RTL); STA-2041 (design
 *                     pass §2 and §4).
 */
import { BlueprintSection, DitherArt, Heading, Text } from "@stackra/ui/react";
import type { ReactElement } from "react";

import { CtaRowBlock } from "#react/cta-row-block/cta-row-block";
import type { HeroMachineBlockProps } from "#react/hero-machine-block/hero-machine-block.props";

/**
 * The headline, its actions and the machine on its horizon.
 *
 * @example
 * <HeroMachineBlock title="One backend, every surface." lede={lede} primary={docs} art={engine} horizon={strata} />
 */
export function HeroMachineBlock({
  title,
  lede,
  primary,
  copyLink,
  command,
  art,
  horizon,
  machine,
  className,
}: HeroMachineBlockProps): ReactElement {
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
          <CtaRowBlock primary={primary} copyLink={copyLink} command={command} />
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
        <img src={art.src} alt={art.alt ?? ""} className="relative h-auto w-full max-w-md" />
      </div>
    </BlueprintSection>
  );
}
