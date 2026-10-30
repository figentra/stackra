/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Breadcrumbs: Press a step to cut the trail back to it; the button goes one
 *          level deeper. The page names the current step.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0313; ADR 0060 (right-to-left); WCAG 2.2 SC 2.4.8.
 */
import type { BreadcrumbItem } from "@stackra/ui/contracts";
import { Breadcrumbs as UiBreadcrumbs, Button, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { BREADCRUMBS_KEYS } from "#src/demos/free/breadcrumbs/breadcrumbs-keys.constant";

/** The demo's keys. */
const K = BREADCRUMBS_KEYS.breadcrumbs;

/** Breadcrumbs: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  /** The trail of the drill-down example, from the root to its deepest step. */
  const FULL_TRAIL: readonly BreadcrumbItem[] = [
    { id: "home", label: t(K.home) },
    { id: "orders", label: t(K.orders) },
    { id: "order", label: t(K.order) },
    { id: "invoice", label: t(K.invoice) },
  ];
  const [depth, setDepth] = useState(FULL_TRAIL.length);

  const live: readonly BreadcrumbItem[] = FULL_TRAIL.slice(0, depth).map((item, index) => ({
    ...item,
    onPress: () => setDepth(index + 1),
  }));

  const currentName = live.at(-1)?.label ?? t(K.home);

  return (
    <div className="grid gap-6">
      <UiBreadcrumbs label={t(K.live_label)} items={live} />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          isDisabled={depth >= FULL_TRAIL.length}
          onPress={() => setDepth((value) => Math.min(value + 1, FULL_TRAIL.length))}
        >
          {t(K.deeper)}
        </Button>
        <Button variant="tertiary" onPress={() => setDepth(1)}>
          {t(K.reset)}
        </Button>
      </div>
      <output aria-live="polite" data-testid="current-page">
        <bdi>{t(K.current, { name: currentName })}</bdi>
      </output>
    </div>
  );
}
