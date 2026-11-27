/**
 * Stackra file contract:
 * Purpose: unit tests of `parseBootstrapArgs`: its own options in both spellings, everything else forwarded in order,
 *          everything after `--` forwarded as written, and the refusals.
 * Boundary: pure function under test.
 * Runtime: node
 * Governing contract: ADR 0199 (amendment of 2026-11-27); ADR 0022 (test placement).
 */
import { BootstrapUsageError } from "#node/errors/bootstrap-usage.error";
import { parseBootstrapArgs } from "#node/functions/parse-bootstrap-args.function";

describe("parseBootstrapArgs", () => {
  it("forwards every argument that is not its own, in order", () => {
    expect(parseBootstrapArgs(["my-app", "--yes", "--scope", "@acme"])).toEqual({
      registry: undefined,
      cli: "latest",
      help: false,
      forwarded: ["my-app", "--yes", "--scope", "@acme"],
    });
  });

  it("takes --registry and --cli with a space or an equals sign", () => {
    expect(
      parseBootstrapArgs(["--registry", "http://localhost:8787", "my-app", "--cli=0.34.0-next.3"]),
    ).toEqual({
      registry: "http://localhost:8787",
      cli: "0.34.0-next.3",
      help: false,
      forwarded: ["my-app"],
    });
    expect(parseBootstrapArgs(["--registry=https://r.test/", "--cli", "next"])).toMatchObject({
      registry: "https://r.test/",
      cli: "next",
    });
  });

  it("sees help before --, and forwards everything after -- as written", () => {
    expect(parseBootstrapArgs(["-h"]).help).toBe(true);
    expect(parseBootstrapArgs(["my-app", "--", "--help", "--registry", "x"])).toEqual({
      registry: undefined,
      cli: "latest",
      help: false,
      forwarded: ["my-app", "--help", "--registry", "x"],
    });
  });

  it("refuses an option without its value", () => {
    expect(() => parseBootstrapArgs(["--registry"])).toThrow(BootstrapUsageError);
    expect(() => parseBootstrapArgs(["--cli", "--yes"])).toThrow("--cli needs a value");
    expect(() => parseBootstrapArgs(["--registry="])).toThrow("--registry needs a value");
  });

  it("refuses a --cli that is not a version or dist-tag", () => {
    expect(() => parseBootstrapArgs(["--cli", "file:../evil.tgz"])).toThrow(
      "--cli takes a version or dist-tag, not file:../evil.tgz",
    );
    expect(() => parseBootstrapArgs(["--cli=@other/pkg"])).toThrow(BootstrapUsageError);
  });
});
