/**
 * Stackra file contract:
 * Purpose: `RuleBuilder`, the rule-builder panel: edits a condition tree of `all` and `any` groups, negation and
 *          leaves, offering only the consumer's registered fields and the operators of each field's type.
 * Boundary: composition only, on `@stackra/ui`'s free web components. Controlled: every change is reported whole and
 *           the problems `Rules.problems` finds are shown at their nodes; saving, and the server-side check, are the
 *           host's. It writes data only: there is no way to type an expression (ADR 0331 decision 10).
 * Runtime: react
 * Governing contract: ADR 0331 (decisions 3, 4, 8 and 10); ADR 0302 (web UI from @stackra/ui).
 */
import { type ReactElement, useMemo } from "react";

import { ConditionEditor } from "#react/rule-builder/condition-editor";
import type { RuleBuilderProps } from "#react/rule-builder/rule-builder.props";

/**
 * The rule builder.
 *
 * @example
 * const [condition, setCondition] = useState<Condition>({ all: [] });
 * <RuleBuilder rules={DISCOUNT_RULES} value={condition} onChange={setCondition} />
 */
export function RuleBuilder({
  rules,
  value,
  onChange,
  isReadOnly = false,
}: RuleBuilderProps): ReactElement {
  const problems = useMemo(() => rules.problems(value), [rules, value]);
  return (
    <ConditionEditor
      rules={rules}
      node={value}
      path=""
      problems={problems}
      isReadOnly={isReadOnly}
      onChange={onChange}
    />
  );
}
