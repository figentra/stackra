/**
 * Stackra file contract:
 * Purpose: unit tests of `inspectionTarget`: local dev and the testbed only; in dev, a connection on this machine
 *          (loopback, socket, container name) and never a shared host, whose name the refusal gives without the URL.
 * Boundary: test only; pure values, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 5); STA-2906.
 */
import { describe, expect, it } from "@stackra/testing";

import { InspectionRefusedError } from "#node/errors/inspection-refused.error";
import { inspectionTarget } from "#node/functions/inspection-target.function";

/** A dev inspection of a database on another machine. */
const remote = () =>
  inspectionTarget({ DATABASE_URL: "postgres://app:s3cret@db.prod.example.com:5432/notes" });

describe("inspectionTarget", () => {
  it("reads DATABASE_DIRECT_URL, else DATABASE_URL, in dev by default", () => {
    expect(inspectionTarget({ DATABASE_URL: "postgres://a:b@127.0.0.1:9500/notes" })).toEqual({
      url: "postgres://a:b@127.0.0.1:9500/notes",
      environment: "dev",
    });
    expect(
      inspectionTarget({
        DATABASE_URL: "postgres://pooler:6432/notes",
        DATABASE_DIRECT_URL: "postgres://localhost:5432/notes",
      }).url,
    ).toBe("postgres://localhost:5432/notes");
  });

  it("accepts the hosts of this machine and its containers in dev", () => {
    for (const url of [
      "postgres://localhost/notes",
      "postgres://[::1]:5432/notes",
      "postgres://postgres:5432/notes",
      "postgres://host.docker.internal:5432/notes",
      "postgres://db.stackra.local/notes",
      "postgres:///notes?host=/var/run/postgresql",
      "postgres:///notes",
    ])
      expect(inspectionTarget({ DATABASE_URL: url }).environment).toBe("dev");
  });

  it("refuses a dev connection to another machine, naming the host and never the URL", () => {
    expect(remote).toThrow(InspectionRefusedError);
    expect(remote).toThrow(/db\.prod\.example\.com is not local/);
    expect(remote).not.toThrow(/s3cret/);
  });

  it("reads any host on the testbed", () => {
    expect(
      inspectionTarget({
        STACKRA_ENVIRONMENT: "test",
        DATABASE_URL: "postgres://ci-db.testbed.example:5432/notes",
      }).environment,
    ).toBe("test");
  });

  it("refuses every deployed environment", () => {
    for (const environment of ["preview", "staging", "production"])
      expect(() =>
        inspectionTarget({
          STACKRA_ENVIRONMENT: environment,
          DATABASE_URL: "postgres://localhost/notes",
        }),
      ).toThrow(`local dev and testbed databases only, not ${environment}`);
  });

  it("refuses a connection string that is not a URL, and needs one", () => {
    expect(() => inspectionTarget({ DATABASE_URL: "host=localhost dbname=notes" })).toThrow(
      "the database connection string is not a URL",
    );
    expect(() => inspectionTarget({})).toThrow("DATABASE_DIRECT_URL (or DATABASE_URL) is not set");
  });

  it("is a usage refusal with the inspection_refused code", () => {
    const error = new InspectionRefusedError("no", "do this");
    expect(error.name).toBe("InspectionRefusedError");
    expect(error.hint).toBe("do this");
  });
});
