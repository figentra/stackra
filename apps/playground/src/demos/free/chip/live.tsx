/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Chip: Step through the variants and the tones; the chip shows what it is.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 3 and 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Enum, Tone } from "@stackra/contracts";
import { ChipVariant } from "@stackra/ui/contracts";
import { Button, Chip as UiChip, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CHIP_KEYS } from "#src/demos/free/chip/chip-keys.constant";

/** The demo's keys. */
const K = CHIP_KEYS.chip;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-3";

/** Chip: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [variantIndex, setVariantIndex] = useState(0);

  const [toneIndex, setToneIndex] = useState(0);

  const variant = ChipVariant[variantIndex] ?? "secondary";

  const tone = Enum.values(Tone)[toneIndex] ?? "default";

  return (
    <div className="grid gap-6">
      <div className={ROW}>
        <Button
          variant="secondary"
          onPress={() => setVariantIndex((index) => (index + 1) % ChipVariant.length)}
        >
          {t(K.next_variant)}
        </Button>
        <Button
          variant="secondary"
          onPress={() => setToneIndex((index) => (index + 1) % Enum.values(Tone).length)}
        >
          {t(K.next_tone)}
        </Button>
      </div>
      <div className={ROW}>
        <UiChip variant={variant} tone={tone} startIcon="check">
          {t(K.current, { variant, tone })}
        </UiChip>
      </div>
    </div>
  );
}
