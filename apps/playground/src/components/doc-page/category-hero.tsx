/**
 * Stackra file contract:
 * Purpose: `CategoryHero`, the hero and pillar band of one category's page (`/components/<category>`): eyebrow, the
 *          category name, its benefit-led headline, paragraph, tags, "Suggest an improvement", a live signature demo
 *          (the first built entry's card example) and what / when / how.
 * Boundary: presentation over the registry and `showcase::doc.category.<id>.*`.
 * Runtime: browser
 * Governing contract: STA-1371 (doc pages wave, owner approval 2026-10-28).
 */
import type { I18nKey } from "@stackra/i18n";
import {
  byCategory,
  categoryDocKeys,
  categoryKeys,
  type ComponentCategory,
} from "@stackra/showcase";
import { useCatalogueText } from "@stackra/ui/react";

import { LiveDemo } from "#src/components/component-page/live-demo";
import { DocHero } from "#src/components/doc-page/doc-hero";
import { PillarBand } from "#src/components/doc-page/pillar-band";
import { MESSAGES } from "#src/constants/messages.constant";
import { demoPath } from "#src/demos";

/** The hero of `category`. */
export function CategoryHero({ category }: { readonly category: ComponentCategory }) {
  const t = useCatalogueText(MESSAGES.en);
  const say = (key: string) => t(key as I18nKey);
  const keys = categoryDocKeys(category);
  const title = say(categoryKeys(category).title);
  const lead = byCategory(category).find(
    (entry) => entry.status !== "planned" && entry.platforms.includes("react"),
  );
  const signature = lead?.examples.find((example) => example.card) ?? lead?.examples[0];
  return (
    <div className="grid gap-6">
      <DocHero
        eyebrow={say(keys.eyebrow)}
        title={title}
        page={title}
        headline={say(keys.headline)}
        intro={say(keys.intro)}
        tags={say(keys.tags)}
        demo={lead && signature ? <LiveDemo path={demoPath(lead, signature.id)} /> : undefined}
      />
      <PillarBand
        what={<bdi>{say(keys.what)}</bdi>}
        when={<bdi>{say(keys.when)}</bdi>}
        how={<bdi>{say(keys.how)}</bdi>}
      />
    </div>
  );
}
