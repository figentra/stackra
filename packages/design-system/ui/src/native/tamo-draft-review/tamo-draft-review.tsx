/**
 * Stackra file contract:
 * Purpose: the native `TamoDraftReview`: the text before and Tamo's draft after, with Accept, Edit (the draft becomes
 *          an editable area, then Accept takes the edit) and Discard; working, a shimmer and Stop; on error, the
 *          message and Try again.
 * Boundary: nothing reaches the field until Accept (ADR 0021). The platform Text lays out each text in its own
 *           script's direction.
 * Runtime: react-native
 * Governing contract: ADR 0507 (the draft review); ADR 0021; WCAG 2.2 SC 4.1.3.
 */
import { Label, TextArea, TextField } from "heroui-native";
import { useState, type ReactElement } from "react";
import { View } from "react-native";

import { TAMO_KEYS } from "#core/constants/tamo-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { Button } from "#native/button/button";
import { Shimmer } from "#native/shimmer/shimmer";
import { TamoMark } from "#native/tamo-mark/tamo-mark";
import { TamoStatusLine } from "#native/tamo-status-line/tamo-status-line";
import { Text } from "#native/text/text";
import type { TamoDraftReviewProps } from "#native/tamo-draft-review/tamo-draft-review.props";

/** K: the Tamo words. */
const K = TAMO_KEYS.ui.tamo;

/** Tamo's draft beside the text it would replace. */
export function TamoDraftReview({
  before,
  after,
  status = "ready",
  onAccept,
  onDiscard,
  onStop,
  onRetry,
  title,
  className,
}: TamoDraftReviewProps): ReactElement {
  const t = useUiText();
  const heading = title ?? t(K.after);
  const [edited, setEdited] = useState<string | null>(null);
  return (
    <View
      testID="tamo-draft-review"
      accessibilityLabel={heading}
      className={[
        "gap-3 rounded-[var(--radius-container)] border border-separator bg-surface p-3",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <View className="flex-row items-center gap-2">
        <TamoMark size="sm" status={status} />
        <Text type="small">{heading}</Text>
      </View>
      {status === "working" ? (
        <>
          <Shimmer kind="block" lines={2} />
          <TamoStatusLine status="working" onStop={onStop} />
        </>
      ) : status === "error" ? (
        <TamoStatusLine status="error" onRetry={onRetry} />
      ) : (
        <>
          {before.trim() === "" ? null : (
            <View className="gap-1">
              <Text type="caption" tone="muted">
                {t(K.before)}
              </Text>
              <Text type="small" tone="muted">
                {before}
              </Text>
            </View>
          )}
          {edited === null ? (
            <View className="gap-1">
              <Text type="caption" tone="muted">
                {t(K.after)}
              </Text>
              <Text type="small">{after}</Text>
            </View>
          ) : (
            <TextField>
              <Label>{t(K.after)}</Label>
              <TextArea
                accessibilityLabel={t(K.after)}
                value={edited}
                onChangeText={setEdited}
                numberOfLines={4}
              />
            </TextField>
          )}
          <View className="flex-row flex-wrap gap-2">
            <Button size="sm" onPress={() => onAccept(edited ?? after)}>
              {t(K.accept)}
            </Button>
            {edited === null ? (
              <Button size="sm" variant="secondary" onPress={() => setEdited(after)}>
                {t(K.edit)}
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" onPress={onDiscard}>
              {t(K.discard)}
            </Button>
          </View>
        </>
      )}
    </View>
  );
}
