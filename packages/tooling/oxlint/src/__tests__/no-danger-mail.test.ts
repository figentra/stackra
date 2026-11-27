/**
 * Stackra file contract:
 * Purpose: runs oxlint with the boundaries preset over fixtures/mail and proves the STA-2582 guard: raw
 *          `dangerouslySetInnerHTML` in a `.mail.tsx` body is reported (tenant HTML goes through `useMail().richText`,
 *          which sanitizes it), and the same markup outside a mail body is not reported by the mail rule.
 * Boundary: test only; the fixture folder mimics packages/<category>/<name>/src/react.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-2582 (`sanitizeHtml` on mailed HTML).
 */
import { spawnSync } from "node:child_process";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const fixtures = join(root, "src", "__tests__", "fixtures", "mail");

it("boundaries.jsonc refuses raw HTML in a mail body and only there", () => {
  const run = spawnSync(
    join(root, "node_modules", ".bin", "oxlint"),
    ["-c", "src/boundaries.jsonc", "-f", "json", fixtures],
    { cwd: root, encoding: "utf8" },
  );
  const { diagnostics } = JSON.parse(run.stdout) as {
    diagnostics: { code: string; filename: string }[];
  };
  const files = diagnostics
    .filter((d) => d.code === "react(no-danger)")
    .map((d) => relative(fixtures, join(root, d.filename)));

  expect(files).toEqual(["packages/communication/demo/src/react/welcome.mail.tsx"]);
});
