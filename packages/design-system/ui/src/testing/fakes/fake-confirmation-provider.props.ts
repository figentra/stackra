/**
 * Stackra file contract:
 * Purpose: `FakeConfirmationProviderProps`, the props of the test stand-in `FakeConfirmationProvider` in
 *          `fake-confirmation-provider.tsx`.
 * Boundary: types only; the component and the `./testing` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0294 (decision 15: the `./testing`
 *          entry); ADR 0312; ADR 0269 (test helpers).
 */
import type { ReactNode } from "react";
import type { ConfirmationOptions } from "#contracts/types/confirmation-options.type";

/** Props of the FakeConfirmationProvider. */
export interface FakeConfirmationProviderProps {
  /** What every question is answered: true confirms, false refuses. */
  readonly answer: boolean;
  /** Called with each question asked, for the test to inspect. */
  readonly onAsk?: ((options: ConfirmationOptions) => void) | undefined;
  /** The code under test. */
  readonly children?: ReactNode;
}
