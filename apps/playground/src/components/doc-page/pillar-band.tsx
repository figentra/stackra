/**
 * Stackra file contract:
 * Purpose: `PillarBand`, the band of three pillars under a doc-page hero: what it is, when to use it, how it is built
 *          (accessibility, RTL, theming), side by side from `md`, stacked on a phone.
 * Boundary: presentation; the words come in translated.
 * Runtime: browser
 * Governing contract: STA-1371 (doc pages wave, owner approval 2026-10-28).
 */
import { Icon, Text, useCatalogueText } from "@stackra/ui/react";

import { DOC_PAGE_KEYS } from "#src/components/doc-page/doc-page-keys.constant";
import type { PillarBandProps } from "#src/components/doc-page/pillar-band.props";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";

const K = DOC_PAGE_KEYS.showcase.doc.ui;

/** What, when and how. */
export function PillarBand({ what, when, how }: PillarBandProps) {
  const t = useCatalogueText(MESSAGES.en);
  const pillars = [
    { id: "what", icon: Icons.Info, title: t(K.pillar_what), body: what },
    { id: "when", icon: Icons.Clock, title: t(K.pillar_when), body: when },
    { id: "how", icon: Icons.Settings, title: t(K.pillar_how), body: how },
  ] as const;
  return (
    <ul className="grid gap-3 md:grid-cols-3">
      {pillars.map((pillar) => (
        <li key={pillar.id} className="grid">
          {/* A hairline, no fill: the band is text, not a surface, now that the article sits on the page. */}
          <div
            className="grid content-start gap-2 border border-separator p-4"
            style={{ borderRadius: "var(--radius-lg)" }}
          >
            <div className="flex items-center gap-2">
              <Icon name={pillar.icon} size="sm" />
              <Text className="font-semibold">{pillar.title}</Text>
            </div>
            <Text type="small" tone="muted">
              {pillar.body}
            </Text>
          </div>
        </li>
      ))}
    </ul>
  );
}
