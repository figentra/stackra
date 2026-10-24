/**
 * Stackra file contract:
 * Purpose: `useConfirmation()`, the hook a web component asks a yes-or-no question with: `const confirm =
 *          useConfirmation(); if (await confirm({ ... })) { ... }`.
 * Boundary: reads the context; throws outside a provider, because a silent default would let a destructive action
 *           run without ever asking.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0312; WCAG 2.2 SC 3.3.4.
 */
import { use } from "react";

import type { ConfirmFunction } from "#contracts/types/confirm-function.type";
import { ConfirmationContext } from "#react/confirmation/confirmation-context";

/**
 * The `confirm` function of the nearest `ConfirmationProvider`. It is the same function on every render.
 * @returns a function that asks a question and resolves true only when the user confirms
 */
export function useConfirmation(): ConfirmFunction {
  const confirm = use(ConfirmationContext);
  if (!confirm) throw new Error("useConfirmation() needs a ConfirmationProvider above it");
  return confirm;
}
