/**
 * Stackra file contract:
 * Purpose: hold `jsonc.mjs` to its contract: comments and trailing commas dropped, `//` inside strings kept, an
 *          unterminated comment refused.
 * Boundary: pure function; no file access.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0182 (testing strategy).
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { stripJsonc } from "../jsonc.mjs";

test("stripJsonc drops comments and trailing commas but keeps // inside strings", () => {
  const text = `// header
{
  /* block */ "url": "https://x.dev/a//b", // trailing
  "list": [1, 2,],
}`;
  assert.deepEqual(JSON.parse(stripJsonc(text)), { url: "https://x.dev/a//b", list: [1, 2] });
  assert.throws(() => stripJsonc("{} /* open"), /unterminated/);
});
