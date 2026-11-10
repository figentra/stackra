/**
 * Stackra file contract:
 * Purpose: `DevSecretsInitCommand`, `stackra dev secrets init [--rotate] [--from <file>]`: writes a random dev value
 *          for every required secret the workspace's running members declare to `.stackra/dev-secrets.json` (mode
 *          600), which `stackra dev` adds to each member's environment. It lists the names that need a value someone
 *          sets (a connection string, the relay's key pair) and leaves optional ones unset. An existing file only gains
 *          its missing names; with none missing it refuses unless `--rotate`, which regenerates every generated name.
 *          `--from` copies matching names from another repository's file, so a shared name holds one value.
 * Boundary: dev only. It prints names and counts, never a value, and nothing from sops: real values stay in
 *           `figentra/secrets` and reach deployed runtimes through runway.
 * Runtime: node
 * Governing contract: ADR 0525 (amendment of 2026-11-10); STA-2664 (item 4); STA-2679.
 */
import { randomBytes } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { Command, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { DEV_SECRETS_FILE } from "#node/dev-secrets/constants/dev-secrets-file.constant";
import { classifyDevSecrets } from "#node/dev-secrets/functions/classify-dev-secrets.function";
import { declaredDevSecrets } from "#node/dev-secrets/functions/declared-dev-secrets.function";
import { planDevSecrets } from "#node/dev-secrets/functions/plan-dev-secrets.function";
import { readDevSecrets } from "#node/dev-secrets/functions/read-dev-secrets.function";
import { CliUsageError } from "#node/errors/cli-usage.error";
import { workspaceRoot } from "#node/functions/workspace-root.function";

/** Writes the workspace's generated dev secret values. */
export class DevSecretsInitCommand extends Command({
  name: "dev:secrets:init",
  description:
    "Generate dev values for the secrets the workspace declares (.stackra/dev-secrets.json)",
  bin: true,
}) {
  /** Regenerate every generated value. */
  @Option({ description: "Regenerate every generated value; names set by hand stay" })
  rotate = false;

  /** Another repository's dev-secrets file. */
  @Option({ description: "Copy matching names from another repository's dev-secrets file" })
  @Str
  from?: string;

  /** Writes the file and lists the names, never a value. */
  async handle(io: CommandIo): Promise<Readonly<Record<string, unknown>>> {
    const root = workspaceRoot(io.cwd);
    if (!existsSync(join(root, "pnpm-workspace.yaml")))
      throw new CliUsageError("run stackra dev secrets init inside a pnpm workspace");
    const names = classifyDevSecrets(declaredDevSecrets(root));
    const file = join(root, DEV_SECRETS_FILE);
    const from = this.from === undefined ? undefined : readDevSecrets(resolve(io.cwd, this.from));
    if (this.from !== undefined && from === undefined)
      throw new CliUsageError(`--from ${this.from}: no such file`);
    const plan = planDevSecrets({
      generate: names.generate,
      existing: readDevSecrets(file),
      from,
      rotate: this.rotate,
      random: () => randomBytes(32).toString("base64url"),
    });
    if (plan.refused)
      throw new CliUsageError(
        `${DEV_SECRETS_FILE} already holds every generated name; --rotate regenerates them`,
      );
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, `${JSON.stringify(plan.values, null, 2)}\n`, { mode: 0o600 });
    // the mode of writeFileSync applies only to a new file
    chmodSync(file, 0o600);
    io.output.success(
      `${DEV_SECRETS_FILE}: ${plan.generated.length} generated, ${plan.copied.length} copied`,
    );
    io.output.list([...plan.generated, ...plan.copied]);
    if (names.needsValue.length > 0) {
      io.output.info(
        `needs a value (a connection string or a key pair; set it in ${DEV_SECRETS_FILE} or let the dev compose provide it):`,
      );
      io.output.list(names.needsValue);
    }
    if (names.optional.length > 0)
      io.output.info(`${names.optional.length} optional, left unset: ${names.optional.join(", ")}`);
    return {
      file: DEV_SECRETS_FILE,
      generated: plan.generated,
      copied: plan.copied,
      needsValue: names.needsValue,
      optional: names.optional,
    };
  }
}
