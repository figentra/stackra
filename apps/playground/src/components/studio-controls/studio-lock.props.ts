/**
 * Stackra file contract:
 * Purpose: props of `StudioLock`, the lock beside one Theme Studio value.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0501 (section 5: the Theme Studio); ADR 0305 (rule 10).
 */

/** Props of {@link StudioLock}. */
export interface StudioLockProps {
  /** The value's visible label, which names the lock for assistive technology. */
  label: string;
  /** Whether the value is locked against Randomize. */
  isLocked: boolean;
  /** Called with the new lock state. */
  onChange: (isLocked: boolean) => void;
}
