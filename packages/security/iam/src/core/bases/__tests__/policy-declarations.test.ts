/**
 * Stackra file contract:
 * Purpose: declaration-emit test of the called form `Policy<M>({ permissions })`: a consumer's
 *          `export class ThreadPolicy extends Policy<Thread>({ permissions: ThreadPermissions }) {}` emits a `.d.ts`
 *          with no diagnostic (no TS4094) and names the exported `PolicyClass`.
 * Boundary: test only; compiles one in-memory file against the real source of this package through the `typescript`
 *           compiler API, mapping `#core/*` to `src/core/*`. Only the in-memory file's diagnostics are asserted.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; STA-1680.
 */
import { resolve } from "node:path";

import { describe, expect, it } from "@stackra/testing";
import ts from "typescript";

const root = resolve(import.meta.dirname, "../../../..");
const entry = resolve(root, "src/consumer.ts");
const source = `
import { Permissions } from "#core/bases/permissions.base";
import { Policy } from "#core/bases/policy.base";
import { Permission } from "#core/values/permission.value";

class Thread {}

class ThreadPermissions extends Permissions {
  static readonly read = Permission.L0;
}

export class ThreadPolicy extends Policy<Thread>({ permissions: ThreadPermissions }) {}
`;

function emit() {
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    skipLibCheck: true,
    declaration: true,
    emitDeclarationOnly: true,
    baseUrl: root,
    paths: { "#core/*": ["src/core/*"] },
  };
  const host = ts.createCompilerHost(options);
  const readFile = host.readFile.bind(host);
  const fileExists = host.fileExists.bind(host);
  const getSourceFile = host.getSourceFile.bind(host);
  host.fileExists = (name) => name === entry || fileExists(name);
  host.readFile = (name) => (name === entry ? source : readFile(name));
  host.getSourceFile = (name, languageVersion) =>
    name === entry
      ? ts.createSourceFile(name, source, languageVersion)
      : getSourceFile(name, languageVersion);
  const program = ts.createProgram([entry], options, host);
  const file = program.getSourceFile(entry);
  if (file === undefined) throw new TypeError("the in-memory consumer file was not loaded");
  let declaration = "";
  const result = program.emit(file, (_name, text) => (declaration = text), undefined, true);
  return {
    declaration,
    diagnostics: [...program.getDeclarationDiagnostics(file), ...result.diagnostics],
  };
}

describe("Policy called form, declaration emit", () => {
  it("emits a declaration that names PolicyClass and raises no TS4094", () => {
    const { declaration, diagnostics } = emit();

    expect(diagnostics.map((diagnostic) => diagnostic.code)).not.toContain(4094);
    expect(diagnostics).toEqual([]);
    expect(declaration).toContain("PolicyClass");
  });
});
