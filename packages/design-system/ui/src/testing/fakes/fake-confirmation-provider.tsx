/**
 * Stackra file contract:
 * Purpose: `FakeConfirmationProvider`, the test stand-in for the web `ConfirmationProvider`: every `confirm` call of
 *          `useConfirmation()` below it resolves with the given answer at once, and each question is reported, so a
 *          consumer's test drives a confirmed or refused action without a dialog.
 * Boundary: the `./testing` entry only; production code never imports it. It fills the same context the real provider
 *           fills, so the code under test runs unchanged.
 * Runtime: browser (tests)
 * Governing contract: ADR 0294 (decision 15: the `./testing` entry); ADR 0312; ADR 0269 (test helpers).
 */
import { useCallback, type ReactElement, type ReactNode } from "react";

import type { ConfirmFunction } from "#contracts/types/confirm-function.type";
import type { ConfirmationOptions } from "#contracts/types/confirmation-options.type";
import { ConfirmationContext } from "#react/confirmation/confirmation-context";

/** Props of the FakeConfirmationProvider. */
export interface FakeConfirmationProviderProps {
  /** What every question is answered: true confirms, false refuses. */
  readonly answer: boolean;
  /** Called with each question asked, for the test to inspect. */
  readonly onAsk?: ((options: ConfirmationOptions) => void) | undefined;
  /** The code under test. */
  readonly children?: ReactNode;
}

/**
 * Answers every confirmation with `answer`.
 *
 * @example
 * render(<FakeConfirmationProvider answer onAsk={asked}><CancelButton /></FakeConfirmationProvider>);
 */
export function FakeConfirmationProvider({
  answer,
  onAsk,
  children,
}: FakeConfirmationProviderProps): ReactElement {
  const confirm = useCallback<ConfirmFunction>(
    (options) => {
      onAsk?.(options);
      return Promise.resolve(answer);
    },
    [answer, onAsk],
  );
  return <ConfirmationContext value={confirm}>{children}</ConfirmationContext>;
}
