/**
 * Stackra file contract:
 * Purpose: the "edit-answers" demo of the web QuestionnaireCard: last week's answers to the sales report questions are
 *          filled in, so Next walks to the summary where one answer can be changed before the report is built.
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
const K = QUESTIONNAIRE_CARD_KEYS.questionnaire_card.edit_answers;

/** QuestionnaireCard: Edit earlier answers. */
export default function EditAnswers() {
  const t = useCatalogueText(MESSAGES.en);
  const periods = [
    { value: "this_week", label: t(K.this_week) },
    { value: "last_week", label: t(K.last_week) },
    { value: "this_month", label: t(K.this_month) },
  ];
  const [period, setPeriod] = useState<string | null>(null);
  return (
    <div className="grid w-full max-w-lg gap-3">
      <QuestionnaireCard
        title={t(K.title)}
        description={t(K.description)}
        submitLabel={t(K.submit)}
        defaultAnswers={{ period: "last_week", metrics: ["revenue", "orders"], format: "pdf" }}
        questions={[
          { id: "period", title: t(K.period), kind: "single", isRequired: true, options: periods },
          {
            id: "metrics",
            title: t(K.metrics),
            kind: "multiple",
            isRequired: true,
            options: [
              { value: "revenue", label: t(K.revenue) },
              { value: "orders", label: t(K.orders) },
              { value: "returns", label: t(K.returns) },
              { value: "basket", label: t(K.basket) },
            ],
          },
          {
            id: "format",
            title: t(K.format),
            kind: "single",
            options: [
              { value: "pdf", label: t(K.pdf) },
              { value: "excel", label: t(K.excel) },
            ],
          },
        ]}
        onSubmit={(answers) =>
          setPeriod(periods.find((option) => option.value === answers["period"])?.label ?? null)
        }
      />
      {period === null ? null : <Text tone="muted">{t(K.built, { period })}</Text>}
    </div>
  );
}
