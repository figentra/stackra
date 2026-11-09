/**
 * Stackra file contract:
 * Purpose: unit tests of `VisitorIdentityService`: with no signing key every call is a new visitor and nothing is
 *          carried back; a new visitor gets a signed token in the header and an httpOnly cookie; the token carried in
 *          the header or the cookie keeps the same id with nothing re-issued; a previous-key token keeps its id and is
 *          re-signed with the current key; a forged token makes a new visitor, never the one it names.
 * Boundary: test only; the config is a plain object of `VisitorConfig`'s shape.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; STA-2025 (as amended 2026-11-09).
 */
import { describe, expect, it } from "@stackra/testing";

import type { VisitorConfig } from "#config/visitor.config";
import { signVisitorToken } from "#server/functions/sign-visitor-token.function";
import { verifyVisitorToken } from "#server/functions/verify-visitor-token.function";
import { VisitorIdentityService } from "#server/services/visitor-identity.service";

/** The service over `keys`, with the default header, cookie and lifetime. */
const serviceOf = (signingKey: string, previousSigningKey = "") =>
  new VisitorIdentityService({
    signingKey,
    previousSigningKey,
    headerName: "stackra-visitor",
    cookieName: "stackra_visitor",
    cookieMaxAgeDays: 365,
  } as VisitorConfig);

/** A request carrying `headers`. */
const requestWith = (headers: Record<string, string> = {}) =>
  new Request("https://api.example.test/carts", { headers });

describe(VisitorIdentityService, () => {
  it("makes every call a new visitor, carrying nothing back, while no signing key is set", async () => {
    const service = serviceOf("");
    const first = await service.resolve(requestWith());
    const second = await service.resolve(requestWith());
    expect(first.id).not.toBe(second.id);
    expect(first.issue).toBeUndefined();
  });

  it("signs a new visitor and carries it back in the header and an httpOnly cookie", async () => {
    const visitor = await serviceOf("now").resolve(requestWith());
    expect(visitor.id).toMatch(/^anon_/);
    expect(visitor.issue?.header).toBe("stackra-visitor");
    expect(await verifyVisitorToken(visitor.issue?.token ?? "", ["now"])).toEqual({
      id: visitor.id,
      key: 0,
    });
    expect(visitor.issue?.cookie).toBe(
      `stackra_visitor=${visitor.issue?.token}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`,
    );
  });

  it("keeps the visitor its header or its cookie names, re-issuing nothing", async () => {
    const service = serviceOf("now");
    const { id, issue } = await service.resolve(requestWith());
    const token = issue?.token ?? "";
    expect(await service.resolve(requestWith({ "stackra-visitor": token }))).toEqual({ id });
    expect(
      await service.resolve(requestWith({ cookie: `theme=dark; stackra_visitor=${token}` })),
    ).toEqual({ id });
  });

  it("keeps a visitor signed with the previous key and re-signs it with the current one", async () => {
    const id = (await serviceOf("before").resolve(requestWith())).id;
    const old = await signVisitorToken(id, "before");
    const visitor = await serviceOf("now", "before").resolve(
      requestWith({ "stackra-visitor": old }),
    );
    expect(visitor.id).toBe(id);
    expect(await verifyVisitorToken(visitor.issue?.token ?? "", ["now"])).toEqual({ id, key: 0 });
  });

  it("makes a new visitor for a token no key signed, never the one it names", async () => {
    const victim = (await serviceOf("now").resolve(requestWith())).id;
    const forged = await signVisitorToken(victim, "guessed");
    const visitor = await serviceOf("now").resolve(requestWith({ "stackra-visitor": forged }));
    expect(visitor.id).not.toBe(victim);
    expect(visitor.issue).toBeDefined();
  });
});
