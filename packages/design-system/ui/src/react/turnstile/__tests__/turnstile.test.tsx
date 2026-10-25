/**
 * Stackra file contract:
 * Purpose: proves the web `Turnstile` adds Cloudflare's script once, renders a widget with the site key that posts its
 *          token under `name`, removes the widget on unmount, and draws nothing without a site key.
 * Boundary: jsdom; Cloudflare's script never loads: the test fires its `load` event after defining a recording
 *           `window.turnstile`.
 * Runtime: browser
 * Governing contract: ADR 0165 (decision 2); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render, waitFor } from "@testing-library/react";

import { Turnstile } from "#react/turnstile/turnstile";

/** A recording stand-in for Cloudflare's API. */
const api = {
  render: vi.fn((_container: HTMLElement, _options: object) => "widget-1"),
  remove: vi.fn(),
};

/** The one script tag Turnstile added. */
const scripts = () =>
  [...document.head.querySelectorAll("script")].filter((script) =>
    script.src.startsWith("https://challenges.cloudflare.com/turnstile/"),
  );

describe("Turnstile (web)", () => {
  it("loads the script once, renders with the site key and removes the widget on unmount", async () => {
    const first = render(<Turnstile name="captchaToken" siteKey="0x4AAA" />);
    render(<Turnstile name="other" siteKey="0x4AAA" />);
    expect(scripts()).toHaveLength(1);

    (window as unknown as { turnstile: typeof api }).turnstile = api;
    scripts()[0]?.dispatchEvent(new Event("load"));

    await waitFor(() => expect(api.render).toHaveBeenCalledTimes(2));
    expect(api.render.mock.calls[0]?.[1]).toEqual({
      sitekey: "0x4AAA",
      "response-field-name": "captchaToken",
    });
    first.unmount();
    expect(api.remove).toHaveBeenCalledWith("widget-1");
  });

  it("draws nothing without a site key", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { container } = render(<Turnstile siteKey="" />);
    expect(container.firstElementChild?.childElementCount).toBe(0);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
