/**
 * Stackra file contract:
 * Purpose: proves `followHref` sends an app path to the navigate function, sends an absolute URL, an external link and
 *          any path without a navigate function to `Linking`, and warns without the URL when the system refuses it.
 * Boundary: React Native does not run in vitest, so `react-native` is replaced by a recording `Linking`.
 * Runtime: node
 * Governing contract: ADR 0303 (decision 5); ADR 0022 (test placement).
 */
// @covers sta-350:FR-026
import { followHref } from "#native/router-provider/follow-href.function";

const native = vi.hoisted(() => ({ openURL: vi.fn((_url: string) => Promise.resolve()) }));

vi.mock("react-native", () => ({ Linking: { openURL: native.openURL } }));

describe("followHref", () => {
  beforeEach(() => {
    native.openURL.mockClear();
    native.openURL.mockImplementation(() => Promise.resolve());
  });

  it("sends an app path to navigate and not to the system", () => {
    const navigate = vi.fn();
    followHref("/orders", navigate, "failed");
    expect(navigate).toHaveBeenCalledWith("/orders");
    expect(native.openURL).not.toHaveBeenCalled();
  });

  it("sends an absolute URL to the system even when there is a navigate function", () => {
    const navigate = vi.fn();
    followHref("https://example.com", navigate, "failed");
    expect(navigate).not.toHaveBeenCalled();
    expect(native.openURL).toHaveBeenCalledWith("https://example.com");
  });

  it("sends a path to the system when the link is external or there is no navigate function", () => {
    const navigate = vi.fn();
    followHref("/docs", navigate, "failed", true);
    followHref("/docs", null, "failed");
    expect(navigate).not.toHaveBeenCalled();
    expect(native.openURL).toHaveBeenCalledTimes(2);
  });

  it("warns without the URL when the system refuses it", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    native.openURL.mockImplementation(() => Promise.reject(new Error("no handler")));
    followHref("https://example.com/?token=secret", null, "could not open");
    await Promise.resolve();
    await Promise.resolve();
    expect(warn).toHaveBeenCalledWith("could not open");
    warn.mockRestore();
  });
});
