/**
 * Stackra file contract:
 * Purpose: the native `DiffReview`: one card per change with what changes, the old value struck through and the new
 *          one after an arrow, and an accept / reject pair; a header counts what is left and accepts all; apply waits
 *          until every change has an answer.
 * Boundary: controlled; answers are words on the buttons, not colour alone.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0060 (right-to-left); WCAG 2.2 SC 1.4.1; STA-1371.
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { Button } from "#native/button/button";
import type { DiffReviewProps } from "#native/diff-review/diff-review.props";
import { Icon } from "#native/icon/icon";
import { Text } from "#native/text/text";

/** The words' keys. */
const K = UI_KEYS.ui.diff_review;

/** A change set to accept or reject. */
export function DiffReview({
  changes,
  decisions,
  onDecisionsChange,
  onApply,
  label,
  className,
}: DiffReviewProps): ReactElement {
  const t = useUiText();
  const pending = changes.filter((change) => decisions[change.id] === undefined).length;
  const decide = (id: string, answer: "accepted" | "rejected") =>
    onDecisionsChange({ ...decisions, [id]: answer });
  return (
    <View accessibilityLabel={label} className={["gap-3", className].filter(Boolean).join(" ")}>
      <View className="flex-row items-center justify-between">
        <Text type="small" tone="muted" accessibilityLiveRegion="polite">
          {t(K.pending, { count: pending })}
        </Text>
        <Button
          size="sm"
          variant="ghost"
          startIcon="check-check"
          isDisabled={pending === 0}
          onPress={() =>
            onDecisionsChange(
              Object.fromEntries(
                changes.map((change) => [change.id, decisions[change.id] ?? "accepted"]),
              ),
            )
          }
        >
          {t(K.accept_all)}
        </Button>
      </View>
      {changes.map((change) => {
        const answer = decisions[change.id];
        return (
          <View
            key={change.id}
            className={[
              "gap-2 rounded-xl border border-separator p-3",
              answer === "rejected" ? "opacity-60" : "",
            ].join(" ")}
          >
            <Text type="caption" tone="muted" className="font-medium">
              {change.label}
            </Text>
            <View
              className="flex-row flex-wrap items-center gap-2"
              accessible
              accessibilityLabel={`${t(K.before)} ${change.before ?? t(K.not_set)}، ${t(K.after)} ${change.after ?? t(K.not_set)}`}
            >
              <Text type="small" tone="muted" className="rounded bg-danger/10 px-1 line-through">
                {change.before ?? t(K.not_set)}
              </Text>
              <Icon name="arrow-right" size="sm" tone="muted" />
              <Text type="small" className="rounded bg-success/10 px-1 font-medium">
                {change.after ?? t(K.not_set)}
              </Text>
            </View>
            <View className="flex-row gap-2">
              <Button
                size="sm"
                variant={answer === "accepted" ? "primary" : "secondary"}
                startIcon="check"
                onPress={() => decide(change.id, "accepted")}
              >
                {answer === "accepted" ? t(K.accepted) : t(K.accept)}
              </Button>
              <Button
                size="sm"
                variant={answer === "rejected" ? "danger" : "ghost"}
                startIcon="x"
                onPress={() => decide(change.id, "rejected")}
              >
                {answer === "rejected" ? t(K.rejected) : t(K.reject)}
              </Button>
            </View>
          </View>
        );
      })}
      {onApply ? (
        <Button isDisabled={pending > 0} onPress={() => onApply(decisions)}>
          {t(K.apply)}
        </Button>
      ) : null}
    </View>
  );
}
