/**
 * Stackra file contract:
 * Purpose: unit tests of `encoreTsconfig`: a tsconfig that only extends a preset gets `compilerOptions.paths` with
 *          each package.json `imports` key and its first target (what Encore 1.58 reads; it ignores `imports`), an
 *          old `baseUrl` goes, the header comments stay, and a second pass changes nothing (STA-2794).
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0091 (decision 2, amendment of 2026-11-09); STA-2794.
 */
import { describe, expect, it } from "@stackra/testing";

import { encoreTsconfig } from "#node/encore/functions/encore-tsconfig.function";

/** The imports `stackra new service` and the starter's example service declare: arrays of fallbacks. */
const IMPORTS = {
  "#src/*": ["./src/*", "./src/*.ts", "./src/*.tsx", "./src/*/index.ts"],
  "#modules/*": ["./src/modules/*", "./src/modules/*.ts"],
  "#assets/*": "./assets/*",
  "#node": { node: "./node.js" },
};

const HEADER =
  "// TypeScript project for this member.\n// Owner: release-operations · Secrets: forbidden\n";

describe("encoreTsconfig", () => {
  it("adds the paths Encore reads to a tsconfig that only extends a preset", () => {
    const text = encoreTsconfig(
      `${HEADER}{ "extends": "@stackra/typescript-config/service" }\n`,
      IMPORTS,
    );
    expect(text.startsWith(HEADER)).toBe(true);
    expect(JSON.parse(text.replaceAll(/^\/\/.*\n/gm, ""))).toEqual({
      extends: "@stackra/typescript-config/service",
      compilerOptions: {
        // the first `./` target of each key; a conditional target has no path form
        paths: {
          "#src/*": ["./src/*"],
          "#modules/*": ["./src/modules/*"],
          "#assets/*": ["./assets/*"],
        },
      },
    });
    expect(encoreTsconfig(text, IMPORTS)).toBe(text);
  });

  it("drops a baseUrl, keeps other options, and writes a tsconfig for a service without one", () => {
    const text = encoreTsconfig(
      '{ "extends": "x", "compilerOptions": { "baseUrl": ".", "strict": true, "paths": { "#old/*": ["./old/*"] } } }',
      { "#src/*": "./src/*" },
    );
    expect(JSON.parse(text)).toEqual({
      extends: "x",
      compilerOptions: { strict: true, paths: { "#src/*": ["./src/*"] } },
    });
    expect(JSON.parse(encoreTsconfig(undefined, { "#src/*": "./src/*" }))).toEqual({
      compilerOptions: { paths: { "#src/*": ["./src/*"] } },
    });
  });
});
