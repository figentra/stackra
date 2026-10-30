/**
 * Stackra file contract:
 * Purpose: the "current" demo of the web useBreakpoint: the window's size class and breakpoint, updating as the window
 *          is resized across Tailwind's edges.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Chip, Text, useBreakpoint, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { USE_BREAKPOINT_KEYS } from "#src/demos/free/use-breakpoint/use-breakpoint-keys.constant";

/** The demo's keys. */
const K = USE_BREAKPOINT_KEYS.use_breakpoint;

/** The useBreakpoint demo: current. */
export default function Current() {
  const t = useCatalogueText(MESSAGES.en);
  const { sizeClass, breakpoint } = useBreakpoint();
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2" role="status">
        <Chip tone="accent" variant="soft">
          {t(K.size_class, { size: t(K.size[sizeClass]) })}
        </Chip>
        <Chip>{t(K.breakpoint, { breakpoint: breakpoint ?? t(K.base) })}</Chip>
      </div>
      <Text tone="muted">{t(K.resize)}</Text>
    </div>
  );
}
