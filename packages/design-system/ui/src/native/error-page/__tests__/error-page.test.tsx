/**
 * Stackra file contract:
 * Purpose: proves the native ErrorPage hands ErrorState each preset's kind, catalogue words and icon, lets the
 *          caller's words win, and draws a retry that stays loading until its promise settles.
 * Boundary: React Native does not render in vitest, so ErrorState, Button, Icon and the icon registry are replaced by recording
 *           stand-ins that render plain DOM; `useUiText` echoes the key.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0313 (decision 6); GAPS.md row 31; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { ErrorPagePreset } from "#contracts/enums/error-page-preset.enum";
import { ErrorPage } from "#native/error-page/error-page";

const received = vi.hoisted(() => ({
  state: {} as Record<string, unknown>,
  buttons: [] as Record<string, unknown>[],
}));

vi.mock("#react/hooks/use-ui-text", () => ({ useUiText: () => (key: string) => key }));
vi.mock("@stackra/icons/native", async () => {
  const { createElement } = await import("react");
  return {
    IconRegistryProvider: (props: { children: ReactNode }) =>
      createElement("span", null, props.children),
  };
});
vi.mock("#native/error-page/error-page-icons.constant", () => ({ ERROR_PAGE_ICONS: {} }));
vi.mock("#native/icon/icon", async () => {
  const { createElement } = await import("react");
  return { Icon: (props: { name: string }) => createElement("i", { "data-icon": props.name }) };
});
vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: Record<string, unknown>) => {
      received.buttons.push(props);
      return createElement(
        "button",
        {
          type: "button",
          onClick: props["onPress"] as () => void,
          "data-loading": String(props["isLoading"]),
        },
        props["children"] as ReactNode,
      );
    },
  };
});
vi.mock("#native/error-state/error-state", async () => {
  const { createElement } = await import("react");
  return {
    ErrorState: (props: Record<string, unknown>) => {
      received.state = props;
      return createElement(
        "div",
        null,
        props["title"] as ReactNode,
        props["icon"] as ReactNode,
        props["actions"] as ReactNode,
      );
    },
  };
});

const KIND = {
  forbidden: "forbidden",
  "not-found": "not-found",
  "server-error": "unexpected",
  offline: "unexpected",
};

describe("ErrorPage (native)", () => {
  it.each(ErrorPagePreset)("hands ErrorState the %s preset's kind, words and icon", (preset) => {
    const group = preset.replace("-", "_");
    const { container } = render(<ErrorPage preset={preset} />);
    expect(received.state["kind"]).toBe(KIND[preset]);
    expect(received.state["title"]).toBe(`ui::error_page.${group}.title`);
    expect(received.state["description"]).toBe(`ui::error_page.${group}.description`);
    expect(received.state["actions"]).toBeUndefined();
    const own = container.querySelector("i")?.getAttribute("data-icon");
    expect(own).toBe(
      preset === "offline" ? "wifi-off" : preset === "server-error" ? "server-crash" : undefined,
    );
  });

  it("lets the caller's words win", () => {
    render(<ErrorPage preset="forbidden" title="Managers only" description={null} />);
    expect(received.state["title"]).toBe("Managers only");
    expect(received.state["description"]).toBeNull();
  });

  it("keeps the retry loading until its promise settles", async () => {
    let settle: (() => void) | undefined;
    const onRetry = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          settle = resolve;
        }),
    );
    render(<ErrorPage preset="offline" onRetry={onRetry} />);
    const retry = screen.getByRole("button", { name: "ui::error_page.retry" });
    fireEvent.click(retry);
    fireEvent.click(retry);
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(retry.getAttribute("data-loading")).toBe("true");
    await act(async () => {
      settle?.();
      await Promise.resolve();
    });
    expect(retry.getAttribute("data-loading")).toBe("false");
  });
});
