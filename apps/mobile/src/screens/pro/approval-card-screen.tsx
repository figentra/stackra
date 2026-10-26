/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `ApprovalCard` (@stackra-pro/ui): a pending refund decided by
 *          its buttons on the page, and the approved, rejected and escalated states.
 * Boundary: presentation and local demo state only; nothing reaches an approval endpoint.
 * Runtime: react-native
 * Governing contract: ADR 0360 (decisions 6 to 9); ADR 0310 (decision 6); STA-803.
 */
import { ApprovalCard } from "@stackra-pro/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  pending: {
    title: "Pending",
    description: "Approve, reject or escalate; the buttons go once it is decided.",
  },
  decided: {
    title: "Decided",
    description: "`status`: `approved`, `rejected` and `escalated`, each a word in the chip.",
  },
  request: "Refund order #1042",
  summary: "Returns 120.00 SAR to the customer's card.",
  input: "Input",
  approver: "Needs a finance approver",
  approve: "Approve",
  reject: "Reject",
  escalate: "Escalate",
  decidedTitles: ["Restock oat milk", "Archive 40 old drafts", "Change a price list"],
} as const;

/** The ApprovalCard page. */
export function ApprovalCardScreen() {
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "escalated">(
    "pending",
  );
  const labels = { approveLabel: STRINGS.approve, rejectLabel: STRINGS.reject };
  const ignore = { onApprove: () => undefined, onReject: () => undefined };
  return (
    <Screen>
      <Section title={STRINGS.pending.title} description={STRINGS.pending.description}>
        <ApprovalCard
          title={STRINGS.request}
          summary={STRINGS.summary}
          input={{ orderId: "ord_01JD3K", amount: "120.00", currency: "SAR" }}
          inputLabel={STRINGS.input}
          approver={STRINGS.approver}
          status={status}
          onApprove={() => setStatus("approved")}
          onReject={() => setStatus("rejected")}
          onEscalate={() => setStatus("escalated")}
          escalateLabel={STRINGS.escalate}
          {...labels}
        />
      </Section>
      <Section title={STRINGS.decided.title} description={STRINGS.decided.description}>
        <View className="gap-3">
          <ApprovalCard
            title={STRINGS.decidedTitles[0]}
            status="approved"
            {...ignore}
            {...labels}
          />
          <ApprovalCard
            title={STRINGS.decidedTitles[1]}
            status="rejected"
            {...ignore}
            {...labels}
          />
          <ApprovalCard
            title={STRINGS.decidedTitles[2]}
            status="escalated"
            {...ignore}
            {...labels}
          />
        </View>
      </Section>
    </Screen>
  );
}
