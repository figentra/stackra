/**
 * Stackra file contract:
 * Purpose: unit tests of `loginAs`: it posts the test actor to the stack's session control path through the page's
 *          request context, and a refusal throws with the actor and the status.
 * Boundary: test only; `@playwright/test` is mocked to a project `baseURL` and the page is a stub, so no browser runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 6); ADR 0182 (decision 2: coverage floors).
 */
import type { Page } from "@playwright/test";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { loginAs } from "#e2e/login-as/login-as.function";

vi.mock("@playwright/test", () => ({
  test: { info: () => ({ project: { use: { baseURL: "http://localhost:5174" } } }) },
}));

/** A page whose request context answers `status`. */
function pageAnswering(status: number): { page: Page; post: ReturnType<typeof vi.fn> } {
  const post = vi.fn(async () => ({ ok: () => status < 400, status: () => status }));
  return { page: { request: { post } } as unknown as Page, post };
}

describe("loginAs", () => {
  it("posts the actor to the session control path", async () => {
    const { page, post } = pageAnswering(204);
    const actor = { role: "staff", scope: "ten_1", memberships: ["ten_1", "ten_2"] };
    await loginAs(page, actor);
    expect(post).toHaveBeenCalledWith("http://localhost:5174/__stackra/e2e/session", {
      data: actor,
    });
  });

  it("throws with the actor and the status when the stack refuses", async () => {
    const { page } = pageAnswering(403);
    await expect(loginAs(page, { role: "admin", scope: "ten_9" })).rejects.toThrow(
      "loginAs(admin@ten_9) failed: the e2e stack answered 403",
    );
  });
});
