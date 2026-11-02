/**
 * Stackra file contract:
 * Purpose: proves the web OrganizationPage reads the profile through the container's `TenantProfile` into labelled
 *          fields beside the fixed handle and market, saves only the changed fields and announces it, shows the
 *          host's words in an alert when a save fails, offers a retry when the read fails, lists the legal entities
 *          and domains it is given in the order of `sections` (and leaves out a section with no data), and keeps
 *          its fields labelled under `dir="rtl"`.
 * Boundary: unit tier, jsdom, the real @stackra/ui components and the `MemoryTenantProfileDriver` of `./testing` bound
 *           in a container.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; ADR 0260; ADR 0060 (right-to-left).
 */
// @vitest-environment jsdom
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import type { PublicId } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { TenantProfile } from "#contracts/ports/tenant-profile.port";
import type { TenantProfileView } from "#contracts/types/tenant-profile-view.type";
import { OrganizationPage } from "#react/organization-page/organization-page";
import { MemoryTenantProfileDriver } from "#testing/drivers/memory-tenant-profile.driver";

const ACME: TenantProfileView = {
  tenantId: "scp_01j9z3k4m5n6p7q8r9s0t1v2wa" as PublicId<"scp">,
  handle: "acme",
  name: "Acme",
  legalName: null,
  logo: { light: null, dark: null },
  market: "sa",
  defaultLocale: "ar-SA",
  timeZone: "Asia/Riyadh",
  createdAt: new Date("2026-01-01T00:00:00Z"),
};

const LABELS = {
  title: "Organisation",
  loading: "Loading organisation",
  loadFailed: "The organisation could not be loaded.",
  retry: "Try again",
  profile: "Profile",
  name: "Name",
  legalName: "Legal name",
  defaultLocale: "Default language",
  timeZone: "Time zone",
  handle: "Handle",
  market: "Market",
  save: "Save changes",
  saved: "Changes saved",
  saveFailed: "The changes could not be saved.",
  legalEntities: "Legal entities",
  noTaxNumber: "No tax number",
  domains: "Domains",
  verified: "Verified",
  unverified: "Not verified",
};

/** A container binding `driver` as the profile port, and a wrapper that provides it. */
async function setUp(driver = new MemoryTenantProfileDriver().set(ACME)) {
  const container = await Container.create([], {
    overrides: new Map([[TenantProfile, driver]]),
  });
  const wrap = (children: ReactNode, dir: "ltr" | "rtl" = "ltr") => (
    <ContainerProvider container={container}>
      <div dir={dir}>{children}</div>
    </ContainerProvider>
  );
  return { driver, wrap };
}

const field = (name: string) => screen.findByRole("textbox", { name: new RegExp(name) });

describe("OrganizationPage (web)", () => {
  afterEach(cleanup);

  it("reads the profile into labelled fields beside the handle and the market", async () => {
    const { wrap } = await setUp();
    render(wrap(<OrganizationPage labels={LABELS} />));
    expect(screen.getByRole("heading", { name: "Organisation" })).toBeTruthy();
    expect(((await field("^Name")) as HTMLInputElement).value).toBe("Acme");
    expect(((await field("Time zone")) as HTMLInputElement).value).toBe("Asia/Riyadh");
    expect(screen.getByText("acme")).toBeTruthy();
    expect(screen.getByText("sa")).toBeTruthy();
  });

  it("saves only the changed fields and announces it", async () => {
    const { driver, wrap } = await setUp();
    const onSaved = vi.fn();
    render(wrap(<OrganizationPage labels={LABELS} onSaved={onSaved} />));
    fireEvent.change(await field("Legal name"), { target: { value: "Acme Trading LLC" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    });
    expect((await screen.findByText("Changes saved")).closest("[role='status']")).toBeTruthy();
    expect(driver.updates).toEqual([{ legalName: "Acme Trading LLC" }]);
    expect(onSaved).toHaveBeenCalledWith({ ...ACME, legalName: "Acme Trading LLC" });
  });

  it("shows the host's words when a save fails", async () => {
    const { driver, wrap } = await setUp();
    vi.spyOn(driver, "update").mockRejectedValue(new Error("refused"));
    render(wrap(<OrganizationPage labels={LABELS} />));
    fireEvent.change(await field("^Name"), { target: { value: "Acme Academy" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect((await screen.findByRole("alert")).textContent).toContain(LABELS.saveFailed);
  });

  it("offers a retry when the profile cannot be read", async () => {
    const driver = new MemoryTenantProfileDriver();
    const { wrap } = await setUp(driver);
    render(wrap(<OrganizationPage labels={LABELS} />));
    expect(await screen.findByText(LABELS.loadFailed)).toBeTruthy();
    driver.set(ACME);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(((await field("^Name")) as HTMLInputElement).value).toBe("Acme");
  });

  it("lists the legal entities and domains in the order of sections, leaving out one with no data", async () => {
    const { wrap } = await setUp();
    render(
      wrap(
        <OrganizationPage
          sections={["domains", "legal-entities", "profile"]}
          domains={[{ id: "d1", host: "acme.example", isVerified: true }]}
          labels={LABELS}
        />,
      ),
    );
    expect(await screen.findByRole("heading", { name: "Domains" })).toBeTruthy();
    expect(screen.getByText("acme.example")).toBeTruthy();
    expect(screen.getByText("Verified")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Legal entities" })).toBeNull();
    const headings = screen.getAllByRole("heading").map((heading) => heading.textContent);
    expect(headings.indexOf("Domains")).toBeLessThan(headings.indexOf("Profile"));
  });

  it("shows the host's words for a legal entity without a tax number", async () => {
    const { wrap } = await setUp();
    render(
      wrap(
        <OrganizationPage
          legalEntities={[{ id: "e1", name: "Acme Trading LLC", taxNumber: null }]}
          labels={LABELS}
        />,
      ),
    );
    expect(await screen.findByText("Acme Trading LLC")).toBeTruthy();
    expect(screen.getByText("No tax number")).toBeTruthy();
  });

  it("keeps its fields labelled and their values in their own direction under right-to-left", async () => {
    const { wrap } = await setUp(
      new MemoryTenantProfileDriver().set({ ...ACME, name: "أكاديمية أكمي" }),
    );
    render(wrap(<OrganizationPage labels={{ ...LABELS, name: "الاسم" }} />, "rtl"));
    const name = (await field("الاسم")) as HTMLInputElement;
    expect(name.value).toBe("أكاديمية أكمي");
    expect(name.closest("[dir='rtl']")).toBeTruthy();
  });
});
