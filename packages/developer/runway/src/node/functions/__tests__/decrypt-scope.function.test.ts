/**
 * Stackra file contract:
 * Purpose: unit tests of `decryptScope` and `exportToGithubEnv`: a scope's files decrypt through sops into a map by
 *          name, or only the names asked for; a bad scope, a missing name, a refused key and a file that holds another
 *          name fail with fixed messages that never carry a value; the export masks every line of a value before it
 *          appends a delimited block, and refuses to run without an environment file.
 * Boundary: test only; a temporary folder and a fake sops runner, so nothing decrypts for real.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0525.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { decryptScope } from "#node/functions/decrypt-scope.function";
import { exportToGithubEnv } from "#node/functions/export-to-github-env.function";
import type { CommandRunner } from "#node/types/command-runner.type";

/** A canary that must never appear in a message. */
const CANARY = "canary-value-7f3a";

/** A folder holding `scope` with one empty ciphertext file per name. */
function ciphertext(scope: string, names: readonly string[]): string {
  const dir = mkdtempSync(join(tmpdir(), "runway-decrypt-"));
  mkdirSync(join(dir, scope), { recursive: true });
  for (const name of names) writeFileSync(join(dir, scope, `${name}.enc.yaml`), "sops: {}\n");
  return dir;
}

/** A fake sops that answers `{ NAME: "<name>-canary" }` for each file. */
const sops: CommandRunner = async (_command, args) => {
  const name = basename(args.at(-1) ?? "").replace(".enc.yaml", "");
  return JSON.stringify({ [name]: `${name}-${CANARY}` });
};

describe("decryptScope", () => {
  it("decrypts every name of the scope, or only the names asked for", async () => {
    const dir = ciphertext("ci/build/registry", ["STACKRA_REGISTRY_TOKEN", "OTHER_TOKEN"]);
    const all = await decryptScope({ dir, scope: "ci/build/registry", run: sops });
    expect([...all.keys()]).toEqual(["OTHER_TOKEN", "STACKRA_REGISTRY_TOKEN"]);
    const one = await decryptScope({
      dir,
      scope: "ci/build/registry",
      names: ["STACKRA_REGISTRY_TOKEN"],
      run: sops,
    });
    expect(one.get("STACKRA_REGISTRY_TOKEN")).toBe(`STACKRA_REGISTRY_TOKEN-${CANARY}`);
  });

  it("refuses a bad scope, a missing name, a refused key and a file holding another name, without a value", async () => {
    const dir = ciphertext("ci/deploy", ["CLOUDFLARE_API_TOKEN"]);
    const messages: string[] = [];
    const attempt = async (input: Parameters<typeof decryptScope>[0]) => {
      try {
        await decryptScope(input);
      } catch (error) {
        messages.push(String(error));
      }
    };
    await attempt({ dir, scope: "ci/../agents", run: sops });
    await attempt({ dir, scope: "ci/deploy", names: ["MISSING_TOKEN"], run: sops });
    await attempt({
      dir,
      scope: "ci/deploy",
      run: async () => {
        throw new Error(`PERMISSION_DENIED ${CANARY}`);
      },
    });
    await attempt({ dir, scope: "ci/deploy", run: async () => JSON.stringify({ OTHER: CANARY }) });
    expect(messages).toHaveLength(4);
    expect(messages[1]).toContain("has no MISSING_TOKEN");
    expect(messages[2]).toContain("may not decrypt ci/deploy");
    expect(messages[3]).toContain("does not hold its own name");
    for (const message of messages) expect(message).not.toContain(CANARY);
  });
});

describe("exportToGithubEnv", () => {
  it("masks every line before it appends a delimited block", () => {
    const events: string[] = [];
    const names = exportToGithubEnv(
      new Map([
        ["B_KEY", "line-one\nline-two"],
        ["A_TOKEN", "solo"],
      ]),
      {
        envFile: "/tmp/github-env",
        mask: (line) => events.push(`mask:${line}`),
        append: (_file, text) => events.push(`append:${text.split("\n")[0]?.split("<<")[0]}`),
      },
    );
    expect(names).toEqual(["A_TOKEN", "B_KEY"]);
    expect(events).toEqual([
      "mask:solo",
      "append:A_TOKEN",
      "mask:line-one",
      "mask:line-two",
      "append:B_KEY",
    ]);
  });

  it("refuses to run without an environment file", () => {
    expect(() => exportToGithubEnv(new Map([["A_TOKEN", CANARY]]), { envFile: undefined })).toThrow(
      /no GITHUB_ENV/,
    );
  });
});
