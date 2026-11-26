/**
 * Stackra file contract:
 * Purpose: `renameExports(file, renames, tsMorph)`, the ts-morph half of a source codemod: rewrites one source file's
 *          imports and re-exports of the exports a release moved or renamed. A named import moves to its new module
 *          (the whole import is repointed when all of it moves and nothing of that module is imported yet; otherwise
 *          it joins an import of that module, or a new import is added where the old one was); a renamed import is
 *          renamed with every use in the file, or aliased to its old name when the new name is already taken there or
 *          the file re-exports the old name; an aliased import keeps its alias; a re-export keeps its public name; a
 *          `type` import stays type-only. A namespace import's `ns.Old` becomes `ns.New` when only the name changed,
 *          and is reported when the export moved, since a person picks the new import.
 * Boundary: edits the ts-morph source file it is given, nothing else; the caller reads and writes the text. A
 *           language-service rename rewrites the file's text and may forget node wrappers, so the work is planned by
 *           position (statement index, specifier index) and every node is fetched again after an edit.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2: ts-morph); STA-145.
 */
import type { ImportDeclaration, ImportSpecifier, SourceFile } from "ts-morph";

import type { CodemodEngines } from "#node/upgrade/types/codemod-engines.type";
import type { ExportRename } from "#node/upgrade/types/export-rename.type";
import type { RenameNote } from "#node/upgrade/types/rename-note.type";

type TsMorph = CodemodEngines["tsMorph"];

/** One named import a rename touches, by position. */
type PlannedImport = {
  /** The import declaration's statement index. */
  readonly statement: number;

  /** The specifier's index among the declaration's named imports. */
  readonly specifier: number;

  /** The rename. */
  readonly rename: ExportRename;

  /** The specifier carried its own `type` modifier. */
  readonly typeOnly: boolean;

  /** The local name after the rename pass: its alias when it has one, else the exported name. */
  local?: string;
};

/** The rename of `name` exported from `module`, if any. */
function renameOf(
  renames: readonly ExportRename[],
  module: string,
  name: string,
): ExportRename | undefined {
  return renames.find((rename) => rename.name === name && rename.from.includes(module));
}

/** The import declaration at a statement index. */
function importAt(file: SourceFile, statement: number, tsMorph: TsMorph): ImportDeclaration {
  const node = file.getStatements()[statement];
  if (node === undefined) throw new Error(`no statement ${statement}`);
  return node.asKindOrThrow(tsMorph.SyntaxKind.ImportDeclaration);
}

/** The named import at a planned position. */
function specifierAt(file: SourceFile, planned: PlannedImport, tsMorph: TsMorph): ImportSpecifier {
  const specifier = importAt(file, planned.statement, tsMorph).getNamedImports()[planned.specifier];
  if (specifier === undefined) throw new Error(`no named import ${planned.specifier}`);
  return specifier;
}

/**
 * True when the local name must stay `old`: `next` is already an identifier in the file (a rename to it could
 * collide), or the file re-exports `old` by its bare name (`export { Old }`), whose public name must not change.
 */
function keepsOld(file: SourceFile, old: string, next: string, tsMorph: TsMorph): boolean {
  return (
    file
      .getDescendantsOfKind(tsMorph.SyntaxKind.Identifier)
      .some((identifier) => identifier.getText() === next) ||
    file
      .getExportDeclarations()
      .some(
        (declaration) =>
          declaration.getModuleSpecifier() === undefined &&
          declaration
            .getNamedExports()
            .some(
              (specifier) => specifier.getName() === old && specifier.getAliasNode() === undefined,
            ),
      )
  );
}

/** The uses of every namespace import (`ns.Name` in values and types), with the namespace's module. */
function namespaceUses(
  file: SourceFile,
  tsMorph: TsMorph,
): {
  readonly module: string;
  readonly start: number;
  readonly end: number;
  readonly name: string;
  readonly use: string;
  readonly at: number;
}[] {
  const { SyntaxKind } = tsMorph;
  const uses: {
    module: string;
    start: number;
    end: number;
    name: string;
    use: string;
    at: number;
  }[] = [];
  for (const declaration of file.getImportDeclarations()) {
    const namespace = declaration.getNamespaceImport()?.getText();
    if (namespace === undefined) continue;
    const module = declaration.getModuleSpecifierValue();
    for (const use of file.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression))
      if (use.getExpression().getText() === namespace) {
        const name = use.getNameNode();
        uses.push({
          module,
          start: name.getStart(),
          end: name.getEnd(),
          name: name.getText(),
          use: use.getText(),
          at: use.getStart(),
        });
      }
    for (const use of file.getDescendantsOfKind(SyntaxKind.QualifiedName))
      if (use.getLeft().getText() === namespace) {
        const name = use.getRight();
        uses.push({
          module,
          start: name.getStart(),
          end: name.getEnd(),
          name: name.getText(),
          use: use.getText(),
          at: use.getStart(),
        });
      }
  }
  return uses;
}

/** `ns.Old` to `ns.New` for every namespace use of an export that was only renamed. */
function renameNamespaceUses(
  file: SourceFile,
  renames: readonly ExportRename[],
  tsMorph: TsMorph,
): void {
  const edits = namespaceUses(file, tsMorph).flatMap((use) => {
    const rename = renameOf(renames, use.module, use.name);
    return rename?.to === use.module && rename.rename !== undefined
      ? [{ ...use, text: rename.rename }]
      : [];
  });
  // Last first, so each range still points at its text.
  for (const edit of edits.toSorted((a, b) => b.start - a.start))
    file.replaceText([edit.start, edit.end], edit.text);
}

/** The notes for namespace uses of an export that moved to another module. */
function movedNamespaceNotes(
  file: SourceFile,
  renames: readonly ExportRename[],
  tsMorph: TsMorph,
): RenameNote[] {
  return namespaceUses(file, tsMorph)
    .flatMap((use) => {
      const rename = renameOf(renames, use.module, use.name);
      if (rename === undefined || rename.to === use.module) return [];
      const { line, column } = file.getLineAndColumnAtPos(use.at);
      return [
        {
          line,
          column,
          code: use.use.split("\n")[0] ?? "",
          message: `${rename.name} moved to ${rename.to}${rename.rename === undefined ? "" : ` as ${rename.rename}`}: import it from there`,
        },
      ];
    })
    .toSorted((a, b) => a.line - b.line || a.column - b.column);
}

/** Every named import a rename touches, by position. */
function planImports(
  file: SourceFile,
  renames: readonly ExportRename[],
  tsMorph: TsMorph,
): PlannedImport[] {
  const planned: PlannedImport[] = [];
  file.getStatements().forEach((statement, index) => {
    if (!tsMorph.Node.isImportDeclaration(statement)) return;
    const module = statement.getModuleSpecifierValue();
    statement.getNamedImports().forEach((specifier, at) => {
      const rename = renameOf(renames, module, specifier.getName());
      if (rename !== undefined)
        planned.push({ statement: index, specifier: at, rename, typeOnly: specifier.isTypeOnly() });
    });
  });
  return planned;
}

/**
 * Renames each planned import to its new exported name. An aliased import keeps its alias; an unaliased one is
 * renamed with every use in the file (the language service's rename), or aliased to its old name when that must stay.
 */
function renameImports(
  file: SourceFile,
  planned: readonly PlannedImport[],
  tsMorph: TsMorph,
): void {
  for (const entry of planned) {
    const old = entry.rename.name;
    const next = entry.rename.rename ?? old;
    const specifier = specifierAt(file, entry, tsMorph);
    const alias = specifier.getAliasNode()?.getText();
    entry.local = alias ?? next;
    if (next === old) continue;
    if (alias !== undefined) specifier.setName(next);
    else if (keepsOld(file, old, next, tsMorph)) {
      specifier.setName(next);
      specifierAt(file, entry, tsMorph).setAlias(old);
      entry.local = old;
    } else {
      const name = specifier.getNameNode();
      // An unaliased import is always an identifier; a string name (`"a-b" as b`) always has an alias.
      if (tsMorph.Node.isIdentifier(name)) name.rename(next);
      else specifier.setName(next);
    }
  }
}

/** An import of `module`, other than the one at `except`, that can take more named imports of the same kind. */
function joinable(
  file: SourceFile,
  module: string,
  typeOnly: boolean,
  except: number,
  tsMorph: TsMorph,
): ImportDeclaration | undefined {
  return file
    .getStatements()
    .flatMap((statement, index) =>
      index !== except && tsMorph.Node.isImportDeclaration(statement) ? [statement] : [],
    )
    .find(
      (declaration) =>
        declaration.getModuleSpecifierValue() === module &&
        declaration.isTypeOnly() === typeOnly &&
        declaration.getNamespaceImport() === undefined,
    );
}

/** Moves the planned named imports of the declaration at `statement` to their new modules. */
function moveImports(
  file: SourceFile,
  statement: number,
  moving: readonly PlannedImport[],
  tsMorph: TsMorph,
): void {
  const declaration = importAt(file, statement, tsMorph);
  const typeOnly = declaration.isTypeOnly();
  const entries = moving.map((entry) => {
    const name = entry.rename.rename ?? entry.rename.name;
    const local = entry.local ?? name;
    return {
      to: entry.rename.to,
      name,
      ...(local === name ? {} : { alias: local }),
      isTypeOnly: !typeOnly && entry.typeOnly,
    };
  });
  const targets = [...new Set(entries.map((entry) => entry.to))];
  const keeps =
    declaration.getNamedImports().length > moving.length ||
    declaration.getDefaultImport() !== undefined;
  const [single] = targets;
  // All of it moves to one module nothing imports yet: repoint it, so its layout and blank lines stay as written.
  if (
    !keeps &&
    targets.length === 1 &&
    single !== undefined &&
    joinable(file, single, typeOnly, statement, tsMorph) === undefined
  ) {
    declaration.setModuleSpecifier(single);
    return;
  }
  if (keeps)
    for (const entry of moving.toSorted((a, b) => b.specifier - a.specifier))
      specifierAt(file, entry, tsMorph).remove();
  else declaration.remove();
  let index = keeps ? statement + 1 : statement;
  for (const module of targets) {
    const named = entries
      .filter((entry) => entry.to === module)
      .map(({ to: _to, ...entry }) => entry);
    const target = joinable(file, module, typeOnly, keeps ? statement : -1, tsMorph);
    if (target === undefined) {
      file.insertImportDeclaration(index++, {
        moduleSpecifier: module,
        isTypeOnly: typeOnly,
        namedImports: named,
      });
      continue;
    }
    const present = new Set(
      target
        .getNamedImports()
        .map((specifier) => specifier.getAliasNode()?.getText() ?? specifier.getName()),
    );
    for (const entry of named)
      if (!present.has(entry.alias ?? entry.name)) target.addNamedImport(entry);
  }
}

/** Rewrites the re-export at `statement` (`export { X } from "old"`), keeping each public name. */
function rewriteExport(
  file: SourceFile,
  statement: number,
  renames: readonly ExportRename[],
  tsMorph: TsMorph,
): void {
  const at = () => {
    const node = file.getStatements()[statement];
    if (node === undefined) throw new Error(`no statement ${statement}`);
    return node.asKindOrThrow(tsMorph.SyntaxKind.ExportDeclaration);
  };
  const module = at().getModuleSpecifierValue() ?? "";
  const typeOnly = at().isTypeOnly();
  const moving: { name: string; alias: string; isTypeOnly: boolean; to: string }[] = [];
  // Last first, so a removal leaves the earlier indices in place.
  for (let index = at().getNamedExports().length - 1; index >= 0; index--) {
    const specifier = at().getNamedExports()[index];
    if (specifier === undefined) continue;
    const rename = renameOf(renames, module, specifier.getName());
    if (rename === undefined) continue;
    const next = rename.rename ?? rename.name;
    const alias = specifier.getAliasNode()?.getText() ?? rename.name;
    if (rename.to === module) {
      specifier.setName(next);
      if (alias !== next) at().getNamedExports()[index]?.setAlias(alias);
      continue;
    }
    moving.unshift({ name: next, alias, isTypeOnly: specifier.isTypeOnly(), to: rename.to });
    specifier.remove();
  }
  if (moving.length === 0) return;
  let index = statement + 1;
  if (at().getNamedExports().length === 0) {
    at().remove();
    index = statement;
  }
  for (const target of new Set(moving.map((entry) => entry.to)))
    file.insertExportDeclaration(index++, {
      moduleSpecifier: target,
      isTypeOnly: typeOnly,
      namedExports: moving
        .filter((entry) => entry.to === target)
        .map(({ name, alias, isTypeOnly }) => ({
          name,
          ...(alias === name ? {} : { alias }),
          isTypeOnly: !typeOnly && isTypeOnly,
        })),
    });
}

/**
 * Apply one codemod's renames to a source file.
 *
 * @returns the places left to a person (namespace uses of a moved export).
 * @example
 * renameExports(file, [{ name: "DeviceSession", from: ["@stackra/identity/contracts"],
 *   to: "@stackra/identity/contracts", rename: "AccountSession" }], tsMorph); // []
 */
export function renameExports(
  file: SourceFile,
  renames: readonly ExportRename[],
  tsMorph: TsMorph,
): readonly RenameNote[] {
  renameNamespaceUses(file, renames, tsMorph);
  const planned = planImports(file, renames, tsMorph);
  renameImports(file, planned, tsMorph);
  // Moves change the statement list, so they run last statement first: an earlier index never shifts.
  const moves = planned.filter(
    (entry) =>
      entry.rename.to !== importAt(file, entry.statement, tsMorph).getModuleSpecifierValue(),
  );
  for (const statement of [...new Set(moves.map((entry) => entry.statement))].toSorted(
    (a, b) => b - a,
  ))
    moveImports(
      file,
      statement,
      moves.filter((entry) => entry.statement === statement),
      tsMorph,
    );
  const reexports = file
    .getStatements()
    .flatMap((statement, index) =>
      tsMorph.Node.isExportDeclaration(statement) &&
      renames.some((rename) => rename.from.includes(statement.getModuleSpecifierValue() ?? ""))
        ? [index]
        : [],
    );
  for (const statement of reexports.toReversed()) rewriteExport(file, statement, renames, tsMorph);
  return movedNamespaceNotes(file, renames, tsMorph);
}
