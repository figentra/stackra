/**
 * Stackra file contract:
 * Purpose: the native `ApprovalCard`: an agent's tool call waiting for a human, as `@stackra/ui`'s Card: the request
 *          as the title with its status as a chip, the summary, the input as JSON, who must approve, and the reject,
 *          escalate and approve buttons while it is pending.
 * Boundary: shows and reports only; the handlers are the caller's (the ai gateway's approval endpoints). HeroUI Native
 *           Pro has no chat tool part, so the card is `@stackra/ui`'s Card, Chip, Text and Button. The status is a
 *           word in the chip (`ui_pro::enums.approval_status.*`), not a colour alone; after a decision the buttons go.
 *           A string or number title or summary is drawn inside text, since React Native refuses a bare string.
 * Runtime: react-native
 * Governing contract: ADR 0360 (decisions 6 to 9); ADR 0100 (decision 5); ADR 0310 (decision 3); WCAG 2.2 SC 1.4.1.
 */
import { Button, Card, Chip, Text } from "@stackra/ui/native";
import type { ReactElement, ReactNode } from "react";
import { View } from "react-native";

import type { ApprovalStatus } from "#contracts/enums/approval-status.enum";

import { UI_PRO_KEYS } from "#core/constants/ui-pro-keys.constant";
import { useUiProText } from "#native/hooks/use-ui-pro-text";
import type { ApprovalCardProps } from "#native/approval-card/approval-card.props";

/** The chip tone of each approval status. */
const TONE = Object.freeze({
  pending: "warning",
  approved: "success",
  rejected: "danger",
  escalated: "accent",
} as const satisfies Record<ApprovalStatus, string>);

/** A node as the card can draw it: a string or number inside `Text`, any other node as it is. */
function textual(node: ReactNode, tone: "default" | "muted" = "default"): ReactNode {
  return typeof node === "string" || typeof node === "number" ? (
    <Text type="small" tone={tone}>
      {node}
    </Text>
  ) : (
    node
  );
}

/** A tool call waiting for, or decided by, a human. */
export function ApprovalCard({
  title,
  summary,
  input,
  inputLabel,
  approver,
  status,
  onApprove,
  onReject,
  onEscalate,
  approveLabel,
  rejectLabel,
  escalateLabel,
}: ApprovalCardProps): ReactElement {
  const t = useUiProText();
  return (
    <Card testID="approval-card">
      <Card.Header>
        <View className="flex-row items-start justify-between gap-2">
          <View className="min-w-0 flex-1">
            <Card.Title level={3}>{title}</Card.Title>
          </View>
          <Chip size="sm" tone={TONE[status]}>
            {t(UI_PRO_KEYS.ui_pro.enums.approval_status[status])}
          </Chip>
        </View>
      </Card.Header>
      <Card.Content>
        <View className="gap-2">
          {summary == null ? null : textual(summary)}
          {input === undefined ? null : (
            <View className="gap-1">
              {inputLabel == null ? null : textual(inputLabel, "muted")}
              <Text type="caption" className="rounded-md bg-surface-secondary p-2 font-mono">
                {JSON.stringify(input, null, 2)}
              </Text>
            </View>
          )}
          {approver == null ? null : textual(approver, "muted")}
          {status === "pending" ? (
            <View className="flex-row flex-wrap justify-end gap-2">
              <Button size="sm" variant="danger-soft" onPress={onReject}>
                {rejectLabel}
              </Button>
              {onEscalate === undefined ? null : (
                <Button size="sm" variant="ghost" onPress={onEscalate}>
                  {escalateLabel}
                </Button>
              )}
              <Button size="sm" variant="primary" onPress={onApprove}>
                {approveLabel}
              </Button>
            </View>
          ) : null}
        </View>
      </Card.Content>
    </Card>
  );
}
