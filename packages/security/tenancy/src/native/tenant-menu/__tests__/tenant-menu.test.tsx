/**
 * Stackra file contract:
 * Purpose: proves the native TenantMenu lists every membership as a single-choice list named by the host, the current
 *          one selected and the host's line under each, switches the container's `TenantSwitcher` to a pressed one
 *          and reports it, reports the current one pressed again without switching, hands the host's `failed` words
 *          to `onError` when a switch is refused, and renders nothing with no active membership.
 * Boundary: unit tier, jsdom. React Native does not render in vitest, so `@stackra/ui/native` is replaced by DOM
 *           stand-ins that keep the List's single-selection contract (pressing the selected row reports no keys);
 *           the `TenantSwitcher` and its container are real.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; ADR 0208.
 */
// @vitest-environment jsdom
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { ActiveScopeService } from "@stackra/scope";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { TenantSwitcher } from "#core/index";
import type { TenantMembership } from "#core/types/tenant-membership.type";
import { TenantMenu } from "#native/tenant-menu/tenant-menu";

/** What the stand-in List receives. */
interface ListStandInProps {
  readonly label: string;
  readonly selectedKeys: readonly string[];
  readonly onSelectionChange: (keys: readonly string[]) => void;
  readonly items: readonly {
    readonly id: string;
    readonly title: string;
    readonly description?: string;
    readonly endContent?: ReactNode;
    readonly isDisabled?: boolean;
  }[];
}

vi.mock("@stackra/ui/native", async () => {
  const { createElement } = await import("react");
  return {
    Avatar: () => null,
    Spinner: () => createElement("span", { role: "progressbar" }),
    List: ({ label, selectedKeys, onSelectionChange, items }: ListStandInProps) =>
      createElement(
        "div",
        { role: "radiogroup", "aria-label": label },
        items.map((item) =>
          createElement(
            "button",
            {
              key: item.id,
              type: "button",
              role: "radio",
              "aria-checked": selectedKeys.includes(item.id),
              disabled: item.isDisabled,
              onClick: () => onSelectionChange(selectedKeys.includes(item.id) ? [] : [item.id]),
            },
            item.title,
            item.description === undefined ? null : createElement("small", null, item.description),
            item.endContent,
          ),
        ),
      ),
  };
});

const ALPHA: TenantMembership = {
  tenantId: "scp_01j9z3k4m5n6p7q8r9s0t1v2wa",
  path: "platform.acme.alpha",
  name: "Alpha",
  role: "admin",
  roles: ["admin"],
};
const BETA: TenantMembership = {
  ...ALPHA,
  tenantId: "scp_01j9z3k4m5n6p7q8r9s0t1v2wb",
  path: "platform.acme.beta",
  name: "Beta",
};

const LABELS = {
  label: "Your organisations",
  switching: "Switching…",
  failed: "Couldn't switch organisation.",
};

/** A switcher holding `memberships` and a wrapper that binds it. */
async function setUp(memberships: readonly TenantMembership[] = [ALPHA, BETA]) {
  const switcher = new TenantSwitcher(new ActiveScopeService());
  switcher.setMemberships(memberships);
  const container = await Container.create([], {
    overrides: new Map([[TenantSwitcher, switcher]]),
  });
  const wrap = (children: ReactNode) => (
    <ContainerProvider container={container}>{children}</ContainerProvider>
  );
  return { switcher, wrap };
}

describe("TenantMenu (native)", () => {
  afterEach(cleanup);

  it("lists the memberships with the current one selected and the host's line", async () => {
    const { wrap } = await setUp();
    render(wrap(<TenantMenu labels={LABELS} describe={(m) => `Role ${m.role}`} />));
    expect(screen.getByRole("radiogroup", { name: "Your organisations" })).toBeTruthy();
    const alpha = screen.getByRole("radio", { name: /Alpha/ });
    expect(alpha.getAttribute("aria-checked")).toBe("true");
    expect(alpha.textContent).toContain("Role admin");
    expect(screen.getByRole("radio", { name: /Beta/ }).getAttribute("aria-checked")).toBe("false");
  });

  it("switches to a pressed membership and reports it", async () => {
    const { switcher, wrap } = await setUp();
    const onSwitched = vi.fn();
    render(wrap(<TenantMenu labels={LABELS} onSwitched={onSwitched} />));
    await act(async () => {
      fireEvent.click(screen.getByRole("radio", { name: /Beta/ }));
    });
    await waitFor(() => expect(onSwitched).toHaveBeenCalledWith(BETA.tenantId));
    expect(switcher.current()?.tenantId).toBe(BETA.tenantId);
    expect(screen.getByRole("radio", { name: /Beta/ }).getAttribute("aria-checked")).toBe("true");
  });

  it("reports the current membership pressed again without switching", async () => {
    const { switcher, wrap } = await setUp();
    const spy = vi.spyOn(switcher, "switchTo");
    const onSwitched = vi.fn();
    render(wrap(<TenantMenu labels={LABELS} onSwitched={onSwitched} />));
    fireEvent.click(screen.getByRole("radio", { name: /Alpha/ }));
    await waitFor(() => expect(onSwitched).toHaveBeenCalledWith(ALPHA.tenantId));
    expect(spy).not.toHaveBeenCalled();
  });

  it("hands the host's words to onError when a switch fails", async () => {
    const { switcher, wrap } = await setUp();
    vi.spyOn(switcher, "switchTo").mockRejectedValue(new Error("refused"));
    const [onSwitched, onError] = [vi.fn(), vi.fn()];
    render(wrap(<TenantMenu labels={LABELS} onSwitched={onSwitched} onError={onError} />));
    fireEvent.click(screen.getByRole("radio", { name: /Beta/ }));
    await waitFor(() => expect(onError).toHaveBeenCalledWith(LABELS.failed));
    expect(onSwitched).not.toHaveBeenCalled();
    expect(switcher.current()?.tenantId).toBe(ALPHA.tenantId);
  });

  it("renders nothing with no active membership", async () => {
    const { wrap } = await setUp([]);
    const { container } = render(wrap(<TenantMenu labels={LABELS} />));
    expect(container.textContent).toBe("");
  });
});
