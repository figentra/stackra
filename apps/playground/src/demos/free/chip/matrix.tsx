/**
 * Stackra file contract:
 * Purpose: the "matrix" demo of the web Chip: One table per size: a row per variant, a column per tone, each chip
 *          labelled with its tone.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 3 and 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Enum, Tone } from "@stackra/contracts";
import { ChipVariant, Size } from "@stackra/ui/contracts";
import { Chip as UiChip, Heading, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CHIP_KEYS } from "#src/demos/free/chip/chip-keys.constant";

/** The demo's keys. */
const K = CHIP_KEYS.chip;

/** Chip: Variants and tones. */
export default function Matrix() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <>
      {Size.map((size) => (
        <div key={size} className="grid gap-2">
          <Heading level={3}>{t(K.size, { size })}</Heading>
          <table className="w-full text-start">
            <thead>
              <tr>
                <th scope="col" className="p-2 text-start text-sm font-semibold">
                  {t(K.variant_column)}
                </th>
                {Enum.values(Tone).map((name) => (
                  <th key={name} scope="col" className="p-2 text-start text-sm font-semibold">
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ChipVariant.map((name) => (
                <tr key={name}>
                  <th scope="row" className="p-2 text-start text-sm font-semibold">
                    {name}
                  </th>
                  {Enum.values(Tone).map((toneName) => (
                    <td key={toneName} className="p-2">
                      <UiChip variant={name} tone={toneName} size={size}>
                        {toneName}
                      </UiChip>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}
