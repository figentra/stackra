/**
 * Stackra file contract:
 * Purpose: the "offer-brief" demo of the web QuestionnaireCard: before drafting an Eid offer the assistant asks the
 *          goal (with Other), the branches, the discount and what to leave out, then sends the answers.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { QuestionnaireCard, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { QUESTIONNAIRE_CARD_KEYS } from "#src/demos/free/questionnaire-card/questionnaire-card-keys.constant";

/** The demo's keys. */
const K = QUESTIONNAIRE_CARD_KEYS.questionnaire_card.offer_brief;

/** QuestionnaireCard: Offer brief. */
export default function OfferBrief() {
  const t = useCatalogueText(MESSAGES.en);
  const [sent, setSent] = useState<number | null>(null);
  return (
    <div className="grid w-full max-w-lg gap-3">
      <QuestionnaireCard
        title={t(K.title)}
        description={t(K.description)}
        questions={[
          {
            id: "goal",
            title: t(K.goal),
            kind: "single",
            isRequired: true,
            allowsOther: true,
            options: [
              { value: "clear", label: t(K.goal_clear) },
              { value: "return", label: t(K.goal_return) },
              { value: "launch", label: t(K.goal_launch) },
            ],
          },
          {
            id: "branches",
            title: t(K.branches),
            description: t(K.branches_hint),
            kind: "multiple",
            options: [
              { value: "olaya", label: t(K.olaya) },
              { value: "tahlia", label: t(K.tahlia) },
              { value: "online", label: t(K.online) },
            ],
          },
          {
            id: "discount",
            title: t(K.discount),
            kind: "single",
            options: [
              { value: "10", label: t(K.up_to_10) },
              { value: "20", label: t(K.up_to_20) },
              { value: "30", label: t(K.up_to_30) },
            ],
          },
          { id: "avoid", title: t(K.avoid), kind: "text", placeholder: t(K.avoid_placeholder) },
        ]}
        onSubmit={(answers) => setSent(Object.keys(answers).length)}
      />
      {sent === null ? null : <Text tone="muted">{t(K.sent, { count: sent })}</Text>}
    </div>
  );
}
