/**
 * Stackra file contract:
 * Purpose: `SettingBelowFloorError`, the refusal of a write that crosses a legal floor of the target's market pack
 *          (`setting_below_floor`): a refund window under the withdrawal period the law sets, for example.
 * Boundary: raised by `SettingsResolver` before anything is stored; kind `Validation` (HTTP 400), not retryable. Its
 *           details name each refused path with the law and market that set its floor, so the form can say "required
 *           by law in <market>"; each path's field error is `setting_below_floor`.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decision 6); ADR 0363 (decision 4); ADR 0140 (envelope and kinds); config-model
 *                     section 3.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable: the same value crosses the same floor.
 *
 * @example
 * throw SettingBelowFloorError.create({ floors }, { fieldErrors: { refundWindowDays: "setting_below_floor" } });
 */
export class SettingBelowFloorError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** Each refused path, relative to the group, with the law and market of its floor. */
  floors!: { path: string; law: string; market: string }[];
}
