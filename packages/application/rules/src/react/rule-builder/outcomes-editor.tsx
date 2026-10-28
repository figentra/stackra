/**
 * Stackra file contract:
 * Purpose: `OutcomesEditor`, the rule builder's editor of what a match yields: a list of outcomes, each a registered
 *          outcome kind and a field per parameter in the parameter's type, with buttons to add and remove one.
 * Boundary: internal to the `./react` entry. It offers only `Rules.outcomeKinds()`; a new outcome and a changed kind
 *           start with no parameters, so each shows `param_missing` until filled in. A parameter past a market floor
 *           shows `past_floor` or `currency_mismatch` from the problems the builder passes. Data only: a value is a
 *           typed element, never an expression (ADR 0331 decision 10).
 * Runtime: browser
 * Governing contract: ADR 0331 (decisions 8, 9 and 10); config-model section 4; ADR 0302 (web UI from @stackra/ui).
 */
import type { Json } from "@stackra/contracts";
import { useTranslation } from "@stackra/i18n/react";
import { Button, FieldError, Select } from "@stackra/ui/react";
import type { ReactElement } from "react";

import { FieldType, Operator } from "#contracts/index";
import type { Outcome } from "#core/index";
import { OperandEditor } from "#react/rule-builder/operand-editor";
import type { OutcomesEditorProps } from "#react/rule-builder/outcomes-editor.props";
import { RULE_BUILDER_KEYS as KEYS } from "#react/rule-builder/rule-builder-keys.constant";

/**
 * The outcomes of a rule.
 *
 * @example
 * <OutcomesEditor rules={rules} outcomes={outcomes} problems={problems} isReadOnly={false} onChange={setOutcomes} />
 */
export function OutcomesEditor({
  rules,
  outcomes,
  problems,
  isReadOnly,
  onChange,
}: OutcomesEditorProps): ReactElement {
  const { t } = useTranslation();
  const kinds = rules.outcomeKinds();
  const [first] = kinds;
  const replace = (index: number, next: Outcome): void =>
    onChange(outcomes.map((item, at) => (at === index ? next : item)));
  const messageAt = (path: string): string | undefined => {
    const code = problems[path];
    return code === undefined ? undefined : t(KEYS.problem(code));
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <strong>{t(KEYS.builder.outcomes)}</strong>
      {messageAt("(root)") === undefined ? null : (
        <FieldError isInvalid>{messageAt("(root)")}</FieldError>
      )}
      {outcomes.map((outcome, index) => {
        const kind = rules.outcomeKind(outcome.kind);
        return (
          // Outcomes have no identity but their place; a removal re-keys the ones after it.
          // oxlint-disable-next-line react/no-array-index-key -- reason: the items have no identity but their place in the list
          <div key={index} className="flex flex-wrap items-end gap-2">
            <Select
              label={t(KEYS.builder.outcome)}
              items={kinds.map((option) => ({ id: option.key, label: t(option.label) }))}
              value={kind === undefined ? null : outcome.kind}
              isReadOnly={isReadOnly}
              isInvalid={problems[String(index)] !== undefined}
              errorMessage={messageAt(String(index))}
              onChange={(next) => {
                if (next !== null && next !== outcome.kind)
                  replace(index, { kind: next, params: {} });
              }}
            />
            {Object.entries(kind?.params ?? {}).map(([name, param]) => (
              <OperandEditor
                key={`${outcome.kind}|${name}`}
                field={param}
                operator={param.type === FieldType.List ? Operator.IncludesAll : Operator.Equals}
                label={param.label}
                value={outcome.params[name]}
                isReadOnly={isReadOnly}
                errorMessage={messageAt(`${index}.params.${name}`)}
                onChange={(value: Json | undefined) => {
                  const { [name]: _dropped, ...rest } = outcome.params;
                  replace(index, {
                    kind: outcome.kind,
                    params: value === undefined ? rest : { ...rest, [name]: value },
                  });
                }}
              />
            ))}
            {isReadOnly ? null : (
              <Button
                variant="ghost"
                onPress={() => onChange(outcomes.filter((_, at) => at !== index))}
              >
                {t(KEYS.builder.remove)}
              </Button>
            )}
          </div>
        );
      })}
      {isReadOnly || first === undefined ? null : (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onPress={() => onChange([...outcomes, { kind: first.key, params: {} }])}
          >
            {t(KEYS.builder.addOutcome)}
          </Button>
        </div>
      )}
    </div>
  );
}
