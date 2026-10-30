/**
 * Stackra file contract:
 * Purpose: the native `Cascader`: a labelled field that picks a path through a hierarchy (country, region, city). Its
 *          trigger, in HeroUI Native's field colours and radius, shows the chosen path ("Saudi Arabia / Riyadh / Al
 *          Olaya") and opens a sheet that drills down one level at a time: a row with rows under it opens them, with a
 *          back button and the row's name as the sheet's title; a leaf sets the path and closes. Rows marked
 *          `hasChildren` load through `onLoadChildren` the first time they are opened.
 * Boundary: the sheet is the house Drawer; the rows are 44-point pressables with a selection haptic, read as buttons
 *           with the chosen row marked selected. The path's names lay out from the start edge in a row with a neutral
 *           slash between them, so right-to-left reads them the right way without reversing any text; the chevrons
 *           mirror through the house Icon. A native field has no form to submit under `name`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0055 (one field contract); ADR 0060 (right-to-left); STA-1371 (wave
 *          D, owner approval 2026-10-30).
 */
import { Description, FieldError, Label, TextField as HeroTextField } from "heroui-native";
import { Fragment, useState, type ReactElement } from "react";
import { Pressable, View } from "react-native";

import type { TreeViewNode } from "#contracts/types/tree-view-node.type";
import { FIELD_RADIUS_CLASS_NAME } from "#core/constants/field-radius-class-name.constant";
import { OVERLAY_SELECTION_KEYS } from "#core/constants/overlay-selection-keys.constant";
import { cascadeColumnsOf } from "#core/functions/cascade-columns-of.function";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { CascaderProps } from "#native/cascader/cascader.props";
import { Drawer } from "#native/drawer/drawer";
import { haptics } from "#native/haptics/haptics";
import { Icon } from "#native/icon/icon";
import { IconButton } from "#native/icon-button/icon-button";
import { Text } from "#native/text/text";
import { useUiText } from "#react/hooks/use-ui-text";

/** The cascader's words. */
const K = OVERLAY_SELECTION_KEYS.ui.cascader;

/** Nothing chosen yet. */
const NONE: readonly string[] = [];

/** True when a row opens a further level. */
const hasRows = (node: TreeViewNode) =>
  (node.children?.length ?? 0) > 0 || node.hasChildren === true;

/** A field that picks a path through a hierarchy in a drill-down sheet. */
export function Cascader({
  items,
  label,
  description,
  errorMessage,
  isInvalid,
  isDisabled,
  isRequired,
  isReadOnly,
  placeholder,
  onLoadChildren,
  value,
  defaultValue,
  onChange,
  name: _name,
  className,
  accessibilityLabel,
}: CascaderProps): ReactElement {
  const t = useUiText();
  const [own, setOwn] = useState(defaultValue ?? NONE);
  const chosen = value ?? own;
  const [isOpen, setOpen] = useState(false);
  // The rows opened so far in the sheet; the last one's rows are listed.
  const [opened, setOpened] = useState(NONE);
  const [loaded, setLoaded] = useState<ReadonlyMap<string, readonly TreeViewNode[]>>(new Map());
  const [loading, setLoading] = useState<string | null>(null);
  const isLocked = Boolean(isDisabled || isReadOnly);
  const fieldName = accessibilityLabel ?? (typeof label === "string" ? label : "");
  const shown = cascadeColumnsOf(items, chosen, loaded).nodes;
  const { columns, nodes } = cascadeColumnsOf(items, opened, loaded);
  const rows = columns.at(-1) ?? [];
  const parent = nodes.length === opened.length ? nodes.at(-1) : undefined;
  const isOnPath = opened.every((id, index) => chosen[index] === id);

  const choose = (node: TreeViewNode) => {
    haptics.play("selection");
    const path = [...opened, node.id];
    if (!hasRows(node)) {
      if (value === undefined) setOwn(path);
      onChange?.(path);
      setOpen(false);
      return;
    }
    setOpened(path);
    if (node.children === undefined && !loaded.has(node.id) && onLoadChildren) {
      setLoading(node.id);
      onLoadChildren(node.id).then(
        (loadedRows) => {
          setLoaded((current) => new Map(current).set(node.id, loadedRows));
          setLoading(null);
        },
        () => setLoading(null),
      );
    }
  };

  return (
    <HeroTextField {...omitUndefined({ isRequired, isInvalid, isDisabled, className })}>
      {label == null ? null : <Label>{label}</Label>}
      <Pressable
        disabled={Boolean(isDisabled)}
        onPress={() => {
          if (isLocked) return;
          setOpened(chosen.slice(0, -1));
          setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={fieldName}
        accessibilityValue={{ text: shown.map((node) => node.label).join(", ") }}
        accessibilityState={{ disabled: Boolean(isDisabled), expanded: isOpen }}
        className={`min-h-12 flex-row items-center gap-2 border bg-field px-3 py-2 ${isInvalid ? "border-danger" : "border-field-border"} ${FIELD_RADIUS_CLASS_NAME} ${isDisabled ? "opacity-50" : ""}`}
      >
        <View className="flex-1 flex-row flex-wrap items-center">
          {shown.length === 0 ? (
            <Text tone="muted">{placeholder ?? t(K.placeholder)}</Text>
          ) : (
            shown.map((node, index) => (
              <Fragment key={node.id}>
                {index > 0 ? (
                  <Text tone="muted" className="mx-1">
                    /
                  </Text>
                ) : null}
                <Text>{node.label}</Text>
              </Fragment>
            ))
          )}
        </View>
        <View>
          <Icon name="chevron-down" tone="muted" />
        </View>
      </Pressable>
      {description == null ? null : <Description hideOnInvalid>{description}</Description>}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
      <Drawer isOpen={isOpen && !isLocked} onOpenChange={setOpen} label={fieldName}>
        <Drawer.Header>
          <View className="flex-row items-center gap-2">
            {opened.length > 0 ? (
              <IconButton
                icon="chevron-left"
                label={t(K.back)}
                variant="ghost"
                size="sm"
                onPress={() => setOpened(opened.slice(0, -1))}
              />
            ) : null}
            <Drawer.Title>{parent?.label ?? label ?? fieldName}</Drawer.Title>
          </View>
        </Drawer.Header>
        <Drawer.Body>
          {loading !== null ? (
            <Text tone="muted" accessibilityLiveRegion="polite">
              {t(K.loading)}
            </Text>
          ) : rows.length === 0 ? (
            <Text tone="muted">{t(K.empty)}</Text>
          ) : (
            <View>
              {rows.map((row) => {
                const isOn = isOnPath && chosen[opened.length] === row.id;
                return (
                  <Pressable
                    key={row.id}
                    disabled={Boolean(row.isDisabled)}
                    onPress={() => choose(row)}
                    accessibilityRole="button"
                    accessibilityLabel={row.label}
                    accessibilityState={{ selected: isOn, disabled: Boolean(row.isDisabled) }}
                    style={{ borderRadius: "var(--radius-control)" }}
                    className={`min-h-11 flex-row items-center gap-3 px-3 py-2 ${isOn ? "bg-accent-soft" : ""} ${row.isDisabled ? "opacity-50" : ""}`}
                  >
                    <Text className={`flex-1 ${isOn ? "text-accent-soft-foreground" : ""}`}>
                      {row.label}
                    </Text>
                    {hasRows(row) ? <Icon name="chevron-right" tone="muted" /> : null}
                    {isOn && !hasRows(row) ? <Icon name="check" tone="accent" /> : null}
                  </Pressable>
                );
              })}
            </View>
          )}
        </Drawer.Body>
        <Drawer.Close label={t(OVERLAY_SELECTION_KEYS.ui.floating_panel.close)} />
      </Drawer>
    </HeroTextField>
  );
}
