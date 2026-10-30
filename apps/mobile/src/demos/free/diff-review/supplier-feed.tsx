/**
 * Stackra file contract:
 * Purpose: the "supplier-feed" demo of the native DiffReview: a supplier feed.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (wave 3b).
 */
import { DiffReview, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DIFF_REVIEW_DEMO_KEYS } from "#src/demos/free/diff-review/diff-review-demo-keys.constant";

/** The demo's keys. */
const K = DIFF_REVIEW_DEMO_KEYS.demo_free.diff_review.supplier_feed;

/** Three changes from a supplier feed. */
export default function SupplierFeed() {
  const t = useCatalogueText(MESSAGES.en);
  const [decisions, setDecisions] = useState<Readonly<Record<string, "accepted" | "rejected">>>({});
  const [isApplied, setApplied] = useState(false);
  return (
    <View className="gap-2">
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
      <Text type="small" tone="success">
        {isApplied ? t(K.applied) : ""}
      </Text>
    </View>
  );
}
