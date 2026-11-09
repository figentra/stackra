/**
 * Stackra file contract:
 * Purpose: `ScopePicker`, the scope kit's field for switching the active scope: a TreeSelect of the host's scopes,
 *          nested by path, or, above `searchThreshold` scopes (8 by default), an EntityPicker that searches them by
 *          name. Choosing a scope makes it the active one.
 * Boundary: composition of @stackra/ui's TreeSelect and EntityPicker over `useScope` and the container's
 *           `ActiveScopeService`, so it needs a `ContainerProvider` that binds the service. A scope nests under the
 *           nearest listed scope above it; one whose parent is not listed is a root. Switching only sets the active
 *           scope: the server drops a choice outside the caller's grants, so the list widens no access.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0327 (decisions 7 and 10); ADR 0165 (UI through @stackra/ui); the
 *                     UI build list (2026-11-02).
 */
import { useContainer } from "@stackra/container/react";
import type { EntityOption, EntityOptionPage, TreeViewNode } from "@stackra/ui/contracts";
import { EntityPicker, TreeSelect } from "@stackra/ui/react";
import type { ReactElement } from "react";

import type { ScopeEntry } from "#contracts/types/scope-entry.type";
import { ActiveScopeService } from "#core/index";
import { useScope } from "#react/scope/use-scope";
import type { ScopePickerProps } from "#react/scope-picker/scope-picker.props";

/** The path of the nearest listed scope above `entry`, or `null` for a root. */
function parentPathOf(entry: ScopeEntry, byPath: ReadonlyMap<string, ScopeEntry>): string | null {
  for (let at = entry.path.lastIndexOf("."); at > 0; at = entry.path.lastIndexOf(".", at - 1)) {
    const prefix = entry.path.slice(0, at);
    if (byPath.has(prefix)) return prefix;
  }
  return null;
}

/** The scopes as tree rows, each under the nearest listed scope above it. */
function treeOf(
  scopes: readonly ScopeEntry[],
  byPath: ReadonlyMap<string, ScopeEntry>,
): readonly TreeViewNode[] {
  const childrenOf = new Map<string | null, ScopeEntry[]>();
  for (const entry of scopes) {
    const parent = parentPathOf(entry, byPath);
    childrenOf.set(parent, [...(childrenOf.get(parent) ?? []), entry]);
  }
  const rowsUnder = (path: string | null): readonly TreeViewNode[] =>
    (childrenOf.get(path) ?? []).map((entry) => {
      const children = rowsUnder(entry.path);
      return { id: entry.id, label: entry.name, ...(children.length > 0 ? { children } : {}) };
    });
  return rowsUnder(null);
}

/**
 * The scope switcher.
 *
 * @throws Error outside a `ContainerProvider`, or when the container does not bind `ActiveScopeService`.
 * @example
 * <ScopePicker scopes={granted} labels={{ label: "Scope", placeholder: "Choose a scope" }} />
 */
export function ScopePicker({
  scopes,
  searchThreshold = 8,
  labels,
  className,
}: ScopePickerProps): ReactElement {
  const active = useContainer().get(ActiveScopeService);
  const scope = useScope();
  const byId = new Map<string, ScopeEntry>(scopes.map((entry) => [entry.id, entry]));
  const byPath = new Map<string, ScopeEntry>(scopes.map((entry) => [entry.path, entry]));
  const current = scope === null ? undefined : byId.get(scope.id);

  const choose = (id: string | undefined) => {
    const entry = id === undefined ? undefined : byId.get(id);
    if (entry !== undefined) active.set({ id: entry.id, path: entry.path });
  };
  const optionOf = (entry: ScopeEntry): EntityOption => {
    const parent = parentPathOf(entry, byPath);
    const description = parent === null ? undefined : byPath.get(parent)?.name;
    return {
      id: entry.id,
      label: entry.name,
      ...(description === undefined ? {} : { description }),
    };
  };
  const words = {
    label: labels.label,
    ...(labels.placeholder === undefined ? {} : { placeholder: labels.placeholder }),
    ...(className === undefined ? {} : { className }),
  };

  if (scopes.length > searchThreshold) {
    const search = (text: string): Promise<EntityOptionPage> => {
      const needle = text.trim().toLocaleLowerCase();
      return Promise.resolve({
        items: scopes
          .filter((entry) => entry.name.toLocaleLowerCase().includes(needle))
          .map(optionOf),
        nextCursor: null,
      });
    };
    return (
      <EntityPicker
        {...words}
        selectionMode="single"
        loadOptions={search}
        value={current === undefined ? null : optionOf(current)}
        onChange={(option: EntityOption | null) => choose(option?.id)}
        {...(labels.emptyMessage === undefined ? {} : { emptyMessage: labels.emptyMessage })}
      />
    );
  }
  return (
    <TreeSelect
      {...words}
      items={treeOf(scopes, byPath)}
      value={current === undefined ? [] : [current.id]}
      defaultExpandedKeys={scopes.map((entry) => entry.id)}
      onChange={(keys) => choose(keys[0])}
    />
  );
}
