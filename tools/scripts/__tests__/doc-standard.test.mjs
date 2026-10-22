/**
 * Stackra file contract:
 * Purpose: proves the doc-standard check (ADR 0007, amendment 2026-10-21) flags each rule it owns and accepts the
 *          forms the amendment allows. Each case is an inline source file, so the test needs no fixtures on disk.
 * Boundary: exercises checkFile and isInScope; it does not walk the repository.
 * Runtime: node
 * Governing contract: ADR 0007 (amendment 2026-10-21).
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { checkFile, isInScope } from "../doc-standard.mjs";

const HEADER = `/**
 * Stackra file contract:
 * Purpose: a fixture that exercises the check.
 * Boundary: none.
 * Runtime: node
 * Governing contract: ADR 0007.
 */
`;

const file = (body) => `${HEADER}${body}`;
const PATH = "packages/foundation/fixture/src/index.ts";

test("a documented export with documented members has no findings", () => {
  const text = file(`
import type { Thing } from "./thing";

/** Build a thing from its name. */
export function build(name: string): Thing {
  return { name };
}

/** A thing and its name. */
export interface Named {
  /** The display name, as the user typed it. */
  readonly name: string;
  /** Rename the thing; returns false and changes nothing when the name is unchanged. */
  rename(next: string): boolean;
}
`);
  assert.deepEqual(checkFile(PATH, text), []);
});

test("a missing or incomplete contract header is a finding", () => {
  const none = checkFile(PATH, `/** Build a thing from its name. */\nexport const x = 1;\n`);
  assert.match(none[0], /missing the Stackra file contract header/);
  const partial = checkFile(
    PATH,
    `/**\n * Stackra file contract:\n * Purpose: only one field.\n * Runtime: node\n */\n/** Make a thing here. */\nexport const x = 1;\n`,
  );
  assert.equal(partial.length, 1, "the header reports its first missing field");
  assert.match(partial[0], /no "Boundary:" field/);
});

test("a header whose Runtime is not one of the five values is a finding", () => {
  const text =
    HEADER.replace("Runtime: node", "Runtime: deno") +
    "/** Make a thing here. */\nexport const x = 1;\n";
  const findings = checkFile(PATH, text);
  assert.equal(findings.length, 1);
  assert.match(findings[0], /Runtime must be one of/);
});

test("a contract header does not count as the doc block of the first export", () => {
  const findings = checkFile(PATH, `${HEADER}export const first = 1;\n`);
  assert.equal(findings.length, 1);
  assert.match(findings[0], /export const first has no TSDoc block/);
});

test("an exported function or const without a block is a finding, with its line", () => {
  const findings = checkFile(PATH, file(`\nexport function bare(): void {}\n`));
  assert.equal(findings.length, 1);
  assert.match(findings[0], /:9: export bare has no TSDoc block/);
});

test("an interface property and a method signature each need a block", () => {
  const findings = checkFile(
    PATH,
    file(`
/** A named thing in the fixture. */
export interface Thing {
  name: string;
  /** Reset the thing to its initial state. */
  reset(): void;
  size(): number;
}
`),
  );
  assert.deepEqual(
    findings.map((f) => f.replace(/^.*: /, "")),
    ["Thing.name has no TSDoc block (ADR 0007)", "Thing.size has no TSDoc block (ADR 0007)"],
  );
});

test("a type-literal alias needs a block on each member, like an interface", () => {
  const findings = checkFile(
    PATH,
    file(`
/** Routes and their params. */
export type Routes = {
  Home: undefined;
};
`),
  );
  assert.equal(findings.length, 1);
  assert.match(findings[0], /Routes\.Home has no TSDoc block/);
});

test("public and protected class members need a block; private and #private members do not", () => {
  const findings = checkFile(
    PATH,
    file(`
/** A long-running service in the fixture. */
export class Service {
  /** The name the service reports. */
  readonly name = "x";
  protected count = 0;
  private secret = "s";
  #hidden = 1;
  /** Start the service. */
  start(): void {}
  stop(): void {}
}
`),
  );
  assert.deepEqual(
    findings.map((f) => f.replace(/^.*: /, "")),
    ["Service.count has no TSDoc block (ADR 0007)", "Service.stop has no TSDoc block (ADR 0007)"],
  );
});

test("a DI token needs a block that says what resolves to it and who provides it", () => {
  const bare = checkFile(
    PATH,
    file(`
/** The invoice repository. */
export const INVOICE_REPOSITORY = defineToken<InvoiceRepository>("billing.InvoiceRepository");
`),
  );
  assert.equal(bare.length, 1);
  assert.match(bare[0], /DI token whose TSDoc must say what resolves to it and who provides it/);

  const complete = checkFile(
    PATH,
    file(`
/** Resolves to the invoice repository; the billing module provides it. */
export const INVOICE_REPOSITORY = defineToken<InvoiceRepository>("billing.InvoiceRepository");
`),
  );
  assert.deepEqual(complete, []);

  const missing = checkFile(
    PATH,
    file(`
export const INVOICE_REPOSITORY = defineToken<InvoiceRepository>("billing.InvoiceRepository");
`),
  );
  assert.match(missing[0], /export const INVOICE_REPOSITORY has no TSDoc block/);
});

test("a type inside a doc tag is rejected, and a described parameter is accepted", () => {
  const typed = checkFile(
    PATH,
    file(`
/**
 * Scale a value.
 * @param {number} value - the input.
 * @returns {number} the product.
 */
export function scale(value: number): number {
  return value * 2;
}
`),
  );
  assert.equal(typed.length, 2);
  assert.match(typed[0], /@param \{ carries a type/);
  assert.match(typed[1], /@returns \{ carries a type/);

  const described = checkFile(
    PATH,
    file(`
/**
 * Scale a value.
 * @param value - the input, in metres.
 * @returns the product, in metres.
 */
export function scale(value: number): number {
  return value * 2;
}
`),
  );
  assert.deepEqual(described, []);
});

test("a block with no purpose sentence is a finding", () => {
  const findings = checkFile(PATH, file(`\n/** Thing. */\nexport const x = 1;\n`));
  assert.equal(findings.length, 1);
  assert.match(findings[0], /without a purpose sentence/);
});

test("a package name with an @ mid-sentence is prose, not a tag, so the summary still counts", () => {
  const findings = checkFile(
    PATH,
    file(`\n/** Uses @stackra/logger for output. */\nexport const x = 1;\n`),
  );
  assert.deepEqual(findings, []);
});

test("a tag at the start of a line ends the summary, so a tag-only block has no purpose sentence", () => {
  const findings = checkFile(
    PATH,
    file(`\n/**\n * Thing.\n * @remarks Long note here.\n */\nexport const x = 1;\n`),
  );
  assert.equal(findings.length, 1);
  assert.match(findings[0], /without a purpose sentence/);
});

test("a line comment between the block and the declaration keeps the block attached", () => {
  const findings = checkFile(
    PATH,
    file(`
/** Make the value once. */
// oxlint-disable-next-line some-rule -- reason
export const value = 1;
`),
  );
  assert.deepEqual(findings, []);
});

test("re-exports and default-less barrels need no block", () => {
  const findings = checkFile(
    PATH,
    file(`
export { build } from "./build";
export type { Thing } from "./thing";
export * from "./other";
`),
  );
  assert.deepEqual(findings, []);
});

test("isInScope governs src files of packages, services and apps only", () => {
  assert.equal(isInScope("packages/foundation/fixture/src/index.ts"), true);
  assert.equal(isInScope("services/health/src/health.module.ts"), true);
  assert.equal(isInScope("apps/mobile/src/app.tsx"), true);
  assert.equal(isInScope("packages/foundation/fixture/src/__tests__/index.test.ts"), false);
  assert.equal(isInScope("packages/foundation/fixture/src/types.d.ts"), false);
  assert.equal(isInScope("services/x/src/encore.gen/api.ts"), false);
  assert.equal(isInScope("tools/scripts/doc-standard.mjs"), false);
  assert.equal(isInScope("apps/docs/src/docs.json"), false);
});

test("a generated migration is skipped whole", () => {
  const text = `// generated by stackra db diff\nexport class Migration001 {}\n`;
  assert.deepEqual(checkFile("services/example/src/migrations/m1.migration.ts", text), []);
});

test("the generated-migration marker off a migration path still reports the missing header", () => {
  const text = `// generated by stackra db diff\nexport const x = 1;\n`;
  assert.ok(
    checkFile("packages/foundation/fixture/src/index.ts", text).some((f) =>
      /header|contract/i.test(f),
    ),
  );
});

test("the generated-migration marker on line 2 of a migration still reports", () => {
  const text = `// a comment\n// generated by stackra db diff\nexport class M {}\n`;
  assert.ok(checkFile("services/example/src/migrations/m1.migration.ts", text).length > 0);
});
