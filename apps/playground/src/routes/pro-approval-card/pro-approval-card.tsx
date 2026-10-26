/**
 * Stackra file contract:
 * Purpose: the page of the Approval card route: `@stackra-pro/ui`'s ApprovalCard as a pending refund an agent asks a
 *          finance approver for, whose buttons decide it on the page, and the decided states beside it.
 * Boundary: presentation only; the decision is local state and nothing reaches an approval endpoint.
 * Runtime: browser
 * Governing contract: ADR 0360 (decisions 6 to 9); ADR 0310 (decision 12); STA-803.
 */
import * as UiPro from "@stackra-pro/ui/react";
import { useState } from "react";

import { ProApprovalCardRoute } from "#src/routes/pro-approval-card/pro-approval-card.route";

// shortcut: English strings in one place until the playground reads `playground::*` keys (STA-788).
const STRINGS = {
  documentTitle: `${ProApprovalCardRoute.title} · Stackra Playground`,
  intro:
    "An agent's tool call waiting for a human: what it will do, the input it will run with, who must approve, and the buttons that decide it.",
  pending: "Waiting for a decision",
  decided: "Decided",
  title: "Refund order #1042",
  summary: "Returns 120.00 SAR to the customer's card.",
  input: "Input",
  approver: "Needs a finance approver",
  approve: "Approve",
  reject: "Reject",
  escalate: "Escalate",
  restock: "Restock oat milk",
  archive: "Archive 40 old drafts",
} as const;

/** The Approval card page. */
export function ProApprovalCard() {
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "escalated">(
    "pending",
  );
  const decide = {
    onApprove: () => setStatus("approved"),
    onReject: () => setStatus("rejected"),
    approveLabel: STRINGS.approve,
    rejectLabel: STRINGS.reject,
  };
  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProApprovalCardRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="pending-heading" className="grid max-w-xl gap-3">
        <h2 id="pending-heading" className="type-h2">
          {STRINGS.pending}
        </h2>
        <UiPro.ApprovalCard
          title={STRINGS.title}
          summary={STRINGS.summary}
          input={{ orderId: "ord_01JD3K", amount: "120.00", currency: "SAR" }}
          inputLabel={STRINGS.input}
          approver={STRINGS.approver}
          status={status}
          onEscalate={() => setStatus("escalated")}
          escalateLabel={STRINGS.escalate}
          {...decide}
        />
      </section>
      <section aria-labelledby="decided-heading" className="grid max-w-xl gap-3">
        <h2 id="decided-heading" className="type-h2">
          {STRINGS.decided}
        </h2>
        <UiPro.ApprovalCard title={STRINGS.restock} status="approved" {...decide} />
        <UiPro.ApprovalCard title={STRINGS.archive} status="rejected" {...decide} />
      </section>
    </article>
  );
}
