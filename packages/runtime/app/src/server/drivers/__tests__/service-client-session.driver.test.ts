/**
 * Stackra file contract:
 * Purpose: unit tests of `ServiceClientSessionDriver`: it is the `ClientSession` port; a call to a configured module
 *          sends this service's token for that module's audience and no `Stackra-On-Behalf-Of` outside a held call; a
 *          module with no audience, or no call at all, is a `TypeError` that names no token and asks for none; and it
 *          holds no user permission.
 * Boundary: test only; the tokens are throwaway strings from `MemoryServiceTokensDriver`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0209 (decision 3 and its 2026-11-07 amendment, point 1).
 */
import { ClientsConfig } from "@stackra/clients";
import { ClientSession } from "@stackra/clients/contracts";
import type { ClientRequest } from "@stackra/clients/contracts";
import { buildConfig } from "@stackra/config";
import { MemoryServiceTokensDriver } from "@stackra/identity";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";
import { z } from "zod";

import { ServiceClientSessionDriver } from "#server/drivers/service-client-session.driver";

const request = (key: string): ClientRequest => ({
  key,
  kind: "action",
  input: {},
  output: z.unknown(),
});

/** A session whose `pay` module is Pay's project, over a seeded token source. */
function session() {
  const config = buildConfig(ClientsConfig, { values: { audiences: { pay: "pay-project" } } });
  const tokens = new MemoryServiceTokensDriver().seed({ "pay-project": "throwaway-pay-token" });
  return { tokens, driver: new ServiceClientSessionDriver(tokens, config) };
}

describe(ServiceClientSessionDriver, () => {
  it("is the ClientSession port", () => {
    expect(session().driver).toBeInstanceOf(ClientSession);
  });

  it("sends the service token for the call's producer, and no user outside a held call", async () => {
    expect(await session().driver.headers(request("pay.ledger.post@1"))).toEqual({
      Authorization: "Bearer throwaway-pay-token",
    });
  });

  it("refuses a module with no audience, or no call, before asking for a token", async () => {
    const { tokens, driver } = session();
    const asked = vi.spyOn(tokens, "for");
    await expect(driver.headers(request("ship.parcel.book@1"))).rejects.toThrow(
      /no audience is configured for module ship/,
    );
    await expect(driver.headers(request("constructor.x.y@1"))).rejects.toThrow(TypeError);
    await expect(driver.headers()).rejects.toThrow(TypeError);
    expect(asked).not.toHaveBeenCalled();
  });

  it("holds no user permission", () => {
    expect(session().driver.can()).toBe(false);
  });
});
