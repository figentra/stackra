/**
 * Stackra file contract:
 * Purpose: `LiveRegion`: the attributes that make an element announce its content.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0312 (decision
 *          3); WCAG 2.2 SC 4.1.3 (status messages).
 */
/** The attributes that make an element announce its content. */
export interface LiveRegion {
  /** `alert` for a message that interrupts, `status` for one that waits. */
  readonly role: "alert" | "status";
  /** `assertive` for `alert`, `polite` for `status`; spelt out because not every screen reader infers it from the role. */
  readonly "aria-live": "assertive" | "polite";
}
