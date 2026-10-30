/**
 * Stackra file contract:
 * Purpose: `omittedNames`, the HeroUI prop names a props type refuses: the string literals of every `Omit<_, …>` second argument.
 * Boundary: a pure function over the TS syntax tree.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.2.
 */
// TypeScript 7 (native) ships no JS API yet; the 6.x alias does (as in @stackra/gen).
import ts from "typescript6";

/** "isPending", "fullWidth" … from `Omit<HeroProps, keyof Contract | "isPending" | "fullWidth">`. */
export function omittedNames(node: ts.Node): string[] {
  const names: string[] = [];
  const collect = (arg: ts.Node): void => {
    if (ts.isLiteralTypeNode(arg) && ts.isStringLiteral(arg.literal)) names.push(arg.literal.text);
    else if (ts.isUnionTypeNode(arg)) arg.types.forEach(collect);
  };
  const visit = (child: ts.Node): void => {
    const omitted = ts.isTypeReferenceNode(child) ? child.typeArguments?.[1] : undefined;
    if (ts.isTypeReferenceNode(child) && child.typeName.getText() === "Omit" && omitted)
      collect(omitted);
    ts.forEachChild(child, visit);
  };
  visit(node);
  return [...new Set(names)];
}
