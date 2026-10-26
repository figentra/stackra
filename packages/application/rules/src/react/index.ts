/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/rules (`RuleBuilder` and its props) until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Web only: the builder is built on `@stackra/ui/react`; a
 *           `./native` entry is added once a native builder exists. It imports `.` and `./contracts`.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 15); ADR 0331 (decisions 8 and 12); the STA-347 stand-in barrel decision.
 */
export { RuleBuilder } from "#react/rule-builder/rule-builder";
export type { RuleBuilderProps } from "#react/rule-builder/rule-builder.props";
