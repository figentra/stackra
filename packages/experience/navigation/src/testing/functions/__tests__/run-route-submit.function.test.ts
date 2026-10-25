/**
 * Stackra file contract:
 * Purpose: unit tests of `runRouteSubmit` over the template's contact test: the form reaches `ctx.formData()` as a
 *          POST, a bad submission answers 400 with field errors without calling anything, a good one reaches the
 *          member the input passed, and a part in `services` builds the route and hands its fake back.
 * Boundary: test only; the lead list and the captcha are local stand-ins.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decisions 3 and 6).
 */
import { describe, expect, it } from "vitest";

import { Route } from "#core/bases/route.base";
import type { RouteContext } from "#core/types/route-context.type";
import { runRouteSubmit } from "#testing/functions/run-route-submit.function";

class ContactRoute extends Route({ path: "/contact" }) {
  override async submit(ctx: RouteContext<this>) {
    const form = await ctx.formData();
    const email = form["email"];
    if (typeof email !== "string" || !email.includes("@"))
      return ctx.data({ fieldErrors: { email: "web::contact.errors.email" } }, { status: 400 });
    (ctx as unknown as { leads: string[] }).leads.push(email);
    return { sent: { email }, method: ctx.request.method };
  }
}

class CaptchaRoute extends Route({ path: "/captcha" }) {
  private readonly captcha: { readonly passes: boolean };

  constructor(captcha: { readonly passes: boolean }) {
    super();
    this.captcha = captcha;
  }

  override submit() {
    return { passed: this.captcha.passes };
  }
}

describe("runRouteSubmit", () => {
  it("answers 400 with field errors for a bad submission and calls nothing", async () => {
    const leads: string[] = [];
    const { result } = await runRouteSubmit(ContactRoute, { form: { email: "nope" }, leads });
    expect(result).toMatchObject({
      status: 400,
      data: { fieldErrors: { email: "web::contact.errors.email" } },
    });
    expect(leads).toEqual([]);
  });

  it("posts the form and reaches the member the input passed", async () => {
    const leads: string[] = [];
    const { result } = await runRouteSubmit(ContactRoute, {
      form: { email: "lina@northwind.example" },
      leads,
    });
    expect(result).toEqual({ sent: { email: "lina@northwind.example" }, method: "POST" });
    expect(leads).toEqual(["lina@northwind.example"]);
  });

  it("runs the instance a part in services builds and returns its fake", async () => {
    const captcha = { passes: false };
    const run = (await runRouteSubmit(CaptchaRoute, {
      services: [() => ({ instance: new CaptchaRoute(captcha), context: { captcha } })],
    })) as { result: unknown; captcha: unknown };
    expect(run.result).toEqual({ passed: false });
    expect(run.captcha).toBe(captcha);
  });
});
