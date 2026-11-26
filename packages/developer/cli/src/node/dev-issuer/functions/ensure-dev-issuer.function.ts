/**
 * Stackra file contract:
 * Purpose: `ensureDevIssuer(root)`, a workspace's dev sign-in (STA-2795): the content of `.stackra/dev-issuer.json`,
 *          written the first time (a new ES256 key pair from `createDevIssuerKey` and a seeded dev user with a fresh
 *          `usr_` id) with mode 600, then read back unchanged on every later call, so tokens minted earlier keep
 *          verifying across `stackra dev` restarts.
 * Boundary: dev only: reads and writes that one file, never prints the private key. A file that is not a dev issuer
 *           state (bad JSON, no ES256 private key with a `kid`, a public half that is not its pair's or holds a
 *           private member, no `usr_` user) throws naming the file and how to reset it, never a value.
 * Runtime: node
 * Governing contract: ADR 0206 (amendment of 2026-11-26: the dev issuer); STA-2795.
 */
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { createDevIssuerKey } from "@stackra/app";
import { mintPublicId } from "@stackra/contracts";
import { publicId } from "@stackra/validation";

import { DEV_ISSUER_FILE } from "#node/dev-issuer/constants/dev-issuer-file.constant";
import type { DevIssuerState } from "#node/dev-issuer/types/dev-issuer-state.type";

/** Whether `value` is a dev issuer state with a matching ES256 pair and a `usr_` user. */
function isState(value: unknown): value is DevIssuerState {
  const state = value as Partial<DevIssuerState> | null;
  const key = state?.key;
  const user = state?.user;
  return (
    typeof key?.privateKey === "object" &&
    typeof key.publicKey === "object" &&
    key.privateKey.kty === "EC" &&
    key.privateKey.crv === "P-256" &&
    typeof key.privateKey.d === "string" &&
    typeof key.privateKey.kid === "string" &&
    key.publicKey.kid === key.privateKey.kid &&
    key.publicKey.x === key.privateKey.x &&
    key.publicKey.y === key.privateKey.y &&
    !Object.hasOwn(key.publicKey, "d") &&
    typeof user?.name === "string" &&
    typeof user.email === "string" &&
    publicId("usr").safeParse(user.id).success
  );
}

/**
 * The dev sign-in of the workspace at `root`, made on first use.
 *
 * @param root - the workspace root.
 * @throws Error when the file exists but is not a dev issuer state.
 * @example
 * const { key, user } = await ensureDevIssuer(workspaceRoot(cwd));
 */
export async function ensureDevIssuer(root: string): Promise<DevIssuerState> {
  const file = join(root, DEV_ISSUER_FILE);
  if (existsSync(file)) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(file, "utf8"));
    } catch {
      parsed = undefined;
    }
    if (!isState(parsed))
      throw new Error(
        `${DEV_ISSUER_FILE} is not a dev sign-in; delete it and run stackra dev again to make a new one`,
      );
    return parsed;
  }
  const state: DevIssuerState = {
    key: await createDevIssuerKey(),
    user: { id: mintPublicId("usr"), name: "Dev User", email: "dev@example.test" },
  };
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
  // the mode of writeFileSync applies only to a new file
  chmodSync(file, 0o600);
  return state;
}
