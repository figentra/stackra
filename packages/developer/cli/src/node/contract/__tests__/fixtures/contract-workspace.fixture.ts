/**
 * Stackra file contract:
 * Purpose: test fixtures of the contract check: `contractManifest`, a member manifest whose actions project to HTTP
 *          operations, and `contractWorkspace`, a throwaway git workspace (`pnpm-workspace.yaml` naming `services/*`)
 *          to commit manifests in and change afterwards.
 * Boundary: test only; writes under the OS temp directory and runs `git` there.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0182 (decision 4); STA-2837.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import type { StackraManifest } from "@stackra/contracts";

/** One action of a fixture manifest: its endpoint and the input fields it takes. */
export type FixtureAction = {
  readonly key: string;
  readonly method: string;
  readonly path: string;
  readonly fields?: readonly string[];
  readonly required?: readonly string[];
  /** The input schema as written, instead of one built from `fields` (a `$ref` to another package's shape). */
  readonly input?: Readonly<Record<string, unknown>>;
};

/**
 * A manifest for `member` (package `@acme/service-<member>`) whose actions are `actions` and shapes `schemas`.
 *
 * @example
 * contractManifest("billing", [{ key: "billing.invoice.void", method: "POST", path: "/app/invoices/:invoiceId/void" }]);
 */
export function contractManifest(
  member: string,
  actions: readonly FixtureAction[],
  schemas: Readonly<Record<string, unknown>> = {},
): StackraManifest {
  return {
    member,
    package: `@acme/service-${member}`,
    version: "1.0.0",
    schemas,
    actions: actions.map(({ key, method, path, fields = [], required = [], input }) => ({
      key,
      class: "FixtureAction",
      module: member,
      permission: key,
      risk: "L1",
      endpoint: { method, path },
      input: input ?? {
        type: "object",
        properties: Object.fromEntries(fields.map((field) => [field, { type: "string" }])),
        required: [...required],
      },
    })),
  } as unknown as StackraManifest;
}

/** A throwaway git workspace. */
export type ContractWorkspace = {
  /** The workspace root. */
  readonly root: string;

  /** Writes a file, creating its folders; a manifest object is written as JSON. */
  readonly write: (path: string, content: string | StackraManifest) => void;

  /** Removes a file. */
  readonly remove: (path: string) => void;

  /** Commits everything and returns the commit id. */
  readonly commit: (message: string) => string;

  /** Deletes the workspace. */
  readonly dispose: () => void;
};

/**
 * A new git workspace whose `pnpm-workspace.yaml` names `services/*`.
 *
 * @example
 * const workspace = contractWorkspace();
 * workspace.write("services/billing/stackra.manifest.json", contractManifest("billing", []));
 * const base = workspace.commit("base");
 */
export function contractWorkspace(): ContractWorkspace {
  const root = mkdtempSync(join(tmpdir(), "stackra-contract-ws-"));
  const git = (...args: string[]): string =>
    execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  git("init", "-q", "-b", "main");
  git("config", "user.email", "fixture@example.com");
  git("config", "user.name", "fixture");
  git("config", "commit.gpgsign", "false");
  const write = (path: string, content: string | StackraManifest): void => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(
      join(root, path),
      typeof content === "string" ? content : JSON.stringify(content, null, 2),
    );
  };
  write("pnpm-workspace.yaml", "packages:\n  - services/*\n");
  return {
    root,
    write,
    remove: (path) => rmSync(join(root, path)),
    commit: (message) => {
      git("add", "-A");
      git("commit", "-q", "--no-verify", "-m", message);
      return git("rev-parse", "HEAD").trim();
    },
    dispose: () => rmSync(root, { recursive: true, force: true }),
  };
}
