/**
 * Stackra file contract:
 * Purpose: unit tests of `loginAs`: the actor is posted to the e2e stack's session endpoint through the page's request context, and a
 *          non-2xx answer throws with the actor and the status.
 * Boundary: test only; the page's request context and the project baseURL are stubs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";
import type { Page } from "@playwright/test";
import { vi } from "vitest";

import { loginAs } from "#e2e/login-as/login-as.function";

const { info } = vi.hoisted(() => ({ info: vi.fn() }));
vi.mock("@playwright/test", () => ({ test: { info } }));

/** A page whose request context answers with `status`. */
const pageAnswering = (status: number) => {
  const post = vi.fn(async () => ({
    ok: () => status >= 200 && status < 300,
    status: () => status,
  }));
  return { page: { request: { post } } as unknown as Page, post };
};

describe("loginAs", () => {
  it("posts the actor to the session endpoint of the e2e stack", async () => {
    info.mockReturnValue({ project: { use: { baseURL: "http://127.0.0.1:3710" } } });
    const { page, post } = pageAnswering(204);
    const actor = { role: "staff", scope: "ten_1", memberships: ["ten_1", "ten_2"] };
    await loginAs(page, actor);
    expect(post).toHaveBeenCalledWith("http://127.0.0.1:3710/__stackra/e2e/session", {
      data: actor,
    });
  });

  it("throws, naming the actor and the status, when the stack does not answer 2xx", async () => {
    info.mockReturnValue({ project: { use: { baseURL: "http://127.0.0.1:3710" } } });
    const { page } = pageAnswering(401);
    await expect(loginAs(page, { role: "staff", scope: "ten_1" })).rejects.toThrow(
      "loginAs(staff@ten_1) failed: the e2e stack answered 401",
    );
  });
});
