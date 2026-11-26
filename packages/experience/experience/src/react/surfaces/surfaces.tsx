/**
 * Stackra file contract:
 * Purpose: `Surfaces`, the Draw station's window: the one action's button drawn on every surface (web, desktop,
 *          phone, and mirrored in Arabic), the same frames as the hero's machine, in a row that wraps.
 * Boundary: composition of @stackra/ui's `Frame` and `Button`; a group named by `label`, read in order. Every word
 *           comes in props. Nothing moves.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0165 (UI through @stackra/ui); ADR 0060 (RTL); STA-2041 (design
 *                     pass §2).
 */
import type { ReactElement } from "react";

import { RuledBand } from "#react/ruled-band/ruled-band";
import { SurfaceFrame } from "#react/surfaces/surface-frame";
import type { SurfacesProps } from "#react/surfaces/surfaces.props";

/**
 * The surfaces, each with the button.
 *
 * @example
 * <Surfaces label="Cancel order on every surface" surfaces={surfaces} />
 */
export function Surfaces({ label, surfaces, className }: SurfacesProps): ReactElement {
  return (
    <RuledBand>
      <div
        role="group"
        aria-label={label}
        data-slot="surfaces"
        className={`flex flex-wrap items-start gap-4 ${className ?? ""}`}
      >
        {surfaces.map((surface) => (
          <div key={surface.id} className="min-w-0 flex-1 basis-48">
            <SurfaceFrame surface={surface} />
          </div>
        ))}
      </div>
    </RuledBand>
  );
}
