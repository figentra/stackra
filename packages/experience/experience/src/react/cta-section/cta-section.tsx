/**
 * Stackra file contract:
 * Purpose: `CtaSection`, the marketing kit's call-to-action block: a headline on a raised surface with action buttons,
 *          a newsletter sign-up form, or both.
 * Boundary: composition of @stackra/ui only; the form hands the address to `onSubscribe` and shows `thanks`; it sends
 *           nothing itself. Every word comes in props.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0165 (UI through @stackra/ui); ADR 0060 (light, dark, RTL).
 */
import { Button, Heading, Link, Surface, Text, TextField } from "@stackra/ui/react";
import { type FormEvent, type ReactElement, useId, useState } from "react";

import type { CtaSectionProps } from "#react/cta-section/cta-section.props";

/** No actions. */
const NONE: CtaSectionProps["actions"] & object = [];

/**
 * A headline with its actions or a newsletter form.
 *
 * @example
 * <CtaSection title="Open your shop today" actions={actions} onAction={go} />
 */
export function CtaSection({
  title,
  description,
  actions = NONE,
  onAction,
  newsletter,
  onSubscribe,
  className,
}: CtaSectionProps): ReactElement {
  const id = useId();
  const [isSubscribed, setSubscribed] = useState(false);
  const subscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubscribe?.(String(new FormData(event.currentTarget).get("email") ?? ""));
    setSubscribed(true);
  };
  return (
    <section aria-labelledby={id} className={className}>
      <Surface variant="secondary">
        <div className="flex flex-col items-center gap-4 p-8 text-center">
          <Heading level={2} type="h3" id={id}>
            {title}
          </Heading>
          {description && (
            <Text tone="muted" className="max-w-xl">
              {description}
            </Text>
          )}
          {actions.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3">
              {actions.map((action, index) =>
                action.href ? (
                  <Link key={action.id} href={action.href}>
                    {action.label}
                  </Link>
                ) : (
                  <Button
                    key={action.id}
                    variant={index === 0 ? "primary" : "secondary"}
                    onPress={() => onAction?.(action.id)}
                  >
                    {action.label}
                  </Button>
                ),
              )}
            </div>
          )}
          {newsletter &&
            (isSubscribed ? (
              <Text role="status" tone="success">
                {newsletter.thanks}
              </Text>
            ) : (
              <form onSubmit={subscribe} className="flex w-full max-w-md flex-col gap-2">
                <div className="flex items-end gap-2">
                  <TextField
                    name="email"
                    type="email"
                    label={newsletter.label}
                    placeholder={newsletter.placeholder}
                    autoComplete="email"
                    isRequired
                    isFullWidth
                  />
                  <Button type="submit">{newsletter.submit}</Button>
                </div>
                {newsletter.note && (
                  <Text tone="muted" type="small">
                    {newsletter.note}
                  </Text>
                )}
              </form>
            ))}
        </div>
      </Surface>
    </section>
  );
}
