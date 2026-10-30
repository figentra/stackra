/**
 * Stackra file contract:
 * Purpose: the "supplier-feed" demo of the web DiffReview: a supplier feed.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import type { DiffDecision } from "@stackra/ui/contracts";
import { DiffReview, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { DIFF_REVIEW_KEYS } from "#src/demos/free/diff-review/diff-review-keys.constant";

/** The demo's keys. */
const K = DIFF_REVIEW_KEYS.diff_review;

/** Diff review: three changes from a supplier feed. */
export default function SupplierFeed() {
  const t = useCatalogueText(MESSAGES.en);
  const [decisions, setDecisions] = useState<DiffDecision>({});
  const [isApplied, setApplied] = useState(false);
  return (
    <div className="flex w-full max-w-xl flex-col gap-2">
      <DiffReview
        label={t(K.label)}
        changes={[
          { id: "price", label: t(K.price), before: "42.00", after: "45.50" },
          { id: "stock", label: t(K.stock), before: "120", after: "96" },
          { id: "zone", label: t(K.zone), before: null, after: t(K.gulf) },
        ]}
        decisions={decisions}
        onDecisionsChange={setDecisions}
        onApply={() => setApplied(true)}
      />
      <p role="status" className="m-0 text-sm text-success">
        {isApplied ? t(K.applied) : ""}
      </p>
    </div>
  );
}
