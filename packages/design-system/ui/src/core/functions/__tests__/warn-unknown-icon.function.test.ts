/**
 * Stackra file contract:
 * Purpose: proves `warnUnknownIcon` names the icon in a warning, says when it is labelled, and warns once per name.
 * Boundary: pure function with a spied console.
 * Runtime: node
 * Governing contract: ADR 0303 (decision 10); ADR 0022 (test placement).
 */
// @covers sta-350:FR-052
import { warnUnknownIcon } from "#core/functions/warn-unknown-icon.function";

describe("warnUnknownIcon", () => {
  it("names the icon, once per name, and mentions a label", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    warnUnknownIcon("loyalty::once");
    warnUnknownIcon("loyalty::once");
    warnUnknownIcon("loyalty::labelled", "Points");
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[0]?.[0]).toContain('"loyalty::once"');
    expect(warn.mock.calls[1]?.[0]).toContain('labelled "Points"');
    warn.mockRestore();
  });
});
