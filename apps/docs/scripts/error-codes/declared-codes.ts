/**
 * Stackra file contract:
 * Purpose: `declaredCodes(dir, property)`, the codes a tool declares as types: every literal of a `code` member typed
 *          as a string literal or a union of them (the runway `*Issue` types).
 * Boundary: reads the source through `sourceFiles`; a member typed `string` declares no code.
 * Runtime: node
 * Governing contract: ADR 0231 (snake_case machine codes); ADR 0294 (decision 22: a refusal names its code and fix);
 *                     ADR 0282 (decision 3: `stackra check`); ADR 0296 (runway enforcement); STA-2853.
 */
import ts from "typescript6";

import { sourceFiles } from "#scripts/error-codes/source-files";

/**
 * The literals of every `property` member typed as a string literal or a union of them under `dir`.
 *
 * @param dir - the source folder of one tool, such as `packages/developer/runway/src`.
 * @param property - the member name, such as `code`.
 * @returns each code with the files that declare it.
 * @example
 * declaredCodes("packages/developer/runway/src", "code").has("host_collision"); // true
 */
export function declaredCodes(
  dir: string,
  property: string,
): ReadonlyMap<string, readonly string[]> {
  const codes = new Map<string, string[]>();
  for (const { path, file } of sourceFiles(dir)) {
    const visit = (node: ts.Node): void => {
      if (
        ts.isPropertySignature(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === property &&
        node.type !== undefined
      ) {
        const members = ts.isUnionTypeNode(node.type) ? node.type.types : [node.type];
        for (const member of members)
          if (ts.isLiteralTypeNode(member) && ts.isStringLiteral(member.literal))
            codes.set(member.literal.text, [...(codes.get(member.literal.text) ?? []), path]);
      }
      ts.forEachChild(node, visit);
    };
    visit(file);
  }
  return codes;
}
