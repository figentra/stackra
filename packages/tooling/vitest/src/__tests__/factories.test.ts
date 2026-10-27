/**
 * Stackra file contract:
 * Purpose: proves the role presets: the service preset splits unit and int projects with decorators on, the library
 *          preset adds the optional react and native projects and the coverage gate, the app preset keeps jsdom plus
 *          a node project per folder, the mobile preset is jsdom with decorators, and the tooling preset is plain Node.
 * Boundary: test only; reads the config objects, runs no project.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0005 (legacy decorators); ADR 0295 (decision 5).
 */
import { describe, expect, it } from "vitest";

import { appPreset, libraryPreset, mobilePreset, servicePreset, toolingPreset } from "../index.ts";

/** The fields of a project entry these tests read. */
type Project = {
  test: { name?: string; include?: string[]; exclude?: string[]; environment?: string };
  resolve?: { alias?: Record<string, string> };
};

/** The project entries of a config. */
const projectsOf = (config: { test?: { projects?: unknown } }): Project[] =>
  (config.test?.projects ?? []) as Project[];

const legacyOf = (config: unknown): boolean | undefined =>
  (config as { oxc?: { decorator?: { legacy?: boolean } } }).oxc?.decorator?.legacy;

describe("servicePreset", () => {
  it("runs unit and int tests as two projects with legacy decorators", () => {
    const config = servicePreset({ root: "/svc", exclude: ["src/skip/**"] });
    const [unit, int] = projectsOf(config);

    expect(config.root).toBe("/svc");
    expect(legacyOf(config)).toBe(true);
    expect(unit?.test.name).toBe("unit");
    expect(unit?.test.include).toEqual(["src/**/__tests__/**/*.test.ts"]);
    expect(unit?.test.exclude).toContain("src/**/__tests__/**/*.int.test.ts");
    expect(unit?.test.exclude).toContain("src/skip/**");
    expect(int?.test.name).toBe("int");
    expect(int?.test.include).toEqual(["src/**/__tests__/**/*.int.test.ts"]);
  });
});

describe("libraryPreset", () => {
  it("adds only the unit and int projects without react or native", () => {
    const names = projectsOf(libraryPreset({ root: "/pkg" })).map((p) => p.test.name);

    expect(names).toEqual(["unit", "int"]);
  });

  it("adds a jsdom react project and a native project that aliases react-native", () => {
    const config = libraryPreset({ root: "/pkg", react: "src/react", native: "src/native" });
    const projects = projectsOf(config);
    const react = projects.find((p) => p.test.name === "react");
    const native = projects.find((p) => p.test.name === "native");

    expect(react?.test.environment).toBe("jsdom");
    expect(react?.test.include).toEqual(["src/react/**/__tests__/**/*.test.tsx"]);
    expect(native?.test.include).toEqual(["src/native/**/__tests__/**/*.test.tsx"]);
    expect(native?.resolve?.alias?.["react-native"]).toBe("react-native-web");
  });

  it("is under the shared coverage gate", () => {
    const thresholds = libraryPreset({ root: "/pkg" }).test?.coverage?.thresholds;

    expect(thresholds).toBeDefined();
  });
});

describe("appPreset", () => {
  it("runs everything in jsdom and each node folder as its own node project", () => {
    const config = appPreset({
      root: "/app",
      nodeFolders: ["src/main"],
      exclude: ["**/*.e2e.test.ts"],
    });
    const [jsdom, node] = projectsOf(config);

    expect(legacyOf(config)).toBe(true);
    expect(jsdom?.test.name).toBe("jsdom");
    expect(jsdom?.test.include).toEqual(["src/**/__tests__/**/*.test.{ts,tsx}"]);
    expect(jsdom?.test.exclude).toEqual(
      expect.arrayContaining(["src/main/**", "**/*.e2e.test.ts"]),
    );
    expect(node?.test.name).toBe("src/main");
    expect(node?.test.environment).toBe("node");
  });

  it("has only the jsdom project without node folders", () => {
    expect(projectsOf(appPreset({ root: "/app" }))).toHaveLength(1);
  });
});

describe("mobilePreset", () => {
  it("is jsdom with legacy decorators over ts and tsx tests", () => {
    const config = mobilePreset({ root: "/mobile" });

    expect(config.root).toBe("/mobile");
    expect(config.test?.environment).toBe("jsdom");
    expect(config.test?.include).toEqual(["src/**/__tests__/**/*.test.{ts,tsx}"]);
    expect(legacyOf(config)).toBe(true);
  });
});

describe("toolingPreset", () => {
  it("is plain Node, fails an empty suite and has no decorators or coverage", () => {
    expect(toolingPreset.test?.environment).toBe("node");
    expect(toolingPreset.test?.passWithNoTests).toBe(false);
    expect(toolingPreset.test?.include).toEqual(["src/**/__tests__/**/*.test.ts"]);
    expect(legacyOf(toolingPreset)).toBeUndefined();
    expect(toolingPreset.test?.coverage).toBeUndefined();
  });
});
