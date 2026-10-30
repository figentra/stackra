/**
 * Stackra file contract:
 * Purpose: proves the web AccountConnection shows the service's name and description, a neutral "not connected" status
 *          with a primary connect button, a success "connected" status with the account's name and a secondary
 *          disconnect button, calls the matching handler, puts the status in a live region, refuses presses while
 *          loading, and passes card props on.
 * Boundary: jsdom with real HeroUI and Motion; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, render, screen, waitFor } from "@testing-library/react";

import type { AccountConnectionContractProps } from "#contracts/types/account-connection-contract-props.type";
import { AccountConnection } from "#react/account-connection/account-connection";
import type { AccountConnectionProps } from "#react/account-connection/account-connection.props";

const press = (element: HTMLElement) => act(() => element.click());

const WORDS = {
  title: "Stripe",
  description: "Take card payments online and in store.",
  connectedLabel: "Connected",
  disconnectedLabel: "Not connected",
  connectLabel: "Connect",
  disconnectLabel: "Disconnect",
} as const;

describe("AccountConnection (web)", () => {
  it("offers to connect while not connected", () => {
    const onConnect = vi.fn();
    render(<AccountConnection {...WORDS} isConnected={false} onConnect={onConnect} />);
    expect(screen.getByText("Stripe")).toBeTruthy();
    expect(screen.getByText(WORDS.description)).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("Not connected");
    const button = screen.getByRole("button", { name: "Connect" });
    expect(button.classList.contains("button--primary")).toBe(true);
    press(button);
    expect(onConnect).toHaveBeenCalledOnce();
  });

  it("shows the connected account and offers to disconnect", async () => {
    const onDisconnect = vi.fn();
    const { rerender } = render(<AccountConnection {...WORDS} isConnected={false} />);
    rerender(
      <AccountConnection
        {...WORDS}
        isConnected
        accountName="payments@souq.example"
        onDisconnect={onDisconnect}
      />,
    );
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain("payments@souq.example"),
    );
    expect(screen.getByRole("status").textContent).toContain("Connected");
    const button = screen.getByRole("button", { name: "Disconnect" });
    expect(button.classList.contains("button--secondary")).toBe(true);
    press(button);
    expect(onDisconnect).toHaveBeenCalledOnce();
  });

  it("refuses presses while loading, draws the footnote and passes card props through", () => {
    const onConnect = vi.fn();
    render(
      <AccountConnection
        {...WORDS}
        isConnected={false}
        isLoading
        onConnect={onConnect}
        details="By connecting you accept the terms."
        id="stripe"
      />,
    );
    press(screen.getByRole("button"));
    expect(onConnect).not.toHaveBeenCalled();
    expect(screen.getByText("By connecting you accept the terms.")).toBeTruthy();
    expect(document.getElementById("stripe")).toBeTruthy();
  });

  it("types: extends the contract and refuses children", () => {
    expectTypeOf<AccountConnectionProps>().toExtend<AccountConnectionContractProps>();
    expectTypeOf<AccountConnectionProps>().not.toHaveProperty("children");
  });
});
