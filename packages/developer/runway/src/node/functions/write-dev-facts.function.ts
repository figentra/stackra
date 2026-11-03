/**
 * Stackra file contract:
 * Purpose: `writeDevFacts(root, lane)`, the writer `readDevFacts` reads back: computes each member runway's dev
 *          facts (`environments.dev` url, port, host, https and open, the Electron dev ports, every port shifted by
 *          `lane × lanes.portStep`; the TLS files the root's `environments.dev.https` names) and writes
 *          `.stackra/dev/ports.json` under `root`.
 * Boundary: node only; checks the document with `parseRunwayFacts` before writing, so a reader never sees a bad file.
 *           A member without a dev port is left out (it has no dev server). Infra ports are not written yet.
 * Runtime: node
 * Governing contract: ADR 0296 (decision 1), ADR 0295 (decision 5); STA-2029.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { DEV_FACTS_PATH } from "#core/constants/dev-facts-path.constant";
import { parseRunwayFacts } from "#core/functions/parse-runway-facts.function";
import type { RunwayFacts } from "#core/types/runway-facts.type";
import { readRunways } from "#node/functions/read-runways.function";

/** The dev block fields this reads, from a runway parsed as plain YAML. */
type DevBlock = {
  port?: number;
  host?: string;
  https?: boolean;
  open?: boolean;
  desktop?: { devtools?: boolean; remoteDebugPort?: number; pkceLoopbackPort?: number };
};

/**
 * Writes the dev facts of the repository at `root` for `lane`; returns them.
 *
 * @param root - the repository root.
 * @param lane - the dev lane, 0 by default.
 * @example
 * writeDevFacts("/work/acme", 1); // console on 5183 with `portStep: 10`
 */
export function writeDevFacts(root: string, lane = 0): RunwayFacts {
  const { root: rootRunway, members } = readRunways(root);
  const dev = (
    rootRunway.environments as
      | Record<
          string,
          {
            lanes?: { enabled?: boolean; portStep?: number };
            https?: { cert?: string; key?: string };
          }
        >
      | undefined
  )?.["dev"];
  const step = dev?.lanes?.enabled === false ? 0 : (dev?.lanes?.portStep ?? 0);
  const shift = (port: number | undefined) => (port === undefined ? undefined : port + lane * step);
  const cert = dev?.https?.cert;
  const key = dev?.https?.key;

  const entries = members.flatMap(({ member, runway }) => {
    const env = (runway as { environments?: { dev?: DevBlock } }).environments?.dev;
    const port = shift(env?.port);
    if (env === undefined || port === undefined) return [];
    const host = env.host ?? "localhost";
    const https = env.https === true;
    return [
      [
        member,
        {
          url: `${https ? "https" : "http"}://${host}:${port}`,
          port,
          host,
          https,
          open: env.open === true,
          ...(https && cert !== undefined && key !== undefined ? { tls: { cert, key } } : {}),
          desktop: {
            ...(env.desktop?.devtools === undefined ? {} : { devtools: env.desktop.devtools }),
            ...(env.desktop?.remoteDebugPort === undefined
              ? {}
              : { remoteDebugPort: shift(env.desktop.remoteDebugPort) }),
            ...(env.desktop?.pkceLoopbackPort === undefined
              ? {}
              : { pkceLoopbackPort: shift(env.desktop.pkceLoopbackPort) }),
          },
        },
      ],
    ];
  });

  const file = join(root, DEV_FACTS_PATH);
  const facts = parseRunwayFacts(
    { version: 1, environment: "dev", lane, members: Object.fromEntries(entries) },
    file,
  );
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(facts, null, 2)}\n`);
  return facts;
}
