/**
 * Stackra file contract:
 * Purpose: `loginAs(page, actor)`, signs a test actor in for a journey without driving the sign-in screen: the stack's
 *          `session` control route answers with the session cookie, which lands in the page's browser context.
 * Boundary: posts through `page.request`, whose cookie jar is the page's context, so every page of that context (an
 *           Electron window included) is signed in. Only inside a test or a hook.
 * Runtime: node (Playwright)
 * Governing contract: ADR 0269 (decision 6).
 */
import type { Page } from "@playwright/test";

import { controlUrl } from "#e2e/control/control-url.function";
import { E2E_CONTROL } from "#e2e/control/e2e-control.constant";
import type { TestActor } from "#e2e/login-as/test-actor.type";

/**
 * Signs `actor` in on `page`'s context.
 *
 * @throws Error when the stack does not answer 2xx.
 * @example
 * await loginAs(page, { role: "staff", tenant: "ten_1", memberships: ["ten_1", "ten_2"] });
 */
export async function loginAs(page: Page, actor: TestActor): Promise<void> {
  const response = await page.request.post(controlUrl(E2E_CONTROL.session), { data: actor });
  if (!response.ok())
    throw new Error(
      `loginAs(${actor.role}@${actor.tenant}) failed: the e2e stack answered ${response.status()}`,
    );
}
