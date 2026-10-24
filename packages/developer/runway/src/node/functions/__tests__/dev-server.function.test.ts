/**
 * Stackra file contract:
 * Purpose: unit tests of `devServer`: the Vite server block from the dev facts (strict port, HMR on the next port,
 *          `open`), the TLS key pair read from the files the facts name when the member serves https, and the
 *          failures for no dev facts, a member without a dev port and https without TLS files.
 * Boundary: test only; writes a throwaway repository in the OS temp directory and points `process.cwd()` at a member
 *           inside it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decision 1); ADR 0295 (decision 5).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "@stackra/testing";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { devServer } from "#node/functions/dev-server.function";

let repository: string;

beforeEach(() => {
  repository = mkdtempSync(join(tmpdir(), "stackra-runway-"));
  mkdirSync(join(repository, "apps", "web"), { recursive: true });
  vi.spyOn(process, "cwd").mockReturnValue(join(repository, "apps", "web"));
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(repository, { recursive: true, force: true });
});

/** Writes the dev facts with the given members. */
function writeDevFacts(members: Record<string, unknown>): void {
  mkdirSync(join(repository, ".stackra", "dev"), { recursive: true });
  writeFileSync(
    join(repository, ".stackra", "dev", "ports.json"),
    JSON.stringify({ version: 1, members }),
  );
}

describe("devServer", () => {
  it("returns the member's server block with a strict port and HMR on the next port", () => {
    writeDevFacts({ web: { url: "http://localhost:5175", port: 5175, host: "localhost" } });

    expect(devServer("web")).toEqual({
      port: 5175,
      host: "localhost",
      strictPort: true,
      open: false,
      hmr: { port: 5176 },
    });
  });

  it("reads the TLS key pair when the member serves https", () => {
    writeFileSync(join(repository, "cert.pem"), "CERT");
    writeFileSync(join(repository, "key.pem"), "KEY");
    writeDevFacts({
      web: {
        url: "https://web.localhost:5175",
        port: 5175,
        host: "web.localhost",
        https: true,
        open: true,
        tls: { cert: join(repository, "cert.pem"), key: join(repository, "key.pem") },
      },
    });

    const server = devServer("web");
    expect(server.open).toBe(true);
    expect(server.https?.cert.toString()).toBe("CERT");
    expect(server.https?.key.toString()).toBe("KEY");
  });

  it("fails without dev facts, without a dev port, or for https without TLS files", () => {
    expect(() => devServer("web")).toThrow(/run `stackra dev`/);

    writeDevFacts({
      web: {},
      docs: { url: "https://localhost:3333", port: 3333, host: "localhost", https: true },
    });
    expect(() => devServer("web")).toThrow(RunwayUnresolvedError);
    expect(() => devServer("docs")).toThrow(/no TLS files/);
  });
});
