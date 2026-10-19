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
