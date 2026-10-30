/**
 * Stackra file contract:
 * Purpose: the native `ModelPicker` on HeroUI Native's Select in a bottom sheet: the trigger shows the picked model's
 *          icon, name and badge; the sheet groups the models by provider, each row with its name, a New or Beta chip,
 *          a short description, its capability tags and context size, and a disabled model's reason in place of its
 *          description.
 * Boundary: HeroUI Native's Select (inset sheet, as the house Select) and the house Chip and Text. The picker holds the
 *           value itself when uncontrolled, so the trigger can draw the whole model. Each row is named by the model's
 *           name, and a disabled row's reason is read with it.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI Native on native); STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import { cn, Label, Select as HeroSelect } from "heroui-native";
import { useState, type ReactElement } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { AiModel } from "#contracts/types/ai-model.type";
import { AI_ASSIST_KEYS } from "#core/constants/ai-assist-keys.constant";
import { modelsByProvider } from "#core/functions/models-by-provider.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { Chip } from "#native/chip/chip";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { Icon } from "#native/icon/icon";
import { Text } from "#native/text/text";
import type { ModelPickerProps } from "#native/model-picker/model-picker.props";

const K = AI_ASSIST_KEYS.ui.model_picker;

/** A model's icon: a name through the house Icon, an element as given. */
function ModelIcon({ icon }: { readonly icon: AiModel["icon"] }) {
  if (icon === undefined) return null;
  return (
    <View
      className="size-5 items-center justify-center"
      importantForAccessibility="no-hide-descendants"
    >
      {typeof icon === "string" ? <Icon name={icon} size="sm" /> : icon}
    </View>
  );
}

/** Picks an AI model from a sheet grouped by provider. */
export function ModelPicker({
  models,
  value,
  defaultValue,
  onChange,
  label,
  isLabelVisible = true,
  isDisabled = false,
  isFullWidth = false,
  className,
}: ModelPickerProps): ReactElement {
  const t = useUiText();
  const { locale } = useDesignSystem();
  const insets = useSafeAreaInsets();
  const [held, setHeld] = useState(defaultValue ?? null);
  const picked = value === undefined ? held : value;
  const model = models.find((candidate) => candidate.id === picked);
  const name = label ?? t(K.label);
  const compact = new Intl.NumberFormat(locale, { notation: "compact" });

  const badge = (of: AiModel) =>
    of.badge ? (
      <Chip size="sm" variant="soft" tone={of.badge === "new" ? "accent" : "warning"}>
        {t(K[of.badge])}
      </Chip>
    ) : null;

  return (
    <HeroSelect
      className={cn(isFullWidth ? undefined : "self-start", className) ?? ""}
      presentation="bottom-sheet"
      isDisabled={isDisabled}
      {...(model ? { value: { value: model.id, label: model.name } } : {})}
      onValueChange={(option) => {
        if (!option) return;
        setHeld(option.value);
        onChange?.(option.value);
      }}
    >
      {isLabelVisible ? <Label>{name}</Label> : null}
      <HeroSelect.Trigger accessibilityLabel={`${name}: ${model?.name ?? t(K.placeholder)}`}>
        <View className="min-w-0 flex-1 flex-row items-center gap-2">
          {model ? <ModelIcon icon={model.icon} /> : null}
          <Text numberOfLines={1} tone={model ? "default" : "muted"} className="shrink">
            {model?.name ?? t(K.placeholder)}
          </Text>
          {model ? badge(model) : null}
        </View>
        <HeroSelect.TriggerIndicator />
      </HeroSelect.Trigger>
      <HeroSelect.Portal>
        <HeroSelect.Overlay />
        <HeroSelect.Content
          presentation="bottom-sheet"
          detached
          bottomInset={insets.bottom + 12}
          className="mx-4"
          backgroundClassName="rounded-[var(--radius-container)]"
        >
          {modelsByProvider(models).map((group) => (
            <View key={group.provider}>
              <HeroSelect.ListLabel>{group.provider}</HeroSelect.ListLabel>
              {group.models.map((item) => (
                <HeroSelect.Item
                  key={item.id}
                  value={item.id}
                  label={item.name}
                  disabled={item.isDisabled ?? false}
                  className="items-start"
                >
                  <ModelIcon icon={item.icon} />
                  <View className="min-w-0 flex-1 gap-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="font-medium">{item.name}</Text>
                      {badge(item)}
                    </View>
                    {item.isDisabled || item.description ? (
                      <Text type="small" tone="muted">
                        {item.isDisabled
                          ? (item.disabledReason ?? t(K.unavailable))
                          : item.description}
                      </Text>
                    ) : null}
                    {item.capabilities?.length || item.contextWindow ? (
                      <View className="flex-row flex-wrap items-center gap-1">
                        {item.capabilities?.map((capability) => (
                          <Chip key={capability} size="sm" variant="secondary">
                            {capability}
                          </Chip>
                        ))}
                        {item.contextWindow ? (
                          <Text type="small" tone="muted">
                            {t(K.context, { size: compact.format(item.contextWindow) })}
                          </Text>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                  <HeroSelect.ItemIndicator />
                </HeroSelect.Item>
              ))}
            </View>
          ))}
        </HeroSelect.Content>
      </HeroSelect.Portal>
    </HeroSelect>
  );
}
