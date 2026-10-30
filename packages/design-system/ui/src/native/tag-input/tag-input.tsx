/**
 * Stackra file contract:
 * Purpose: the native `TagInput`: free-text tags in one field box: type a tag and press return or a comma, or paste a
 *          list split on commas and line breaks; each tag is checked (the caller's rule, duplicates, the maximum) and
 *          the last refusal is announced politely under the field. Backspace in the empty input removes the last tag.
 * Boundary: the tags are the removable TagGroup; the input is React Native's TextInput named by the label. The state is
 *           the web TagInput's (`useTagInputState`).
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 3.3.1 and 4.1.3; STA-1371.
 */
import type { ReactElement } from "react";
import { TextInput, View } from "react-native";

import { DISPLAY_KEYS } from "#core/constants/display-keys.constant";
import { useTagInputState } from "#react/hooks/use-tag-input-state";
import { useUiText } from "#react/hooks/use-ui-text";
import { useNumberFormat } from "#native/hooks/use-number-format";
import { TagGroup } from "#native/tag-group/tag-group";
import type { TagInputProps } from "#native/tag-input/tag-input.props";
import { Text } from "#native/text/text";

/** The tag input's keys. */
const K = DISPLAY_KEYS.ui.tag_input;

/** Free-text tags in one field. */
export function TagInput(props: TagInputProps): ReactElement {
  const {
    label,
    description,
    errorMessage,
    placeholder,
    maxTags,
    isInvalid,
    isDisabled,
    isReadOnly,
    className,
  } = props;
  const t = useUiText();
  const format = useNumberFormat();
  const { tags, draft, setDraft, problem, add, remove, isFull } = useTagInputState(props);
  const isLocked = Boolean(isDisabled || isReadOnly);
  const name = typeof label === "string" ? label : undefined;
  return (
    <View className={`gap-1.5 ${className ?? ""}`}>
      <View className="flex-row items-baseline justify-between gap-2">
        {label == null ? <View /> : <Text className="font-medium">{label}</Text>}
        {maxTags === undefined ? null : (
          <Text type="small" tone="muted">
            {t(K.count, { count: format(tags.length), max: format(maxTags) })}
          </Text>
        )}
      </View>
      <View
        className={`min-h-11 flex-row flex-wrap items-center gap-1.5 rounded-[var(--radius-control)] border bg-field px-2 py-1.5 ${isInvalid ? "border-danger" : "border-field-border"} ${isDisabled ? "opacity-50" : ""}`}
      >
        {tags.length > 0 ? (
          <TagGroup
            {...(name ? { accessibilityLabel: name } : {})}
            size="sm"
            items={tags.map((tag, index) => ({ id: `${index}`, label: tag }))}
            {...(isLocked
              ? {}
              : {
                  onRemove: (keys: readonly string[]) => keys.forEach((key) => remove(Number(key))),
                  removeLabel: (tag: string) => t(K.remove, { tag }),
                })}
          />
        ) : null}
        <TextInput
          {...(name ? { accessibilityLabel: name } : {})}
          value={draft}
          editable={!isLocked && !isFull}
          {...(tags.length === 0 && placeholder ? { placeholder } : {})}
          className="min-w-24 flex-1 px-1 py-1 text-base text-field-foreground"
          returnKeyType="done"
          submitBehavior="submit"
          onChangeText={(text) => (/[,،;\n]/u.test(text) ? add(text) : setDraft(text))}
          onSubmitEditing={() => add(draft)}
          onKeyPress={({ nativeEvent }) => {
            if (nativeEvent.key === "Backspace" && draft === "" && tags.length > 0)
              remove(tags.length - 1);
          }}
          onBlur={() => {
            if (draft.trim()) add(draft);
          }}
        />
      </View>
      {problem ? (
        <Text type="small" tone="danger" accessibilityLiveRegion="polite">
          {problem}
        </Text>
      ) : null}
      {isInvalid && errorMessage ? (
        <Text type="small" tone="danger">
          {errorMessage}
        </Text>
      ) : description ? (
        <Text type="small" tone="muted">
          {description}
        </Text>
      ) : null}
    </View>
  );
}
