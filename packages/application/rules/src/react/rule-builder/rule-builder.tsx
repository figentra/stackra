/**
 * Stackra file contract:
 * Purpose: `RuleBuilder`, the rule-builder panel: edits a condition tree of `all` and `any` groups, negation and
 *          leaves, offering only the consumer's registered fields and the operators of each field's type; and, for a
 *          consumer with outcome kinds, the outcomes a match yields, each parameter in its type.
 * Boundary: composition only, on `@stackra/ui`'s free web components. Controlled: every change is reported whole and
 *           the problems `Rules.problems`, `outcomeProblems` and, given the market's floors, `floorProblems` find are
 *           shown where they are; saving, and the server-side check, are the host's (`RuleSetService.draft` with the
 *           same floors refuses what is marked). It writes data only: there is no way to type an expression (ADR 0331
 *           decision 10).
 * Runtime: browser
 * Governing contract: ADR 0331 (decisions 3, 4, 8, 9 and 10); ADR 0302 (web UI from @stackra/ui); config-model
 *                     section 4; ADR 0425 (decision 3).
 */
import { type ReactElement, useMemo } from "react";

import { ConditionEditor } from "#react/rule-builder/condition-editor";
import { OutcomesEditor } from "#react/rule-builder/outcomes-editor";
import type { RuleBuilderProps } from "#react/rule-builder/rule-builder.props";

/**
 * The rule builder.
 *
 * @example
 * const [condition, setCondition] = useState<Condition>({ all: [] });
 * const [outcomes, setOutcomes] = useState<readonly Outcome[]>([]);
 * <RuleBuilder rules={RETURNS_RULES} value={condition} onChange={setCondition} outcomes={outcomes}
 *   onOutcomesChange={setOutcomes} floors={floors} />
 */
export function RuleBuilder({
  rules,
  value,
  onChange,
  outcomes = [],
  onOutcomesChange,
  floors,
  isReadOnly = false,
}: RuleBuilderProps): ReactElement {
  const problems = useMemo(() => rules.problems(value), [rules, value]);
  const outcomeProblems = useMemo(() => {
    const found = rules.outcomeProblems(outcomes);
    return Object.keys(found).length > 0 || floors === undefined
      ? found
      : rules.floorProblems(outcomes, floors);
  }, [rules, outcomes, floors]);
  return (
    <div className="flex flex-col gap-4">
      <ConditionEditor
        rules={rules}
        node={value}
        path=""
        problems={problems}
        isReadOnly={isReadOnly}
        onChange={onChange}
      />
      {onOutcomesChange === undefined ? null : (
        <OutcomesEditor
          rules={rules}
          outcomes={outcomes}
          problems={outcomeProblems}
          isReadOnly={isReadOnly}
          onChange={onOutcomesChange}
        />
      )}
    </div>
  );
}
