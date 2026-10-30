/**
 * Stackra file contract:
 * Purpose: the web `ModelPicker` on HeroUI v3's Select: the trigger shows the picked model's icon, name and badge; the
 *          list groups the models by provider, each row with its name, a New or Beta chip, a short description, its
 *          capability tags and context size, and a disabled model's reason in place of its description.
 * Boundary: HeroUI's Select, ListBox sections and Chip; no styling beyond the rows' layout. The picker holds the value
 *           itself when uncontrolled, so the trigger can draw the whole model. A disabled row is skipped by the arrow
 *           keys (React Aria), so its reason is read only by pointer and sight; the provider headers name the groups.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI v3 on web); WCAG 2.2 SC 1.3.1, 4.1.2; STA-1371 (wave D,
 *          owner approval 2026-10-30).
 */
import { Header, Label, ListBox, Select as HeroSelect } from "@heroui/react";
import { useState, type ReactElement } from "react";
import { Text as AriaText, useLocale } from "react-aria-components";

import type { AiModel } from "#contracts/types/ai-model.type";
import { AI_ASSIST_KEYS } from "#core/constants/ai-assist-keys.constant";
import { modelsByProvider } from "#core/functions/models-by-provider.function";
import { Chip } from "#react/chip/chip";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";
import type { ModelPickerProps } from "#react/model-picker/model-picker.props";

const K = AI_ASSIST_KEYS.ui.model_picker;

/** A model's icon: a name through the house Icon, an element as given. */
function ModelIcon({ icon }: { readonly icon: AiModel["icon"] }) {
  if (icon === undefined) return null;
  return (
    <span aria-hidden className="flex size-5 shrink-0 items-center justify-center">
      {typeof icon === "string" ? <Icon name={icon} size="sm" /> : icon}
    </span>
  );
}

/** Picks an AI model from a list grouped by provider. */
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
  const { locale } = useLocale();
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
      {...(className === undefined ? {} : { className })}
      value={picked}
      isDisabled={isDisabled}
      fullWidth={isFullWidth}
      placeholder={t(K.placeholder)}
      {...(isLabelVisible ? {} : { "aria-label": name })}
      onChange={(key) => {
        if (key === null) return;
        setHeld(String(key));
        onChange?.(String(key));
      }}
    >
      {isLabelVisible ? <Label>{name}</Label> : null}
      <HeroSelect.Trigger>
        <HeroSelect.Value>
          {({ defaultChildren }) =>
            model ? (
              <span className="flex min-w-0 items-center gap-2">
                <ModelIcon icon={model.icon} />
                <span className="truncate">{model.name}</span>
                {badge(model)}
              </span>
            ) : (
              defaultChildren
            )
          }
        </HeroSelect.Value>
        <HeroSelect.Indicator />
      </HeroSelect.Trigger>
      <HeroSelect.Popover className="min-w-80">
        <ListBox>
          {modelsByProvider(models).map((group) => (
            <ListBox.Section key={group.provider} id={group.provider}>
              <Header className="px-2 pt-2 pb-1 text-xs font-medium text-muted">
                {group.provider}
              </Header>
              {group.models.map((item) => (
                <ListBox.Item
                  key={item.id}
                  id={item.id}
                  textValue={item.name}
                  isDisabled={item.isDisabled ?? false}
                  className="items-start"
                >
                  <ModelIcon icon={item.icon} />
                  <div className="grid min-w-0 flex-1 gap-1">
                    <span className="flex items-center gap-2">
                      <AriaText slot="label" className="font-medium">
                        {item.name}
                      </AriaText>
                      {badge(item)}
                    </span>
                    {item.isDisabled ? (
                      <AriaText slot="description" className="text-xs text-muted">
                        {item.disabledReason ?? t(K.unavailable)}
                      </AriaText>
                    ) : item.description ? (
                      <AriaText slot="description" className="text-xs text-muted">
                        {item.description}
                      </AriaText>
                    ) : null}
                    {item.capabilities?.length || item.contextWindow ? (
                      <span className="flex flex-wrap items-center gap-1">
                        {item.capabilities?.map((capability) => (
                          <Chip key={capability} size="sm" variant="secondary">
                            {capability}
                          </Chip>
                        ))}
                        {item.contextWindow ? (
                          <span className="text-xs text-muted">
                            {t(K.context, { size: compact.format(item.contextWindow) })}
                          </span>
                        ) : null}
                      </span>
                    ) : null}
                  </div>
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox.Section>
          ))}
        </ListBox>
      </HeroSelect.Popover>
    </HeroSelect>
  );
}
