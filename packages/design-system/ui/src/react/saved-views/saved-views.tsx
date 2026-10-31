/**
 * Stackra file contract:
 * Purpose: the web `SavedViews`, the one saved-views component of the data family, over a `useCollection` engine's
 *          views. `menu` (the default, as DataView's toolbar shows it): a select of the views ("All records" first, the
 *          default and shared ones marked) and a menu to save changes to the view, save as a new view, rename, share,
 *          make default (or stop) and delete; saving as and renaming ask for the name in place, in a small form that
 *          takes focus. `tabs`: a tab per view. `chips`: a single-choice tag row. Tabs and chips apply a view.
 * Boundary: every change goes to the engine, which persists the views with its state through its `CollectionStore`.
 *           Sharing is the app's (`onShareView`); without it there is no Share. "All records" clears the search,
 *           filter, sort and group and keeps the columns. It replaced `SavedViewsMenu`, the `ResourceQuery`
 *           `SavedViews` and FilterPanel's view tabs on 2026-10-31.
 * Runtime: browser
 * Governing contract: data-collection plan (owner, 2026-10-29); product audit 2026-10-28 (saved views); ADR 0302
 *          (decision 3); ADR 0505 (one saved-view model); WCAG 2.2 SC 1.3.1, 2.4.3, 3.3.2.
 */
import { cn } from "@heroui/react";
import { IconRegistryProvider } from "@stackra/icons/react";
import { useState, type FormEvent, type ReactElement } from "react";

import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { MenuItem } from "#contracts/types/menu-item.type";
import { COLLECTION_KEYS } from "#core/constants/collection-keys.constant";
import { ActionMenu } from "#react/action-menu/action-menu";
import { Button } from "#react/button/button";
import { COLLECTION_ICONS } from "#react/data-table/collection-icons.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { SAVED_VIEWS_ICONS as I } from "#react/saved-views/saved-views-icons.constant";
import type { SavedViewsProps } from "#react/saved-views/saved-views.props";
import { Select } from "#react/select/select";
import { Tabs } from "#react/tabs/tabs";
import { TagGroup } from "#react/tag-group/tag-group";
import { TextField } from "#react/text-field/text-field";

/** The words. */
const K = COLLECTION_KEYS.ui.collection;

/** Entries given only when they apply. */
const when = (condition: boolean, ...entries: MenuItem[]): MenuItem[] => (condition ? entries : []);

/** The select's key of "All records". */
const ALL = "__all";

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
  const submit = (event: FormEvent) => {
    event.preventDefault();
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

  const choices = [
    { id: ALL, label: t(K.all_records) },
    ...views.map((view) => ({ id: view.id, label: labelOf(view.id, view.label, view.isShared) })),
  ];
  const chosen = state.viewId ?? ALL;

  if (variant === "tabs")
    return (
      <div {...rest} className={className}>
        <Tabs
          label={name}
          items={choices.map((choice) => ({ ...choice, content: null }))}
          selectedKeys={[chosen]}
          onSelectionChange={([id]) => pick(id ?? null)}
        />
      </div>
    );
  if (variant === "chips")
    return (
      <div {...rest} className={className}>
        <TagGroup
          label={name}
          selectionMode="single"
          items={choices}
          value={[chosen]}
          onChange={([id]) => pick(id ?? null)}
        />
      </div>
    );

  const items: MenuItem[] = [
    ...when(active !== undefined, {
      id: "save",
      label: t(K.save_view),
      icon: I.save,
      onPress: () => active && collection.saveView(active.id),
    }),
    {
      id: "save-as",
      label: t(K.save_view_as),
      icon: I.saveAs,
      onPress: () => startNaming("save-as"),
    },
    ...when(active !== undefined, {
      id: "rename",
      label: t(K.rename_view),
      icon: I.rename,
      onPress: () => startNaming("rename"),
    }),
    ...when(active !== undefined && onShareView !== undefined, {
      id: "share",
      label: t(K.share_view),
      icon: I.share,
      onPress: () => active && onShareView?.(active),
    }),
    ...when(active !== undefined && active.id !== defaultViewId, {
      id: "default",
      label: t(K.set_default),
      icon: I.makeDefault,
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
      icon: I.remove,
      tone: "danger",
      onPress: () => active && collection.deleteView(active.id),
    }),
  ];

  return (
    <IconRegistryProvider registry={COLLECTION_ICONS}>
      {naming ? (
        <form className="flex items-end gap-2" onSubmit={submit} aria-label={t(K.view_name)}>
          <TextField
            aria-label={t(K.view_name)}
            placeholder={t(K.view_name)}
            value={draft}
            onChange={setDraft}
            // The form appears under the user's press, so focus moves into it (WCAG 2.4.3).
            // oxlint-disable-next-line jsx-a11y/no-autofocus -- reason: the field replaces the menu that opened it
            autoFocus
            isFullWidth={false}
          />
          <Button type="submit" size="sm" isDisabled={draft.trim() === ""}>
            {t(K.save)}
          </Button>
          <Button size="sm" variant="ghost" onPress={() => setNaming(null)}>
            {t(K.cancel)}
          </Button>
        </form>
      ) : (
        <div {...rest} className={cn("flex items-center gap-1", className)} data-slot="saved-views">
          <Select aria-label={name} items={choices} value={chosen} onChange={pick} />
          <ActionMenu
            label={t(K.view_menu)}
            icon={I.saveAs}
            variant="ghost"
            size="sm"
            sections={[{ id: "views", title: name, isTitleHidden: true, items }]}
          />
        </div>
      )}
    </IconRegistryProvider>
  );
}
