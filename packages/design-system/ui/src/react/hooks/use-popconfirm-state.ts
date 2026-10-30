/**
 * Stackra file contract:
 * Purpose: `usePopconfirmState(props)`, the state every runtime's Popconfirm shares: open or closed (controlled or its
 *          own), pending while a confirm's promise runs, and the two answers. Cancel calls `onCancel` and closes.
 *          Confirm calls `onConfirm`: a plain result closes at once; a promise keeps it open and pending until it
 *          settles, then closes when it resolves and stays open when it rejects, so the person can try again.
 * Boundary: a React hook with no rendering; the runtimes draw the popover and its buttons. The web and native
 *           Popconfirm both use it.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import { useState } from "react";

import type { PopconfirmContractProps } from "#contracts/types/popconfirm-contract-props.type";

/**
 * The shared Popconfirm state.
 * @param props - the open state and its handler, and the confirm and cancel handlers
 * @returns whether it is open or pending, and the functions that open, cancel and confirm
 */
export function usePopconfirmState({
  isOpen,
  defaultOpen,
  onOpenChange,
  onConfirm,
  onCancel,
}: Pick<
  PopconfirmContractProps,
  "isOpen" | "defaultOpen" | "onOpenChange" | "onConfirm" | "onCancel"
>): {
  readonly open: boolean;
  readonly isPending: boolean;
  readonly setOpen: (next: boolean) => void;
  readonly cancel: () => void;
  readonly confirm: () => void;
} {
  const [own, setOwn] = useState(defaultOpen ?? false);
  const [isPending, setPending] = useState(false);
  const setOpen = (next: boolean) => {
    if (isOpen === undefined) setOwn(next);
    onOpenChange?.(next);
  };
  return {
    open: isOpen ?? own,
    isPending,
    setOpen,
    cancel: () => {
      onCancel?.();
      setOpen(false);
    },
    confirm: () => {
      const result = onConfirm?.();
      if (!(result instanceof Promise)) {
        setOpen(false);
        return;
      }
      setPending(true);
      result.then(
        () => {
          setPending(false);
          setOpen(false);
        },
        // A refused confirm stays open, so the person can try again or cancel.
        () => setPending(false),
      );
    },
  };
}
