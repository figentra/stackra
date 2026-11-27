/**
 * Stackra file contract:
 * Purpose: unit tests of `toolEnv`: every `node_modules/.bin` from the directory up goes in front of the inherited
 *          path, the run's own variables are kept, and a Windows `Path` (any spelling) leaves exactly one `PATH` key,
 *          so the bins come first however the child reads it.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0295 (decision 5); STA-2899.
 */
import { delimiter, join, parse } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { toolEnv } from "#node/functions/tool-env.function";

const root = parse(process.cwd()).root;
const member = join(root, "work", "app", "services", "api");
const bins = [
  join(member, "node_modules", ".bin"),
  join(root, "work", "app", "services", "node_modules", ".bin"),
  join(root, "work", "app", "node_modules", ".bin"),
  join(root, "work", "node_modules", ".bin"),
  join(root, "node_modules", ".bin"),
];

/** The keys of `env` that name the search path, in any spelling. */
const pathKeys = (env: NodeJS.ProcessEnv) => Object.keys(env).filter((key) => /^path$/iu.test(key));

describe("toolEnv", () => {
  it("puts every node_modules/.bin from the directory up in front of the inherited PATH", () => {
    const env = toolEnv(member, { STACKRA_DEV_SURFACE: "web" }, { PATH: "/usr/bin", HOME: "/h" });
    expect(env["PATH"]).toBe([...bins, "/usr/bin"].join(delimiter));
    expect(env["STACKRA_DEV_SURFACE"]).toBe("web");
    expect(env["HOME"]).toBe("/h");
  });

  it("leaves one PATH key when the inherited environment spells it Path, as Windows does", () => {
    const env = toolEnv(
      member,
      {},
      { Path: "C:\\Windows\\system32", ComSpec: "C:\\Windows\\cmd.exe" },
    );
    expect(pathKeys(env)).toEqual(["PATH"]);
    expect(env["PATH"]).toBe([...bins, "C:\\Windows\\system32"].join(delimiter));
    expect(env["ComSpec"]).toBe("C:\\Windows\\cmd.exe");
  });

  it("takes a PATH the run sets as the inherited one", () => {
    const env = toolEnv(member, { PATH: "/opt/tools" }, { Path: "/usr/bin" });
    expect(pathKeys(env)).toEqual(["PATH"]);
    expect(env["PATH"]).toBe([...bins, "/opt/tools"].join(delimiter));
  });

  it("still lists the bins when nothing is inherited", () => {
    expect(toolEnv(member, {}, {})["PATH"]).toBe(bins.join(delimiter));
  });
});
