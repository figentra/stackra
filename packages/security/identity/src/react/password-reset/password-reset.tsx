/**
 * Stackra file contract:
 * Purpose: `PasswordReset`, the identity kit's forgotten-password block: step `request` asks for the email and sends
 *          the link; step `reset` sets the new password from the emailed token, with the policy's checklist under the
 *          field.
 * Boundary: composition of @stackra/ui (`Card`, `TextField`, `PasswordField`, `Button`, `Alert`) and the kit's
 *           `PasswordPolicyChecklist`. It calls nothing itself: `onRequest` and `onReset` are the host's. The sent
 *           message never says whether the address has an account. A failed call shows the host's `failed` words in
 *           an alert; a `reset` step without a token shows them in place of the form.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0206; ADR 0207 (decision 3); ADR 0165 (UI through @stackra/ui);
 *                     OWASP ASVS 2.5 (credential recovery).
 */
import { Alert, Button, Card, PasswordField, TextField } from "@stackra/ui/react";
import { type FormEvent, type ReactElement, useState } from "react";

import { PasswordPolicyChecklist } from "#react/password-policy-checklist/password-policy-checklist";
import type { PasswordResetProps } from "#react/password-reset/password-reset.props";

/**
 * The forgotten-password card.
 *
 * @example
 * <PasswordReset step="request" onRequest={(email) => client.identity.password.forgot({ email })} labels={labels} />
 */
export function PasswordReset({
  step,
  token,
  onRequest,
  onReset,
  policy,
  onDone,
  headingLevel = 2,
  labels,
  className,
}: PasswordResetProps): ReactElement {
  const [password, setPassword] = useState("");
  const [phase, setPhase] = useState<"idle" | "pending" | "sent" | "failed">("idle");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    setPhase("pending");
    try {
      if (step === "request") await onRequest?.(email);
      else await onReset?.({ token: token ?? "", password });
      setPhase(step === "request" ? "sent" : "idle");
      onDone?.();
    } catch {
      setPhase("failed");
    }
  };
  const isLinkMissing = step === "reset" && !token;
  return (
    <Card className={`w-full max-w-sm ${className ?? ""}`}>
      <Card.Header>
        <Card.Title level={headingLevel}>{labels.title}</Card.Title>
        {labels.description && <Card.Description>{labels.description}</Card.Description>}
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        {(phase === "failed" || isLinkMissing) && <Alert tone="danger" title={labels.failed} />}
        {phase === "sent" && <Alert tone="success" title={labels.sent} />}
        {!isLinkMissing && phase !== "sent" && (
          <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-3">
            {step === "request" ? (
              <TextField
                name="email"
                type="email"
                label={labels.email}
                autoComplete="username"
                isRequired
                isFullWidth
              />
            ) : (
              <PasswordField
                name="password"
                label={labels.password}
                autoComplete="new-password"
                value={password}
                onChange={setPassword}
                isRequired
                isFullWidth
                description={
                  policy && labels.rules ? (
                    <PasswordPolicyChecklist
                      policy={policy}
                      password={password}
                      labels={labels.rules}
                    />
                  ) : undefined
                }
              />
            )}
            <Button type="submit" isFullWidth isLoading={phase === "pending"}>
              {labels.submit}
            </Button>
          </form>
        )}
      </Card.Content>
    </Card>
  );
}
