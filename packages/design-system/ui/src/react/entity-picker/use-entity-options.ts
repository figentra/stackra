/**
 * Stackra file contract:
 * Purpose: the web EntityPicker's hold on its records: one `createEntityOptionsLoader` store per picker, read with
 *          `useSyncExternalStore`, so the picker redraws on each answer and drops the stale ones the store drops.
 * Boundary: internal to `EntityPicker`, not in the `./react` barrel. The latest `loadOptions` and pause are read
 *           through refs, so a picker given a new function on each render keeps one store and one pending request.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0318 (wave 7 vocabulary).
 */
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import type { EntityOptionPage } from "#contracts/types/entity-option-page.type";
import {
  createEntityOptionsLoader,
  type EntityOptionsLoader,
  type EntityOptionsState,
} from "#core/functions/create-entity-options-loader.function";

/** What {@link useEntityOptions} returns: the state to draw and the two requests a picker makes. */
export interface EntityOptions extends EntityOptionsState {
  /** Asks for the first page of `text`, at once the first time and after the pause later. */
  readonly search: (text: string) => void;
  /** Asks for the page after the last one. */
  readonly loadMore: () => void;
}

/**
 * Holds the records an EntityPicker lists.
 * @param loadOptions - the picker's `loadOptions`, read afresh at each request
 * @param debounceMs - the pause between the last keystroke and the search
 * @returns the records, the request state and the two requests
 */
export function useEntityOptions(
  loadOptions: (search: string, cursor?: string) => Promise<EntityOptionPage>,
  debounceMs: number,
): EntityOptions {
  const load = useRef(loadOptions);
  const pause = useRef(debounceMs);
  useEffect(() => {
    load.current = loadOptions;
    pause.current = debounceMs;
  });
  // oxlint-disable-next-line react/refs -- the getters read the refs at each request, never during render
  const [loader] = useState<EntityOptionsLoader>(() =>
    createEntityOptionsLoader({ getLoad: () => load.current, getDebounceMs: () => pause.current }),
  );
  useEffect(() => () => loader.dispose(), [loader]);
  const state = useSyncExternalStore(loader.subscribe, loader.getState, loader.getState);
  return { ...state, search: loader.search, loadMore: loader.loadMore };
}
