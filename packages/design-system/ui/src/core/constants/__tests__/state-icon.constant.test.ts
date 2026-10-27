/**
 * Stackra file contract:
 * Purpose: proves every empty-state reason and error kind has a default icon, and that the reasons and kinds share no
 *          name, so one table can hold both without a clash.
 * Boundary: data only; that each name is drawn is proved beside each runtime's registry.
 * Runtime: node
 * Governing contract: ADR 0303 (decision 10); ADR 0313 (decision 6); ADR 0022 (test placement).
 */
// @covers sta-350:FR-148
import { EmptyReason } from "#contracts/enums/empty-reason.enum";
import { ErrorStateKind } from "#contracts/enums/error-state-kind.enum";
import { STATE_ICON } from "#core/constants/state-icon.constant";

describe("STATE_ICON", () => {
  it("has an icon for every reason and every kind, and no other key", () => {
    expect(Object.keys(STATE_ICON).sort()).toEqual([...EmptyReason, ...ErrorStateKind].sort());
  });

  it("keeps reasons and kinds apart", () => {
    const kinds: readonly string[] = ErrorStateKind;
    expect(EmptyReason.filter((reason) => kinds.includes(reason))).toEqual([]);
  });
});
