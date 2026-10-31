/**
 * Stackra file contract:
 * Purpose: the native `SavedViews`, the one saved-views component of the data family on a phone, over a
 *          `useCollection` engine's views. `menu` (the default): a select of the views ("All records" first, the
 *          default and shared ones marked) and an action menu to save changes to the view, save as a new view,
 *          rename, share, make default (or stop) and delete; saving as and renaming ask for the name in place. `tabs`:
 *          a tab per view. `chips`: a single-choice tag row. Tabs and chips apply a view.
 * Boundary: every change goes to the engine, which persists the views with its state through its `CollectionStore`.
 *           Sharing is the app's (`onShareView`). "All records" clears the search, filter, sort and group and keeps the
 *           columns. Strings are wrapped in `Text` by the components it builds on. It replaced the `ResourceQuery`
 *           `SavedViews` and FilterPanel's view tabs on 2026-10-31.
 * Runtime: react-native
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3: one API, adapted forms);
 *          ADR 0505 (one saved-view model); WCAG 2.2 SC 1.3.1, 4.1.2.
 */
import { useState, type ReactElement } from "react";
import { View } from "react-native";

import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { MenuItem } from "#contracts/types/menu-item.type";
import { COLLECTION_KEYS } from "#core/constants/collection-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { ActionMenu } from "#native/action-menu/action-menu";
import { Button } from "#native/button/button";
import type { SavedViewsProps } from "#native/saved-views/saved-views.props";
import { Select } from "#native/select/select";
import { Tabs } from "#native/tabs/tabs";
import { TagGroup } from "#native/tag-group/tag-group";
import { TextField } from "#native/text-field/text-field";

/** The words. */
const K = COLLECTION_KEYS.ui.collection;

/** The key of "All records". */
const ALL = "__all";

/** Entries given only when they apply. */
const when = (condition: boolean, ...entries: MenuItem[]): MenuItem[] => (condition ? entries : []);

/** A collection's saved views: a menu (pick, save, save as, rename, share, make default, delete), tabs or chips. */
export function SavedViews<TItem extends CollectionItem = CollectionItem>({
  collection,
  label,
  variant = "menu",
  onShareView,
  className,
  ...rest
}: SavedViewsProps<TItem>): ReactElement {
  const t = useUiText();
  const name = label ?? t(K.views);
  const { views, defaultViewId, state } = collection;
  const active = views.find((view) => view.id === state.viewId);
  const [naming, setNaming] = useState<"save-as" | "rename" | null>(null);
  const [draft, setDraft] = useState("");

  const labelOf = (id: string, text: string, isShared?: boolean) =>
    id === defaultViewId
      ? t(K.default_view, { label: text })
      : isShared
        ? t(K.shared_view, { label: text })
        : text;
  const pick = (id: string | null) => {
    if (id === null || id === ALL)
      collection.update({
        search: "",
        filter: { match: "all", conditions: [] },
        sort: [],
        groupBy: null,
        viewId: null,
        page: 0,
      });
    else collection.applyView(id);
  };
  const choices = [
    { id: ALL, label: t(K.all_records) },
    ...views.map((view) => ({ id: view.id, label: labelOf(view.id, view.label, view.isShared) })),
  ];
  const chosen = state.viewId ?? ALL;
  const rootClass = ["gap-2", className].filter(Boolean).join(" ");

  if (variant === "tabs")
    return (
      <View {...rest} className={rootClass}>
        <Tabs
          label={name}
          items={choices.map((choice) => ({ ...choice, content: null }))}
          selectedKeys={[chosen]}
          onSelectionChange={([id]) => pick(id ?? null)}
        />
      </View>
    );
  if (variant === "chips")
    return (
      <View {...rest} className={rootClass}>
        <TagGroup
          label={name}
          selectionMode="single"
          items={choices}
          value={[chosen]}
          onChange={([id]) => pick(id ?? null)}
        />
      </View>
    );

  const submit = () => {
    const text = draft.trim();
    if (text === "") return;
    if (naming === "rename" && active) collection.renameView(active.id, text);
    else collection.saveViewAs(text);
    setNaming(null);
  };
  const startNaming = (kind: "save-as" | "rename") => {
    setDraft(kind === "rename" ? (active?.label ?? "") : "");
    setNaming(kind);
  };
  const items: MenuItem[] = [
    ...when(active !== undefined, {
      id: "save",
      label: t(K.save_view),
      onPress: () => active && collection.saveView(active.id),
    }),
    { id: "save-as", label: t(K.save_view_as), onPress: () => startNaming("save-as") },
    ...when(active !== undefined, {
      id: "rename",
      label: t(K.rename_view),
      onPress: () => startNaming("rename"),
    }),
    ...when(active !== undefined && onShareView !== undefined, {
      id: "share",
      label: t(K.share_view),
      onPress: () => active && onShareView?.(active),
    }),
    ...when(active !== undefined && active.id !== defaultViewId, {
      id: "default",
      label: t(K.set_default),
      onPress: () => active && collection.setDefaultView(active.id),
    }),
    ...when(active !== undefined && active.id === defaultViewId, {
      id: "undefault",
      label: t(K.unset_default),
      onPress: () => collection.setDefaultView(null),
    }),
    ...when(active !== undefined, {
      id: "delete",
      label: t(K.delete_view),
      tone: "danger",
      onPress: () => active && collection.deleteView(active.id),
    }),
  ];

  return naming ? (
    <View {...rest} className={rootClass} accessibilityLabel={t(K.view_name)}>
      <TextField
        label={t(K.view_name)}
        value={draft}
        onChange={setDraft}
        // oxlint-disable-next-line jsx-a11y/no-autofocus -- reason: the field replaces the menu that opened it
        autoFocus
      />
      <View className="flex-row gap-2">
        <Button size="sm" isDisabled={draft.trim() === ""} onPress={submit}>
          {t(K.save)}
        </Button>
        <Button size="sm" variant="ghost" onPress={() => setNaming(null)}>
          {t(K.cancel)}
        </Button>
      </View>
    </View>
  ) : (
    <View {...rest} className={["flex-row items-end gap-1", className].filter(Boolean).join(" ")}>
      <View className="flex-1">
        <Select label={name} items={choices} value={chosen} onChange={pick} isFullWidth />
      </View>
      <ActionMenu
        label={t(K.view_menu)}
        variant="ghost"
        size="sm"
        sections={[{ id: "views", title: name, isTitleHidden: true, items }]}
      />
    </View>
  );
}
