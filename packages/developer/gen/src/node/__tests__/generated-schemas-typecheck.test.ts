/**
 * Stackra file contract:
 * Purpose: the typecheck test of what gen writes (STA-1605): the `shop` fixture package, plus a schema whose
 *          initializers are object, record and array literals with codes and a duration, runs through `generate`,
 *          and a TypeScript program over its generated schemas and wiring, under the fixture's strict tsconfig,
 *          reports nothing in a generated file or in the schema's own sources. Before STA-1605 the object default widened its codes to
 *          `string` (TS2769), the hatch's `X$Check` failed on a nested duration, and nothing ever typechecked
 *          generated code, so a member found out only when the presets started including it.
 * Boundary: test only; writes the fixture under `.cache/` (gitignored) and reads it with gen's own `typescript6`.
 *           zod resolves through `@stackra/validation`, linked into the fixture, since gen does not depend on it. The
 *           shop fixture's stand-in packages (actions, events) are typed loosely, so its own action and event files
 *           are not the subject: only diagnostics in `.stackra/gen` and in the display sources count.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 26: the shape compiler and its `X$Check`);
 *                     STA-1605.
 */
import { mkdirSync, readdirSync, readFileSync, realpathSync, symlinkSync } from "node:fs";
import { createRequire } from "node:module";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "@stackra/testing";
import type * as TypeScript from "typescript6";

import { SHOP_SOURCES } from "#node/__tests__/fixtures/shop-sources.fixture";
import { writeFixtureMember } from "#node/__tests__/fixtures/write-fixture-member";
import { generate } from "#node/functions/generate.function";

/** A schema whose initializers are the literals gen used to emit badly: nested codes, a record, a duration. */
const DISPLAY_SOURCES: Readonly<Record<string, string>> = {
  "src/core/constants/display-schema.constant.ts": [
    'import { duration } from "@stackra/validation";',
    'import { z } from "zod";',
    "",
    "/** The shipped rules of the display options' nested fields. */",
    "export const DISPLAY_SCHEMA = z.object({",
    '  card: z.object({ statuses: z.array(z.enum(["pending", "paid", "cancelled"])), width: z.number().int() }),',
    '  flow: z.record(z.string(), z.enum(["bff", "pkce"])),',
    "  health: z.object({ timeout: z.string().transform(duration), critical: z.boolean() }),",
    "});",
    "",
  ].join("\n"),
  "src/core/schemas/display-options.schema.ts": [
    'import { Duration } from "@stackra/contracts";',
    'import { Field, Schema } from "@stackra/validation";',
    "",
    'import { OrderStatus } from "#contracts/enums/order-status.enum";',
    'import { DISPLAY_SCHEMA } from "#core/constants/display-schema.constant";',
    "",
    "export class DisplayOptions extends Schema {",
    "  // reason: an inline object an override assigns whole; the shipped schema checks its codes",
    "  @Field(DISPLAY_SCHEMA.shape.card)",
    "  card: { statuses: OrderStatus[]; width: number } = {",
    "    statuses: [OrderStatus.Pending, OrderStatus.Paid],",
    "    width: 1200,",
    "  };",
    "",
    "  // reason: a map of codes by client; the shipped schema checks each value",
    "  @Field(DISPLAY_SCHEMA.shape.flow)",
    '  flow: Record<string, "bff" | "pkce"> = { web: "bff", ios: "pkce" };',
    "",
    "  // reason: a nested option with a duration; the shipped schema reads its ISO 8601 text",
    "  @Field(DISPLAY_SCHEMA.shape.health)",
    "  health: { timeout: Duration; critical: boolean } = { timeout: Duration.seconds(2), critical: true };",
    "",
    "  statuses: OrderStatus[] = [OrderStatus.Pending];",
    "}",
    "",
  ].join("\n"),
};

/** Every `.ts` file under `folder`, recursively. */
function tsFiles(folder: string): string[] {
  return readdirSync(folder, { recursive: true, encoding: "utf8" })
    .filter((path) => path.endsWith(".ts"))
    .map((path) => join(folder, path));
}

/** The files whose diagnostics count: what gen wrote, and the display schema's own sources. */
const SUBJECT = /^(?:\.stackra\/gen\/|src\/core\/(?:constants|schemas)\/display-)/;

/** Links the zod that `@stackra/validation` uses into `root`'s node_modules, so the program resolves `zod`. */
function linkZod(root: string): void {
  const validation = fileURLToPath(
    new URL("../../../node_modules/@stackra/validation/", import.meta.url),
  );
  const zod = realpathSync(join(validation, "node_modules", "zod"));
  mkdirSync(join(root, "node_modules"), { recursive: true });
  symlinkSync(zod, join(root, "node_modules", "zod"), "dir");
}

describe("generated schemas typecheck (STA-1605)", () => {
  it("writes schemas, with object, record and duration defaults, that typecheck beside their sources", async () => {
    const root = writeFixtureMember("shop", { ...SHOP_SOURCES, ...DISPLAY_SOURCES });
    linkZod(root);
    const result = await generate(root);
    expect(result.errors).toEqual([]);
    const schemas = tsFiles(join(root, ".stackra", "gen", "schemas"));

    const ts = createRequire(import.meta.url)("typescript6") as typeof TypeScript;
    const config = ts.readConfigFile(join(root, "tsconfig.json"), (path) => ts.sys.readFile(path));
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
    // The wiring's `DriverRegistry` augmentation types the `DriverName` default of the shop's options.
    const program = ts.createProgram({
      rootNames: [...schemas, join(root, ".stackra", "gen", "wiring.ts")],
      options: parsed.options,
    });
    const diagnostics = ts
      .getPreEmitDiagnostics(program)
      .map((diagnostic) => {
        const file = diagnostic.file === undefined ? "" : relative(root, diagnostic.file.fileName);
        const line =
          diagnostic.file === undefined
            ? 0
            : diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start ?? 0).line + 1;
        return {
          file,
          text: `${file}(${line}): TS${diagnostic.code} ${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`,
        };
      })
      .filter(({ file }) => file === "" || SUBJECT.test(file))
      .map(({ text }) => text);
    expect(diagnostics).toEqual([]);

    // The check ran over the display schema: its literal defaults go through `withDefault`, typed by the output.
    const display = schemas
      .map((file) => readFileSync(file, "utf8"))
      .find((content) => content.includes("export const DisplayOptions$"));
    expect(display).toContain("withDefault(DISPLAY_SCHEMA.shape.card)");
    expect(display).toContain("export type DisplayOptions$Check");
  }, 120_000);
});
