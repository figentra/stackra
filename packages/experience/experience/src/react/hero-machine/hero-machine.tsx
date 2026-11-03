/**
 * Stackra file contract:
 * Purpose: `HeroMachine`, the landing's hero: a ruled blueprint band with the plain headline, its lede and the
 *          call-to-action row at the inline start, the machine at the inline end (a `Schematic` whose first node is
 *          the action's file in a schematic window, piped into one frame per surface, each with the action's button),
 *          and the engine drawing standing on a dither horizon whose champagne core is the sun.
 * Boundary: composition of @stackra/ui only; every word comes in props. The machine's pipe drawing in on floor steps
 *           (`Schematic`, the first time it is in view at the `full` motion level) is the page's one orchestrated
 *           motion; the horizon's only motion is DitherArt's own drift, which stops below the `full` level. The
 *           drawing is `Illustration`'s four tone layers in the theme's roles, never fetched; it is placed by logical
 *           layout and never mirrored. The pipes are measured, so Arabic draws them where the mirrored layout put the
 *           nodes.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0165 (UI through @stackra/ui); ADR 0060 (RTL); STA-2041 (design
 *                     pass §2, §4 and §6).
 */
import {
  CodeBlock,
  DitherArt,
  Frame,
  Heading,
  Illustration,
  Schematic,
  SchematicNode,
  Text,
} from "@stackra/ui/react";
import { type ReactElement, useMemo } from "react";

import { CtaRow } from "#react/cta-row/cta-row";
import type { HeroMachineProps } from "#react/hero-machine/hero-machine.props";
import { RuledBand } from "#react/ruled-band/ruled-band";
import { RULED_BAND_INLINE } from "#react/ruled-band/ruled-band-inline.constant";
import { SurfaceFrame } from "#react/surfaces/surface-frame";

/** The machine's first node, the action's window; no surface takes this id. */
const ACTION = "action";

/**
 * The headline, its actions and the machine on its horizon.
 *
 * @example
 * <HeroMachine title="One backend, every surface." lede={lede} primary={docs} art={engine} horizon={strata}
 *   machine={{ label: "One action, every surface", action: { filename: "cancel-order.action.ts", code }, surfaces }} />
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
  const surfaces = machine?.surfaces;
  // Stable while the surfaces are, so the machine re-measures only when they change.
  const links = useMemo(
    () => (surfaces ?? []).map((surface) => ({ from: ACTION, to: surface.id })),
    [surfaces],
  );
  return (
    // No band padding on the section, so the horizon runs full bleed; no clipping, so the band's `+` marks show whole.
    <RuledBand label={title} className={className ?? ""}>
      <div className={`grid gap-12 pt-16 lg:grid-cols-2 lg:pt-24 ${RULED_BAND_INLINE}`}>
        <div className="flex flex-col items-start gap-6">
          <Heading level={1} type="h1" className="max-w-xl text-balance">
            {title}
          </Heading>
          <Text tone="muted" className="max-w-lg text-pretty">
            {lede}
          </Text>
          <CtaRow primary={primary} copyLink={copyLink} command={command} />
        </div>
        {machine === undefined ? null : (
          <div data-slot="hero-machine" className="min-w-0">
            <Schematic label={machine.label} links={links} className="flex flex-col gap-12">
              <SchematicNode id={ACTION}>
                <Frame variant="schematic" title={machine.action.filename}>
                  <CodeBlock
                    code={machine.action.code}
                    language={machine.action.filename.slice(
                      machine.action.filename.lastIndexOf(".") + 1,
                    )}
                  />
                </Frame>
              </SchematicNode>
              <div className="flex flex-wrap items-start justify-center gap-4">
                {machine.surfaces.map((surface) => (
                  <SchematicNode
                    key={surface.id}
                    id={surface.id}
                    className="min-w-0 flex-1 basis-36"
                  >
                    <SurfaceFrame surface={surface} />
                  </SchematicNode>
                ))}
              </div>
            </Schematic>
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
    </RuledBand>
  );
}
