/**
 * Stackra file contract:
 * Purpose: `ConditionEditor`, the rule builder's editor of one node: a group (`all` or `any`, which may be negated,
 *          with its children and buttons to add a condition or a group), a negation, or a leaf (field, operator and
 *          the operand editor).
 * Boundary: internal to the `./react` entry; recursive. A new condition and a changed field start at the field's
 *          `is_set` test, which needs no value; a changed operator drops the value, so the leaf shows `value_invalid`
 *          until the user fills it in. Lists offer only `Rules.fields()` and the field type's operators.
 * Runtime: browser
 * Governing contract: ADR 0331 (decisions 2, 3, 4 and 8); ADR 0302 (web UI from @stackra/ui).
 */
import { Enum } from "@stackra/contracts";
import { useTranslation } from "@stackra/i18n/react";
import { Button, FieldError, Select, Switch } from "@stackra/ui/react";
import type { ReactElement } from "react";

import { FieldType, Operator } from "#contracts/index";
import type { Condition } from "#core/index";
import type { ConditionEditorProps } from "#react/rule-builder/condition-editor.props";
import { OperandEditor } from "#react/rule-builder/operand-editor";
import { RULE_BUILDER_KEYS as KEYS } from "#react/rule-builder/rule-builder-keys.constant";

/** The path of a child: the parent's path, a dot and the child's segment. */
const join = (path: string, segment: string): string =>
  path === "" ? segment : `${path}.${segment}`;

/**
 * One node of the condition tree.
 *
 * @example
 * <ConditionEditor rules={rules} node={value} path="" problems={problems} isReadOnly={false} onChange={onChange} />
 */
export function ConditionEditor(props: ConditionEditorProps): ReactElement {
  const { rules, node, path, problems, isReadOnly, onChange, onRemove } = props;
  const { t } = useTranslation();
  const problem = problems[path === "" ? "(root)" : path];
  const message = problem === undefined ? undefined : t(KEYS.problem(problem));
  const remove =
    onRemove === undefined || isReadOnly ? null : (
      <Button variant="ghost" onPress={onRemove}>
        {t(KEYS.builder.remove)}
      </Button>
    );

  if ("not" in node)
    return (
      <div className="flex flex-col gap-2 border-s ps-3">
        <Switch
          label={t(KEYS.builder.not)}
          value
          isReadOnly={isReadOnly}
          onChange={(isOn) => {
            if (!isOn) onChange(node.not);
          }}
        />
        <ConditionEditor
          {...props}
          node={node.not}
          path={join(path, "not")}
          onChange={(child) => onChange({ not: child })}
        />
      </div>
    );

  if ("all" in node || "any" in node) {
    const mode = "all" in node ? "all" : "any";
    const children = "all" in node ? node.all : node.any;
    const group = (next: readonly Condition[], kind = mode): Condition =>
      kind === "all" ? { all: next } : { any: next };
    const [first] = rules.fields();
    return (
      <div className="flex flex-col gap-3 rounded-lg border p-3">
        <div className="flex flex-wrap items-end gap-2">
          <Select
            label={t(KEYS.builder.match)}
            items={[
              { id: "all", label: t(KEYS.builder.all) },
              { id: "any", label: t(KEYS.builder.any) },
            ]}
            value={mode}
            isReadOnly={isReadOnly}
            onChange={(next) => {
              if (next === "all" || next === "any") onChange(group(children, next));
            }}
          />
          <Switch
            label={t(KEYS.builder.not)}
            value={false}
            isReadOnly={isReadOnly}
            onChange={(isOn) => {
              if (isOn) onChange({ not: node });
            }}
          />
          {remove}
        </div>
        {message === undefined ? null : <FieldError isInvalid>{message}</FieldError>}
        {children.map((child, index) => (
          <ConditionEditor
            // Children have no identity but their place; a removal re-keys the ones after it.
            // oxlint-disable-next-line react/no-array-index-key -- reason: the items have no identity but their place in the list
            key={index}
            rules={rules}
            node={child}
            path={join(path, `${mode}.${index}`)}
            problems={problems}
            isReadOnly={isReadOnly}
            onChange={(next) =>
              onChange(group(children.map((item, at) => (at === index ? next : item))))
            }
            onRemove={() => onChange(group(children.filter((_, at) => at !== index)))}
          />
        ))}
        {isReadOnly || first === undefined ? null : (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onPress={() =>
                onChange(group([...children, { field: first.path, operator: Operator.IsSet }]))
              }
            >
              {t(KEYS.builder.addCondition)}
            </Button>
            <Button variant="secondary" onPress={() => onChange(group([...children, { all: [] }]))}>
              {t(KEYS.builder.addGroup)}
            </Button>
          </div>
        )}
      </div>
    );
  }

  const field = rules.fieldOf(node.field);
  const operators: readonly Operator[] =
    field === undefined ? [] : Enum.meta(FieldType, field.type).operators;
  return (
    <div className="flex flex-wrap items-end gap-2">
      <Select
        label={t(KEYS.builder.field)}
        items={rules.fields().map((option) => ({ id: option.path, label: t(option.field.label) }))}
        value={field === undefined ? null : node.field}
        isReadOnly={isReadOnly}
        isInvalid={problem === "field_unknown"}
        errorMessage={problem === "field_unknown" ? message : undefined}
        onChange={(next) => {
          if (next !== null && next !== node.field)
            onChange({ field: next, operator: Operator.IsSet });
        }}
      />
      <Select
        label={t(KEYS.builder.operator)}
        items={operators.map((operator) => ({ id: operator, label: t(KEYS.operator(operator)) }))}
        value={operators.includes(node.operator) ? node.operator : null}
        isReadOnly={isReadOnly || field === undefined}
        isInvalid={problem === "operator_not_allowed"}
        errorMessage={problem === "operator_not_allowed" ? message : undefined}
        onChange={(next) => {
          const operator = operators.find((candidate) => candidate === next);
          if (operator !== undefined && operator !== node.operator)
            onChange({ field: node.field, operator });
        }}
      />
      {field === undefined ? null : (
        <OperandEditor
          key={`${node.field}|${node.operator}`}
          field={field}
          operator={node.operator}
          value={node.value}
          isReadOnly={isReadOnly}
          errorMessage={problem === "value_invalid" ? message : undefined}
          onChange={(value) =>
            onChange(
              value === undefined
                ? { field: node.field, operator: node.operator }
                : { field: node.field, operator: node.operator, value },
            )
          }
        />
      )}
      {problem === "node_invalid" || problem === "too_deep" ? (
        <FieldError isInvalid>{message}</FieldError>
      ) : null}
      {remove}
    </div>
  );
}
