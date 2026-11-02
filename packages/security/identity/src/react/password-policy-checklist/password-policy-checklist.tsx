/**
 * Stackra file contract:
 * Purpose: `PasswordPolicyChecklist`, the identity kit's password rules as the user types: a meter of how many rules
 *          the password meets and a list of each rule the policy sets, marked met or not yet.
 * Boundary: composition of @stackra/ui (`Meter`, `Icon`, `Text`); pure over its props. The length counts characters
 *           (code points), so an Arabic or emoji password counts as typed; letters and digits are Unicode classes. It
 *           guides only: the provider checks the password on submit.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0207 (decision 3); ADR 0165 (UI through @stackra/ui); WCAG 2.2
 *                     SC 3.3.2 and 1.4.1 (not by colour alone).
 */
import { Icon, Meter, Text } from "@stackra/ui/react";
import type { ReactElement } from "react";

import type { PasswordPolicyChecklistProps } from "#react/password-policy-checklist/password-policy-checklist.props";

/** Each rule a policy can switch on: its word, the policy's flag and its check. */
const RULES = [
  { key: "uppercase", flag: "hasUppercase", test: (password: string) => /\p{Lu}/u.test(password) },
  { key: "lowercase", flag: "hasLowercase", test: (password: string) => /\p{Ll}/u.test(password) },
  { key: "number", flag: "hasNumber", test: (password: string) => /\p{Nd}/u.test(password) },
  { key: "symbol", flag: "hasSymbol", test: (password: string) => /[^\p{L}\p{N}]/u.test(password) },
] as const;

/**
 * The password rules, checked live.
 *
 * @example
 * <PasswordPolicyChecklist id="password-rules" policy={policy} password={password} labels={labels} />
 */
export function PasswordPolicyChecklist({
  policy,
  password,
  id,
  labels,
  className,
}: PasswordPolicyChecklistProps): ReactElement {
  const rules = [
    { key: "minLength" as const, isMet: [...password].length >= policy.minLength },
    ...RULES.filter((rule) => policy[rule.flag]).map((rule) => ({
      key: rule.key,
      isMet: rule.test(password),
    })),
  ];
  const met = rules.filter((rule) => rule.isMet).length;
  return (
    <div id={id} className={`flex flex-col gap-2 ${className ?? ""}`}>
      <Meter label={labels.label} value={met} maxValue={rules.length} optimum={rules.length} />
      <ul aria-label={labels.label} className="flex flex-col gap-1">
        {rules.map((rule) => (
          <li key={rule.key} className="flex items-center gap-2">
            <Icon
              name={rule.isMet ? "circle-check" : "circle"}
              size="sm"
              tone={rule.isMet ? "success" : "muted"}
              label={rule.isMet ? labels.met : labels.unmet}
            />
            <Text elementType="span" type="small" tone={rule.isMet ? "default" : "muted"}>
              {labels[rule.key]}
            </Text>
          </li>
        ))}
      </ul>
    </div>
  );
}
