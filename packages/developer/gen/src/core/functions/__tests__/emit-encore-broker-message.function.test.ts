/**
 * Stackra file contract:
 * Purpose: unit tests of `emitEncoreBrokerMessage`: a service whose generated Encore files import the local
 *          `BrokerMessage` gets `broker-message.ts` beside them, nothing else does, and the declaration has exactly
 *          the members of `@stackra/queue`'s `BrokerMessage` (the drift guard).
 * Boundary: test only; runs on the IR fixtures, and reads `@stackra/queue`'s type source from disk to compare.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0148 (decision 3: Encore Pub/Sub).
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "@stackra/testing";
import ts from "typescript6";

import { buildManifest } from "#core/functions/build-manifest.function";
import { emitEncoreBrokerMessage } from "#core/functions/emit-encore-broker-message.function";
import { emitEncoreQueues } from "#core/functions/emit-encore-queues.function";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";
import type { GeneratedFile } from "#core/types/generated-file.type";

const ROOT = new URL("../../../../../../../", import.meta.url);
const QUEUE_TYPE = new URL(
  "packages/runtime/queue/src/contracts/types/broker-message.type.ts",
  ROOT,
);

/** Each member of the `BrokerMessage` interface in `source`, as `readonly name?: type`. */
const membersOf = (source: string): string[] => {
  const sf = ts.createSourceFile("x.ts", source, ts.ScriptTarget.Latest, true);
  const found = sf.statements.find(
    (node): node is ts.InterfaceDeclaration =>
      ts.isInterfaceDeclaration(node) && node.name.text === "BrokerMessage",
  );
  if (found === undefined) throw new Error("no BrokerMessage interface");
  return found.members.filter(ts.isPropertySignature).map((member) => {
    const readonly =
      member.modifiers?.some((m) => m.kind === ts.SyntaxKind.ReadonlyKeyword) === true;
    const optional = member.questionToken === undefined ? "" : "?";
    return `${readonly ? "readonly " : ""}${member.name.getText(sf)}${optional}: ${member.type?.getText(sf) ?? ""}`;
  });
};

describe("emitEncoreBrokerMessage", () => {
  const queues = emitEncoreQueues(BILLING_IR, buildManifest(BILLING_IR).manifest);
  const files: GeneratedFile[] = queues === undefined ? [] : [queues];

  it("writes broker-message.ts beside the generated files that import it", () => {
    const file = emitEncoreBrokerMessage(BILLING_IR, files);
    expect(file?.path).toBe(".stackra/encore/billing/broker-message.ts");
    expect(file?.content).toContain("export interface BrokerMessage {");
  });

  it("writes nothing when no generated file imports it, or for an app", () => {
    expect(emitEncoreBrokerMessage(BILLING_IR, [])).toBeUndefined();
    expect(emitEncoreBrokerMessage(WEB_APP_IR, files)).toBeUndefined();
  });

  it("declares exactly the members of @stackra/queue's BrokerMessage", () => {
    const emitted = emitEncoreBrokerMessage(BILLING_IR, files)?.content ?? "";
    expect(membersOf(emitted)).toEqual(membersOf(readFileSync(QUEUE_TYPE, "utf8")));
    expect(membersOf(emitted)).toEqual(["readonly id: string", "readonly body: unknown"]);
  });
});
