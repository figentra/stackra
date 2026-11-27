/**
 * Stackra file contract:
 * Purpose: unit tests of `ensureDevIssuer`: the first call writes `.stackra/dev-issuer.json` with mode 600, an ES256
 *          pair and a seeded `usr_` dev user; a later call reads the same state back; a file that is not a dev sign-in
 *          (bad JSON, a public half that is not its pair's or that holds the private member, no `usr_` user) throws
 *          naming the file and the reset, never a value.
 * Boundary: test only; the workspace root is a temporary folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0206 (amendment of 2026-11-26: the dev issuer); STA-2795.
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createDevIssuerKey } from "@stackra/app";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { ensureDevIssuer } from "#node/dev-issuer/functions/ensure-dev-issuer.function";

let root = "";
const file = () => join(root, ".stackra", "dev-issuer.json");

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-dev-issuer-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe(ensureDevIssuer, () => {
  it("makes the dev sign-in once, mode 600, and reads it back unchanged", async () => {
    const made = await ensureDevIssuer(root);
    expect(made.user.id).toMatch(/^usr_[0-9a-z]{26}$/i);
    expect(made.key.publicKey.kid).toBe(made.key.privateKey.kid);
    expect(made.key.publicKey).not.toHaveProperty("d");
    expect(statSync(file()).mode & 0o777).toBe(0o600);
    expect(await ensureDevIssuer(root)).toEqual(made);
    expect(JSON.parse(readFileSync(file(), "utf8"))).toEqual(made);
  });

  it("refuses a file that is not a dev sign-in, naming the reset and no value", async () => {
    const good = await ensureDevIssuer(root);
    const other = await createDevIssuerKey();
    const broken = [
      "{not json",
      JSON.stringify({ ...good, key: { ...good.key, publicKey: other.publicKey } }),
      JSON.stringify({ ...good, key: { ...good.key, publicKey: good.key.privateKey } }),
      JSON.stringify({ ...good, user: { ...good.user, id: "admin" } }),
    ];
    for (const text of broken) {
      mkdirSync(join(root, ".stackra"), { recursive: true });
      writeFileSync(file(), text);
      const failure = await ensureDevIssuer(root).then(
        () => undefined,
        (error: unknown) => error as Error,
      );
      expect(failure?.message).toContain(".stackra/dev-issuer.json is not a dev sign-in");
      expect(failure?.message).not.toContain(String(good.key.privateKey.d));
    }
  });
});
