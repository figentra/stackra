/**
 * Stackra file contract:
 * Purpose: the function `useConfirmation()` returns: ask a question, then wait for the user's answer as a boolean, so
 *          a handler reads `if (await confirm({ ... }))` and carries on.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0312.
 */
import type { ConfirmationOptions } from "#contracts/types/confirmation-options.type";

/**
 * Asks the question in `options` and resolves true when the user confirms. It resolves false when they refuse or
 * dismiss the dialog, when another question replaces this one, and when the provider goes away, so a caller never
 * waits for ever and never proceeds without a yes.
 */
export type ConfirmFunction = (options: ConfirmationOptions) => Promise<boolean>;
