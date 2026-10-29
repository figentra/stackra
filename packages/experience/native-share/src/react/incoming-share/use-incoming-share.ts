/**
 * Stackra file contract:
 * Purpose: `useIncomingShare()`, the items other apps shared into this one, re-read when a new share may have
 *          arrived, with the port (to read a file) and `clear` (to forget them once handled).
 * Boundary: reads the `IncomingShare` binding of the container; on a target with the memory driver and no share it
 *           returns an empty list, so the page shows nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decision 5); ADR 0294 (decision 15).
 */
import { useContainer } from "@stackra/container/react";
import { useCallback, useEffect, useState } from "react";

import { IncomingShare } from "#contracts/ports/incoming-share.port";
import type { SharedItem } from "#contracts/types/shared-item.type";
import type { IncomingShareState } from "#react/incoming-share/incoming-share-state.type";

/**
 * The shared items waiting for the app.
 *
 * @example
 * const { items, share, clear } = useIncomingShare();
 * if (items.length > 0) return <ShareSheet items={items} onDone={clear} />;
 */
export function useIncomingShare(): IncomingShareState {
  const share = useContainer().get(IncomingShare);
  const [items, setItems] = useState<readonly SharedItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    const load = () =>
      void share.pending().then(
        (next) => isMounted && setItems(next),
        () => undefined, // an unreadable inbox keeps the list it had
      );
    load();
    const unsubscribe = share.subscribe(load);
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [share]);

  const clear = useCallback(async () => {
    await share.clear();
    setItems([]);
  }, [share]);

  return { items, share, clear };
}
