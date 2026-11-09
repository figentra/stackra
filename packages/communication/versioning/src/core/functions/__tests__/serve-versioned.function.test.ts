/**
 * Stackra file contract:
 * Purpose: unit tests of `serveVersioned`: a key caller with no header and no pin is refused (`version_required`, naming
 *          the header and the current version); a header date gets the shape of that date through the registered
 *          change; a pin stands in for the header; a non-key caller with no header gets the latest; a version the
 *          service does not serve, or one past its sunset, is refused (the served dates, the sunset day); the notice
 *          period carries `Deprecation` and `Sunset`; every answer names its version and varies on it; a refusal of the
 *          call is answered as its envelope and never downgraded; the support source sets the window; fewer than two
 *          served dates is dormant.
 * Boundary: test only; the container is a two-method stub, and the change is registered the way gen does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0118 (decisions 1 to 4); ADR 0140; STA-2532 (FR-006 to FR-008,
 *                     FR-016, AC-005).
 */
import { ActorKind, Clock, VersionSupportSource } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import { ErrorKind, Refusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";
import { Schema } from "@stackra/validation";

import { VersioningConfig } from "#config/versioning.config";
import { Change } from "#core/bases/change.base";
import { registerChanges } from "#core/functions/register-changes.function";
import { serveVersioned } from "#core/functions/serve-versioned.function";

class PaymentView extends Schema {
  id!: string;

  amount!: { minor: number; currency: string };
}

/** Before 2027-03-01 the amount was flat. */
class PaymentView202703Change extends Change<PaymentView>({
  from: "2027-03-01",
  sunset: "2028-03-01",
}) {
  id!: string;

  minor!: number;

  currency!: string;

  down(view: PaymentView): PaymentView202703Change {
    return PaymentView202703Change.create({
      id: view.id,
      minor: view.amount.minor,
      currency: view.amount.currency,
    });
  }
}

registerChanges([[PaymentView, PaymentView202703Change]]);

class PaymentGoneError extends Refusal({ kind: ErrorKind.NotFound }) {}

const LATEST = { id: "pay_1", amount: { minor: 500, currency: "EGP" } };
const FLAT = { id: "pay_1", minor: 500, currency: "EGP" };
const user = { kind: ActorKind.User, id: "usr_1" } as Actor;
const key = { kind: ActorKind.ApiClient, id: "key_1" } as Actor;

/** A container holding `values`, by class. */
function containerOf(...values: [abstract new () => unknown, unknown][]) {
  const held = new Map<unknown, unknown>(values);
  return {
    has: (type: unknown) => held.has(type),
    get: (type: unknown) => held.get(type),
  } as never;
}

/** A `VersioningConfig` that serves `supported`. */
function configOf(...supported: string[]): VersioningConfig {
  return { supported } as VersioningConfig;
}

const DATES = ["2026-10-01", "2027-03-01"];

/** A container serving `DATES` at `now`, plus any `extra` bindings. */
function served(now: string, ...extra: [abstract new () => unknown, unknown][]) {
  return containerOf(
    [VersioningConfig, configOf(...DATES)],
    [Clock, { now: () => new Date(now) } as Clock],
    ...extra,
  );
}

/** A request sending `version` as `Stackra-Version`, or none. */
function request(version?: string): Request {
  return new Request("http://encore/payments/pay_1", {
    headers: version === undefined ? {} : { "Stackra-Version": version },
  });
}

describe("serveVersioned", () => {
  it("refuses a key caller that names no version, naming the header and the current version", async () => {
    const response = await serveVersioned(
      request(),
      { container: served("2027-06-01T00:00:00Z"), actor: key, subject: PaymentView },
      () => Promise.resolve(LATEST),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: "version_required",
      category: "validation",
      retryable: false,
      details: { header: "Stackra-Version", current: "2027-03-01" },
    });
    expect(response.headers.get("Vary")).toBe("Stackra-Version");
  });

  it("serves a key's pin when the header is absent, and the header over the pin", async () => {
    const call = {
      container: served("2027-06-01T00:00:00Z"),
      actor: key,
      credential: { versionPin: "2026-10-01" },
      subject: PaymentView,
    };
    const pinned = await serveVersioned(request(), call, () => Promise.resolve(LATEST));
    expect(pinned.headers.get("Stackra-Version")).toBe("2026-10-01");
    expect(await pinned.json()).toEqual(FLAT);
    const header = await serveVersioned(request("2027-03-01"), call, () => Promise.resolve(LATEST));
    expect(header.headers.get("Stackra-Version")).toBe("2027-03-01");
    expect(await header.json()).toEqual(LATEST);
    // the call runs knowing the version it resolved to, for CallOptions.apiVersion and its audit entry
    const seen: (string | undefined)[] = [];
    await serveVersioned(request(), call, (apiVersion) => {
      seen.push(apiVersion);
      return Promise.resolve(LATEST);
    });
    await serveVersioned(request("2027-03-01"), call, (apiVersion) => {
      seen.push(apiVersion);
      return Promise.resolve(LATEST);
    });
    expect(seen).toEqual(["2026-10-01", "2027-03-01"]);
  });

  it("downgrades a header date to its shape and carries the notice-period headers", async () => {
    const response = await serveVersioned(
      request("2026-10-01"),
      { container: served("2027-06-01T00:00:00Z"), actor: user, subject: PaymentView },
      () => Promise.resolve(LATEST),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(FLAT);
    expect(response.headers.get("Stackra-Version")).toBe("2026-10-01");
    expect(response.headers.get("Deprecation")).toBe("@1803859200");
    expect(response.headers.get("Sunset")).toBe("Wed, 01 Mar 2028 00:00:00 GMT");
    expect(response.headers.get("Vary")).toBe("Stackra-Version");
  });

  it("gives a non-key caller with no header the latest date, never the oldest", async () => {
    const response = await serveVersioned(
      request(),
      { container: served("2027-06-01T00:00:00Z"), actor: user, subject: PaymentView },
      () => Promise.resolve(LATEST),
    );
    expect(await response.json()).toEqual(LATEST);
    expect(response.headers.get("Stackra-Version")).toBe("2027-03-01");
    expect(response.headers.has("Deprecation")).toBe(false);
    expect(response.headers.has("Sunset")).toBe(false);
  });

  it("refuses a version that is not served, naming the served dates", async () => {
    const response = await serveVersioned(
      request("2025-01-01"),
      { container: served("2027-06-01T00:00:00Z"), actor: user, subject: PaymentView },
      () => Promise.resolve(LATEST),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      code: "unsupported_version",
      details: { supported: DATES },
    });
    expect(response.headers.get("Vary")).toBe("Stackra-Version");
  });

  it("refuses a version past its sunset", async () => {
    const response = await serveVersioned(
      request("2026-10-01"),
      { container: served("2028-03-01T00:00:00Z"), actor: user, subject: PaymentView },
      () => Promise.resolve(LATEST),
    );
    expect(response.status).toBe(412);
    expect(await response.json()).toMatchObject({
      code: "version_sunset",
      details: { version: "2026-10-01", sunset: "2028-03-01" },
    });
  });

  it("takes the support window from the VersionSupportSource when one is bound", async () => {
    const source = { supportMonths: () => Promise.resolve(1) } as VersionSupportSource;
    const response = await serveVersioned(
      request("2026-10-01"),
      {
        container: served("2027-06-01T00:00:00Z", [VersionSupportSource, source]),
        actor: user,
        subject: PaymentView,
      },
      () => Promise.resolve(LATEST),
    );
    expect(response.status).toBe(412);
    expect(await response.json()).toMatchObject({ details: { sunset: "2027-04-01" } });
  });

  it("answers a refusal of the call as its envelope, never downgraded, with the version named", async () => {
    const response = await serveVersioned(
      request("2026-10-01"),
      { container: served("2027-06-01T00:00:00Z"), actor: user, subject: PaymentView },
      () => Promise.reject(PaymentGoneError.create()),
    );
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ code: "payment_gone" });
    expect(response.headers.get("Stackra-Version")).toBe("2026-10-01");
    expect(response.headers.get("Vary")).toBe("Stackra-Version");
  });

  it("rethrows an error that is not a refusal", async () => {
    await expect(
      serveVersioned(request(), { container: served("2027-06-01T00:00:00Z"), actor: user }, () =>
        Promise.reject(new Error("boom")),
      ),
    ).rejects.toThrow("boom");
  });

  it("leaves an output with no registered change, and no subject, as it is", async () => {
    const response = await serveVersioned(
      request("2026-10-01"),
      { container: served("2027-06-01T00:00:00Z"), actor: user },
      () => Promise.resolve(LATEST),
    );
    expect(await response.json()).toEqual(LATEST);
    expect(response.headers.get("Stackra-Version")).toBe("2026-10-01");
  });

  it("is dormant with fewer than two served dates: it echoes the one date and refuses nothing", async () => {
    const one = containerOf([VersioningConfig, configOf("2027-03-01")]);
    const echoed = await serveVersioned(request("bogus"), { container: one, actor: key }, () =>
      Promise.resolve(LATEST),
    );
    expect(echoed.status).toBe(200);
    expect(echoed.headers.get("Stackra-Version")).toBe("2027-03-01");
    for (const container of [containerOf(), containerOf([VersioningConfig, configOf()])]) {
      const response = await serveVersioned(request(), { container, actor: key }, () =>
        Promise.resolve(LATEST),
      );
      expect(response.status).toBe(200);
      expect(response.headers.has("Stackra-Version")).toBe(false);
    }
  });
});
