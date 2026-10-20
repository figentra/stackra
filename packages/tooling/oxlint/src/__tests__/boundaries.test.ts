/**
 * Runs oxlint with the boundaries preset over fixtures/ and proves every import ban fires (STA-167: the
 * last matching override replaced the earlier ones, so only the deep-src ban ever fired). Every line of
 * every fixture is one banned import (the `@boundaries-ignore` comments keep turbo boundaries off them); the fixture folders mimic packages/<category>/<name>/src and services/.
 */
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const fixtures = join(root, "src", "__tests__", "fixtures");

it("boundaries.jsonc reports every banned import in the fixtures", () => {
  const run = spawnSync(
    join(root, "node_modules", ".bin", "oxlint"),
    ["-c", "src/boundaries.jsonc", "-f", "json", fixtures],
    { cwd: root, encoding: "utf8" },
  );
  const { diagnostics } = JSON.parse(run.stdout) as {
    diagnostics: { code: string; filename: string; labels: { span: { line: number } }[] }[];
  };
  const reported = new Set(
    diagnostics
      .filter((d) => d.code === "eslint(no-restricted-imports)")
      .map((d) => `${relative(fixtures, join(root, d.filename))}:${d.labels[0]?.span.line}`),
  );

  const expected = (readdirSync(fixtures, { recursive: true }) as string[])
    .filter((file) => file.endsWith(".ts"))
    .flatMap((file) =>
      readFileSync(join(fixtures, file), "utf8")
        .split("\n")
        .flatMap((line, index) => (line.startsWith("import") ? [`${file}:${index + 1}`] : [])),
    );

  expect(expected.length).toBeGreaterThan(10);
  expect([...reported].toSorted()).toEqual(expected.toSorted());
});
