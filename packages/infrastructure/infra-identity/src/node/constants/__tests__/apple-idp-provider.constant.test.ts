/**
 * Stackra file contract:
 * Purpose: unit tests of `APPLE_IDP_PROVIDER`: create signs in with the provisioner's key, adds the Apple provider
 *          with the base64 key and allows it on the default login policy; the state holds no Apple key; a changed id
 *          or key is an update and a new domain a replacement; delete removes it from the policy and the instance; a
 *          refused call names only its status.
 * Boundary: test only; `fetch` is a stand-in and the keys are generated here, so nothing reaches ZITADEL or Apple.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0173; STA-1578.
 */
import { generateKeyPairSync } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { APPLE_IDP_PROVIDER } from "#node/constants/apple-idp-provider.constant";
import type { AppleIdpInputs } from "#node/types/apple-idp-inputs.type";

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });

const INPUTS: AppleIdpInputs = {
  domain: "id.staging.acme.example",
  jwtProfileJson: JSON.stringify({
    type: "serviceaccount",
    keyId: "k1",
    userId: "u1",
    key: privateKey.export({ type: "pkcs1", format: "pem" }),
  }),
  clientId: "example.acme.signin",
  teamId: "TEAM000001",
  keyId: "KEY0000001",
  privateKey: "-----BEGIN PRIVATE KEY-----\nAPPLE\n-----END PRIVATE KEY-----",
};

/** Every admin call after the token: method, path and body. */
const calls: { method: string; path: string; body: unknown }[] = [];
let status = 200;

beforeEach(() => {
  calls.length = 0;
  status = 200;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      const { pathname } = new URL(url);
      if (pathname === "/oauth/v2/token") {
        const form = new URLSearchParams(String(init.body));
        expect(form.get("grant_type")).toBe("urn:ietf:params:oauth:grant-type:jwt-bearer");
        expect(form.get("assertion")?.split(".")).toHaveLength(3);
        return Response.json({ access_token: "t1" });
      }
      expect(new Headers(init.headers).get("authorization")).toBe("Bearer t1");
      calls.push({
        method: String(init.method),
        path: pathname,
        body: init.body === undefined ? undefined : JSON.parse(String(init.body)),
      });
      return Response.json({ id: "idp1" }, { status });
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("APPLE_IDP_PROVIDER", () => {
  it("adds the Apple provider and allows it on the default login policy, keeping no Apple key", async () => {
    const result = await APPLE_IDP_PROVIDER.create?.(INPUTS);

    expect(result?.id).toBe("idp1");
    expect(calls.map(({ method, path }) => `${method} ${path}`)).toEqual([
      "POST /admin/v1/idps/apple",
      "POST /admin/v1/policies/login/idps",
    ]);
    expect(calls[0]?.body).toMatchObject({
      name: "Apple",
      clientId: "example.acme.signin",
      teamId: "TEAM000001",
      keyId: "KEY0000001",
      privateKey: Buffer.from(INPUTS.privateKey).toString("base64"),
      scopes: ["name", "email"],
    });
    expect(calls[1]?.body).toEqual({ idpId: "idp1" });
    expect(JSON.stringify(result?.outs)).not.toContain("APPLE");
    expect(result?.outs).toMatchObject({ teamId: "TEAM000001", keyHash: expect.any(String) });
  });

  it("updates on a new key and replaces on a new domain", async () => {
    const olds = (await APPLE_IDP_PROVIDER.create?.(INPUTS))?.outs;

    expect(await APPLE_IDP_PROVIDER.diff?.("idp1", olds, INPUTS)).toMatchObject({ changes: false });
    expect(
      await APPLE_IDP_PROVIDER.diff?.("idp1", olds, { ...INPUTS, privateKey: "rotated" }),
    ).toMatchObject({ changes: true, replaces: [] });
    expect(
      await APPLE_IDP_PROVIDER.diff?.("idp1", olds, { ...INPUTS, domain: "id.acme.example" }),
    ).toMatchObject({ changes: true, replaces: ["domain"] });

    await APPLE_IDP_PROVIDER.update?.("idp1", olds, INPUTS);
    expect(calls.at(-1)).toMatchObject({ method: "PUT", path: "/admin/v1/idps/apple/idp1" });
  });

  it("removes it from the default login policy and the instance", async () => {
    const olds = (await APPLE_IDP_PROVIDER.create?.(INPUTS))?.outs;
    calls.length = 0;

    await APPLE_IDP_PROVIDER.delete?.("idp1", olds);

    expect(calls.map(({ method, path }) => `${method} ${path}`)).toEqual([
      "DELETE /admin/v1/policies/login/idps/idp1",
      "DELETE /admin/v1/idps/templates/idp1",
    ]);
  });

  it("names only the status of a refused call", async () => {
    status = 403;

    await expect(APPLE_IDP_PROVIDER.create?.(INPUTS)).rejects.toThrow(
      "ZITADEL POST /admin/v1/idps/apple failed (HTTP 403)",
    );
  });
});
