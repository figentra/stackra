/**
 * Stackra file contract:
 * Purpose: unit tests of `openHost`, `openTsgoHost` and `openTs6Host`: both backends open a member's program, list the
 *          same own files, name kinds alike, read positions and symbols through import aliases, and close.
 * Boundary: test only; writes a small fixture under `.cache/`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 26); ADR 0305 (rule 45).
 */
import { join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { openHost } from "#node/functions/open-host.function";
import { openTs6Host } from "#node/functions/open-ts6-host.function";
import { openTsgoHost } from "#node/functions/open-tsgo-host.function";
import type { TsHost } from "#node/types/ts-host.type";
import { writeFixtureMember } from "#node/__tests__/fixtures/write-fixture-member";

/** What a host reports about the fixture. */
function report(host: TsHost, root: string): unknown {
  const own = host.files().filter((file) => (file.fileName ?? "").startsWith(`${root}/src/`));
  const [file] = own;
  const statement = file?.statements?.find(
    (candidate) => host.kind(candidate) === "ClassDeclaration",
  );
  const heritage = statement?.heritageClauses?.[0]?.types?.[0]?.expression;
  const symbol = heritage === undefined ? undefined : host.symbolAt(heritage);
  return {
    files: own.map((candidate) => candidate.fileName),
    kind: statement === undefined ? undefined : host.kind(statement),
    name: statement?.name === undefined ? undefined : host.text(statement.name),
    position: statement === undefined ? undefined : host.position(statement),
    base: symbol === undefined ? undefined : host.symbolName(symbol),
  };
}

describe("openHost", async () => {
  const root = writeFixtureMember("hosts", {
    "src/core/services/ping.service.ts": [
      'import { Service as Base } from "@stackra/container";',
      "",
      "export class PingService extends Base {}",
      "",
    ].join("\n"),
  });
  const tsconfig = join(root, "tsconfig.json");

  it("answers alike on TypeScript 7 and TypeScript 6", async () => {
    const go = await openTsgoHost(tsconfig);
    const six = openTs6Host(tsconfig);
    try {
      expect(report(go, root)).toEqual(report(six, root));
      expect(report(six, root)).toEqual({
        files: [join(root, "src/core/services/ping.service.ts")],
        kind: "ClassDeclaration",
        name: "PingService",
        position: { line: 3, column: 1 },
        base: "Service",
      });
    } finally {
      go.close();
      six.close();
    }
  });

  it("opens the TypeScript 7 host by default and TypeScript 6 on request", async () => {
    const preferred = await openHost(tsconfig);
    const fallback = await openHost(tsconfig, "ts6");
    expect(preferred.name).toMatch(/typescript/);
    expect(fallback.name).toMatch(/^typescript 6\./);
    preferred.close();
    fallback.close();
  });
});
